# ai_service/main.py
import mysql.connector
from typing import List, Optional
import requests
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
import json

# === [BẮT ĐẦU THÊM MỚI 1] IMPORT THƯ VIỆN CHO FEATURE 3 (K-MEANS) ===
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
# === [KẾT THÚC THÊM MỚI 1] ===

import os
from dotenv import load_dotenv
load_dotenv() 
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    raise ValueError("LỖI: Chưa tìm thấy GOOGLE_API_KEY trong file .env")

app = FastAPI()

# --- HÀM LẤY DỮ LIỆU TỪ MYSQL ---
def get_products_context():
    try:
        conn = mysql.connector.connect(host="localhost", user="root", password="", database="shop_ai_db")
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT name, price, description, stock FROM Product")
        products = cursor.fetchall()
        conn.close()
        text = "DANH SÁCH SẢN PHẨM TRONG KHO:\n"
        for p in products:
            text += f"- {p['name']} (Giá: {p['price']} VND, Kho: {p['stock']}). Chi tiết: {p['description']}\n"
        return text
    except Exception:
        return ""

class ChatRequest(BaseModel):
    question: str
class HistoryItem(BaseModel):
    role: str    # 'user' hoặc 'model'
    content: str
class ChatRequest(BaseModel):
    question: str
    history: Optional[List[HistoryItem]] = []
# --- API 1: CHATBOT ---
@app.post("/chatbot")
async def chat_endpoint(req: ChatRequest):
    context = get_products_context()
    system_prompt = f"""Bạn là nhân viên tư vấn thời trang thân thiện của Fashion AI Shop.
Dựa trên danh sách sản phẩm sau để tư vấn khách hàng, trả lời ngắn gọn và tự nhiên:

{context}

Lưu ý: Nếu khách hỏi về sản phẩm không có trong danh sách, hãy thành thật nói không có hàng.
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"

    try:
        contents = []
        contents.append({
            "role": "user",
            "parts": [{"text": system_prompt}]
        })
        contents.append({
            "role": "model",
            "parts": [{"text": "Tôi đã hiểu. Tôi sẵn sàng tư vấn thời trang cho khách hàng!"}]
        })

        # ✅ Thêm history vào (tối đa 6 lượt = 3 cặp hỏi-đáp)
        for item in (req.history or [])[-6:]:
            role = item.role if item.role in ['user', 'model'] else 'user'
            contents.append({
                "role": role,
                "parts": [{"text": item.content}]
            })
        contents.append({
            "role": "user",
            "parts": [{"text": req.question}]
        })

        payload = {"contents": contents}

        response = requests.post(
            url,
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=18 
        )
        result = response.json()

        if "candidates" in result:
            return {"reply": result['candidates'][0]['content']['parts'][0]['text']}
        print(">>> LỖI GEMINI CHATBOT:", result)
        return {"reply": "Xin lỗi, AI chưa hiểu rõ ý bạn. Bạn có thể hỏi lại không?"}

    except requests.exceptions.Timeout:
        return {"reply": "AI đang bận, vui lòng thử lại sau vài giây nhé!"}
    except Exception as e:
        print(f"LỖI CHATBOT: {e}")
        return {"reply": "Hệ thống đang bảo trì."}
        
# --- API 2: DỰ BÁO DOANH THU & TOP BÁN CHẠY ---
@app.get("/predict-revenue")
def predict_revenue():
    try:
        conn = mysql.connector.connect(host="localhost", user="root", password="", database="shop_ai_db")
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT createdAt, totalAmount FROM `Order` WHERE status = 'COMPLETED'")
        order_rows = cursor.fetchall()

        if not order_rows:
            return {
                "data": [],
                "analysis": {
                    "trend": "CHƯA RÕ", "growth_rate": 0,
                    "advice": "Chưa có dữ liệu", "season_tip": "Chưa có dữ liệu",
                    "top_products": []
                }
            }

        df = pd.DataFrame(order_rows)
        df['createdAt'] = pd.to_datetime(df['createdAt'])

        # ✅ FIX 1: Ép kiểu totalAmount sang float trước khi resample
        # MySQL trả về Decimal, Pandas giữ nguyên kiểu đó → Recharts đọc sai
        df['totalAmount'] = df['totalAmount'].astype(float)

        # ✅ FIX 2: Sort theo thời gian trước khi resample để đảm bảo thứ tự tháng đúng
        df = df.sort_values('createdAt')

        try:
            monthly_revenue = df.resample('ME', on='createdAt')['totalAmount'].sum().reset_index()
        except Exception:
            monthly_revenue = df.resample('M', on='createdAt')['totalAmount'].sum().reset_index()

        monthly_revenue.columns = ['Date', 'Revenue']

        # ✅ FIX 3: Ép kiểu Revenue sang float thuần (tránh numpy.float64 gây lỗi JSON)
        monthly_revenue['Revenue'] = monthly_revenue['Revenue'].astype(float)

        # ✅ FIX 4: Chỉ lấy 12 tháng gần nhất để biểu đồ không quá dài
        monthly_revenue = monthly_revenue.tail(12).reset_index(drop=True)

        # Linear Regression dự báo tháng tới
        monthly_revenue['Month_Index'] = np.arange(len(monthly_revenue))
        X = monthly_revenue[['Month_Index']]
        y = monthly_revenue['Revenue']

        model = LinearRegression()
        model.fit(X, y)
        future_X = pd.DataFrame({'Month_Index': [len(monthly_revenue)]})
        next_month_revenue = float(model.predict(future_X)[0])  # ✅ FIX: ép kiểu float rõ ràng

        # ✅ FIX 5: Label tháng/năm rõ ràng (T01/25 thay vì chỉ T01)
        # Tránh trường hợp có 2 tháng 1 của 2 năm khác nhau trùng nhãn
        chart_data = []
        for _, row in monthly_revenue.iterrows():
            chart_data.append({
                "name": row['Date'].strftime("T%m/%y"),        # VD: T01/25
                "revenue": round(float(row['Revenue'])),        # ✅ round + float rõ ràng
                "prediction": None
            })

        # Thêm điểm dự báo tháng tiếp theo
        last_date = monthly_revenue.iloc[-1]['Date']
        next_date = last_date + pd.DateOffset(months=1)
        chart_data.append({
            "name": next_date.strftime("T%m/%y"),
            "revenue": None,
            "prediction": max(0, round(next_month_revenue))     # ✅ round rõ ràng
        })

        # Lời khuyên
        last_revenue = float(y.iloc[-1])
        growth_rate = ((next_month_revenue - last_revenue) / last_revenue) * 100 if last_revenue > 0 else 0
        trend_status = "TĂNG TRƯỞNG" if next_month_revenue > last_revenue else "SUY GIẢM"

        current_month = datetime.now().month
        if current_month in [3, 4, 5]:   season_advice = "Mùa Xuân. Nên nhập: Áo Cardigan mỏng, Váy hoa."
        elif current_month in [6, 7, 8]: season_advice = "Mùa Hè. Ưu tiên: Áo thun cotton, Quần Short."
        elif current_month in [9, 10, 11]: season_advice = "Mùa Thu. Nên nhập: Áo Hoodie, Blazer."
        else: season_advice = "Mùa Đông/Tết. Cần nhập gấp: Áo phao, Len dày."

        if growth_rate > 10:   advice = f"Tăng mạnh (+{growth_rate:.1f}%). NHẬP THÊM HÀNG."
        elif growth_rate > 0:  advice = f"Tăng nhẹ (+{growth_rate:.1f}%). Duy trì ổn định."
        else:                   advice = f"Giảm ({growth_rate:.1f}%). Hạn chế nhập, Xả kho."

        # Top bán chạy
        cursor.execute("""
            SELECT p.name, SUM(oi.quantity) as total_sold
            FROM OrderItem oi
            JOIN Product p ON oi.productId = p.id
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 3
        """)
        raw_top_products = cursor.fetchall()
        conn.close()

        top_products = [
            {"name": item['name'], "total_sold": int(item['total_sold'])}
            for item in raw_top_products
        ]

        return {
            "data": chart_data,
            "analysis": {
                "trend": trend_status,
                "growth_rate": round(growth_rate, 1),
                "advice": advice,
                "season_tip": season_advice,
                "top_products": top_products
            }
        }

    except Exception as e:
        print(f"LỖI PREDICT REVENUE: {e}")
        return {"error": str(e), "data": [], "analysis": {}}

# === [BẮT ĐẦU THÊM MỚI 2] API 3: PHÂN KHÚC KHÁCH HÀNG BẰNG K-MEANS ===
@app.get("/customer-segments")
def customer_segments():
    try:
        conn = mysql.connector.connect(host="localhost", user="root", password="", database="shop_ai_db")
        cursor = conn.cursor(dictionary=True)
        
        # 1. Query SQL lấy và gom nhóm dữ liệu RFM cơ bản từ bảng Order
        cursor.execute("""
            SELECT 
                userId, 
                COUNT(id) as Frequency, 
                SUM(totalAmount) as Monetary, 
                MAX(createdAt) as LastPurchaseDate
            FROM `Order` 
            WHERE status = 'COMPLETED'
            GROUP BY userId
        """)
        raw_data = cursor.fetchall()
        conn.close()

        if not raw_data:
            return {"status": "error", "message": "Chưa đủ dữ liệu đơn hàng để phân tích", "chart_data": [], "details": []}

        df = pd.DataFrame(raw_data)
        df['LastPurchaseDate'] = pd.to_datetime(df['LastPurchaseDate'])
        
        # 2. Tính toán Recency (Khoảng cách từ ngày mua cuối đến hiện tại)
        snapshot_date = df['LastPurchaseDate'].max() + pd.Timedelta(days=1)
        df['Recency'] = (snapshot_date - df['LastPurchaseDate']).dt.days

        # Ép kiểu Decimal từ MySQL sang float cho dễ tính toán thuật toán
        df['Monetary'] = df['Monetary'].astype(float)

        # 3. Chuẩn hóa dữ liệu (Feature Scaling)
        scaler = StandardScaler()
        rfm_scaled = scaler.fit_transform(df[['Recency', 'Frequency', 'Monetary']])

        # 4. Áp dụng K-Means Clustering
        # Cố gắng chia 4 nhóm. Nếu tổng số lượng khách hàng < 4 thì chia bằng đúng số khách hàng hiện có
        n_clusters = 4 if len(df) >= 4 else len(df)
        kmeans = KMeans(n_clusters=n_clusters, random_state=42)
        kmeans.fit(rfm_scaled)
        df['Cluster'] = kmeans.labels_

        # 5. Gán nhãn cho từng nhóm (Auto Labeling)
        # Tính trung bình số tiền chi tiêu của từng cụm để biết cụm nào "giàu" nhất
        cluster_avg = df.groupby('Cluster').agg({'Monetary': 'mean'}).reset_index()
        cluster_avg = cluster_avg.sort_values(by='Monetary', ascending=False)
        
        sorted_clusters = cluster_avg['Cluster'].tolist()
        label_map = {}
        
        if len(sorted_clusters) >= 4:
            label_map[sorted_clusters[0]] = "VIP (Chi tiêu cao)"
            label_map[sorted_clusters[1]] = "Khách hàng Tiềm năng"
            label_map[sorted_clusters[2]] = "Khách hàng Thường xuyên"
            label_map[sorted_clusters[3]] = "Nguy cơ rời bỏ"
        else:
            # Fallback nếu số user quá ít
            for idx, c in enumerate(sorted_clusters):
                label_map[c] = f"Nhóm {idx + 1}"

        df['Label'] = df['Cluster'].map(label_map)

        # 6. Đếm số lượng để trả về cho Recharts (Pie Chart) vẽ
        segment_summary = df['Label'].value_counts().reset_index()
        segment_summary.columns = ['name', 'value'] 

        return {
            "status": "success",
            "chart_data": segment_summary.to_dict(orient='records'),
            "details": df[['userId', 'Label', 'Recency', 'Frequency', 'Monetary']].to_dict(orient='records')
        }

    except Exception as e:
        print(f"LỖI PHÂN KHÚC: {e}")
        return {"status": "error", "error": str(e)}
# === [KẾT THÚC THÊM MỚI 2] ===
# === [BẮT ĐẦU THÊM MỚI 3] API 4: PHÂN TÍCH CẢM XÚC ĐÁNH GIÁ (SENTIMENT ANALYSIS) ===
@app.get("/analyze-reviews")
def analyze_reviews():
    try:
        conn = mysql.connector.connect(host="localhost", user="root", password="", database="shop_ai_db")
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT r.id, r.content, r.rating, p.name as productName
            FROM Review r
            JOIN Product p ON r.productId = p.id
            ORDER BY r.id DESC LIMIT 50
        """)
        reviews = cursor.fetchall()
        conn.close()

        if not reviews:
            return {"status": "success", "stats": {"positive": 0, "negative": 0, "neutral": 0}, "warnings": [], "details": []}

        review_texts = [{"id": r["id"], "content": r["content"]} for r in reviews]
        
        prompt_text = f"""
        Bạn là một AI phân tích cảm xúc (Sentiment Analysis) chuyên nghiệp.
        Hãy đọc danh sách các bình luận sau và phân loại thành đúng 1 trong 3 nhãn: 'Tích cực', 'Tiêu cực', hoặc 'Trung lập'.
        CHỈ TRẢ VỀ MẢNG JSON THUẦN TÚY (Không dùng markdown, không giải thích gì thêm), định dạng mẫu:
        [ {{"id": 1, "sentiment": "Tích cực"}}, {{"id": 2, "sentiment": "Tiêu cực"}} ]
        
        Dữ liệu đầu vào:
        {json.dumps(review_texts, ensure_ascii=False)}
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
        payload = {"contents": [{"parts": [{"text": prompt_text}]}]}
        
        # Gọi Gemini API
        response = requests.post(url, headers={'Content-Type': 'application/json'}, json=payload)
        result = response.json()
        
        # Check lỗi từ Gemini (Quota, Key, Network...)
        if "candidates" not in result:
            print(">>> LỖI TỪ GEMINI API:", result)
            error_msg = result.get('error', {}).get('message', 'Lỗi không xác định từ Gemini')
            return {"status": "error", "error": f"Gemini API Error: {error_msg}"}

        # Bóc tách và parse JSON an toàn
        raw_text = result['candidates'][0]['content']['parts'][0]['text']
        raw_text = raw_text.replace("```json", "").replace("```", "").strip()
        
        try:
            ai_results = json.loads(raw_text) # ĐÂY LÀ DÒNG BẠN BỊ THIẾU
        except json.JSONDecodeError:
            print(">>> LỖI PARSE JSON TỪ GEMINI:", raw_text)
            ai_results = [] # Fallback an toàn nếu AI trả lời lộn xộn

        # Map kết quả và thống kê
        sentiment_map = {item['id']: item['sentiment'] for item in ai_results}
        
        stats = {"Tích cực": 0, "Tiêu cực": 0, "Trung lập": 0}
        product_negative_count = {}
        
        for r in reviews:
            # Nếu AI không phân tích được review này, lấy rating làm mốc dự phòng
            fallback_sentiment = "Tích cực" if r["rating"] >= 4 else ("Tiêu cực" if r["rating"] <= 2 else "Trung lập")
            sentiment = sentiment_map.get(r["id"], fallback_sentiment)
            
            if "Tích" in sentiment: sentiment = "Tích cực"
            elif "Tiêu" in sentiment: sentiment = "Tiêu cực"
            else: sentiment = "Trung lập"

            r["sentiment"] = sentiment
            stats[sentiment] += 1
                
            if sentiment == "Tiêu cực":
                prod_name = r["productName"]
                product_negative_count[prod_name] = product_negative_count.get(prod_name, 0) + 1

        total = len(reviews)
        percentages = {
            "positive": round((stats["Tích cực"] / total) * 100, 1),
            "negative": round((stats["Tiêu cực"] / total) * 100, 1),
            "neutral": round((stats["Trung lập"] / total) * 100, 1)
        }

        warnings = [
            f"Sản phẩm '{name}' đang bị phàn nàn nhiều ({count} đánh giá tiêu cực)! Cần kiểm tra lại chất lượng." 
            for name, count in product_negative_count.items() if count >= 2
        ]

        return {
            "status": "success",
            "stats": percentages,
            "warnings": warnings,
            "details": reviews
        }

    except Exception as e:
        print(f"LỖI PHÂN TÍCH CẢM XÚC: {e}")
        return {"status": "error", "error": str(e)}
# === [KẾT THÚC THÊM MỚI 3] ===

# === [BẮT ĐẦU THÊM MỚI 4] API 5: VISUAL SEARCH (TÌM KIẾM BẰNG HÌNH ẢNH) ===
class ImageSearchRequest(BaseModel):
    image_base64: str

@app.post("/visual-search")
def visual_search(req: ImageSearchRequest):
    print(">>> [PYTHON] Đã nhận request! Đang kết nối Database...")
    try:
        # 1. Xử lý chuỗi Base64 và TỰ DETECT mime_type từ header
        base64_data = req.image_base64
        mime_type = "image/jpeg"  # mặc định

        if "," in base64_data:
            header, base64_data = base64_data.split(",", 1)
            # Detect đúng định dạng ảnh từ header data URI
            if "image/png" in header:
                mime_type = "image/png"
            elif "image/webp" in header:
                mime_type = "image/webp"
            elif "image/gif" in header:
                mime_type = "image/gif"
            elif "image/jpeg" in header or "image/jpg" in header:
                mime_type = "image/jpeg"
            # Mặc định jpeg nếu không nhận ra

        print(f">>> [PYTHON] Loại ảnh phát hiện: {mime_type}")

        # 2. Lấy danh sách sản phẩm từ DB làm "từ điển" cho AI tìm kiếm
        conn = mysql.connector.connect(host="localhost", user="root", password="", database="shop_ai_db")
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, category, price, image FROM Product")
        products = cursor.fetchall()
        conn.close()

        if not products:
            return {"status": "error", "message": "Không có sản phẩm trong DB", "data": []}

        # Rút gọn data gửi cho AI để tiết kiệm token
        prod_list = [{"id": p["id"], "name": p["name"], "category": p["category"]} for p in products]

        # 3. Prompt thông minh ép AI chỉ trả về JSON chứa ID
        prompt_text = f"""
        Bạn là chuyên gia thời trang AI. Khách hàng vừa tải lên một bức ảnh.
        Hãy quan sát bức ảnh này và tìm ra TỐI ĐA 4 sản phẩm CÓ KIỂU DÁNG HOẶC MÀU SẮC GIỐNG NHẤT từ danh sách cửa hàng sau:
        {json.dumps(prod_list, ensure_ascii=False)}

        CHỈ TRẢ VỀ MẢNG JSON chứa ID của các sản phẩm bạn chọn (ví dụ: [1, 5, 12]). 
        Không giải thích, không dùng markdown.
        """

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"

        # Payload gửi dạng Multimodal (Text + Image)
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt_text},
                        {
                            "inline_data": {
                                "mime_type": mime_type,  # ✅ FIX: dùng mime_type động, không hardcode
                                "data": base64_data
                            }
                        }
                    ]
                }
            ]
        }

        # ✅ FIX: Chỉ gọi Gemini MỘT LẦN DUY NHẤT, có timeout rõ ràng
        print(">>> [PYTHON] Đang gửi ảnh sang Gemini AI...")
        response = requests.post(
            url,
            headers={'Content-Type': 'application/json'},
            json=payload,
            timeout=30  # Tối đa 30 giây, tránh treo server
        )

        print(">>> [PYTHON] Gemini đã trả lời xong! Đang phân tích kết quả...")
        result = response.json()

        if "candidates" not in result:
            print(">>> LỖI GEMINI VISUAL SEARCH:", result)
            error_msg = result.get('error', {}).get('message', 'Lỗi không xác định')
            return {"status": "error", "message": f"Gemini lỗi: {error_msg}", "data": []}

        raw_text = result['candidates'][0]['content']['parts'][0]['text']
        raw_text = raw_text.replace("```json", "").replace("```", "").strip()

        try:
            matched_ids = json.loads(raw_text)
            if not isinstance(matched_ids, list):
                matched_ids = []
        except json.JSONDecodeError:
            print(">>> LỖI PARSE JSON:", raw_text)
            matched_ids = []

        # 5. Map lại data chi tiết để trả về Frontend
        matched_products = [p for p in products if p["id"] in matched_ids]

        print(f">>> [PYTHON] Tìm thấy {len(matched_products)} sản phẩm phù hợp.")
        return {
            "status": "success",
            "data": matched_products
        }

    except requests.exceptions.Timeout:
        print(">>> LỖI: Gemini timeout sau 30 giây!")
        return {"status": "error", "message": "AI phân tích quá lâu, vui lòng thử lại.", "data": []}
    except Exception as e:
        print(f"LỖI VISUAL SEARCH: {e}")
        return {"status": "error", "message": str(e), "data": []}

# === [KẾT THÚC THÊM MỚI 4] ===