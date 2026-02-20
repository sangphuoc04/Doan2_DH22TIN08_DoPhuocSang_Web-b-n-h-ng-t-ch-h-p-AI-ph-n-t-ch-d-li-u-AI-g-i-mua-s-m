# ai_service/main.py
import mysql.connector
import requests
from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime

# === [BẮT ĐẦU THÊM MỚI 1] IMPORT THƯ VIỆN CHO FEATURE 3 (K-MEANS) ===
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
# === [KẾT THÚC THÊM MỚI 1] ===

# --- CẤU HÌNH ---
# DÁN API KEY CỦA BẠN VÀO ĐÂY NHÉ
GOOGLE_API_KEY = "AIzaSyA4qrOUTmpRSYHzriptt23EszxEBq4pOrE"  

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

# --- API 1: CHATBOT ---
@app.post("/chatbot")
async def chat_endpoint(req: ChatRequest):
    context = get_products_context()
    prompt_text = f"Bạn là nhân viên tư vấn của shop thời trang. Dựa trên danh sách sau:\n{context}\nKhách hỏi: \"{req.question}\". Trả lời ngắn gọn, thân thiện."
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}"
    try:
        response = requests.post(url, headers={'Content-Type': 'application/json'}, json={"contents": [{"parts": [{"text": prompt_text}]}]})
        result = response.json()
        if "candidates" in result:
            return {"reply": result['candidates'][0]['content']['parts'][0]['text']}
        return {"reply": "Xin lỗi, AI chưa hiểu rõ ý bạn."}
    except Exception:
        return {"reply": "Hệ thống đang bảo trì."}

# --- API 2: DỰ BÁO DOANH THU & TOP BÁN CHẠY ---
@app.get("/predict-revenue")
def predict_revenue():
    try:
        conn = mysql.connector.connect(host="localhost", user="root", password="", database="shop_ai_db")
        cursor = conn.cursor(dictionary=True)
        
        # 1. LẤY DOANH THU (Đã fix lỗi Warning của Pandas)
        cursor.execute("SELECT createdAt, totalAmount FROM `Order` WHERE status = 'COMPLETED'")
        order_rows = cursor.fetchall()
        
        if not order_rows:
            return {"data": [], "analysis": {"trend": "CHƯA RÕ", "growth_rate": 0, "advice": "Chưa có dữ liệu", "season_tip": "Chưa có dữ liệu", "top_products": []}}

        df = pd.DataFrame(order_rows)
        df['createdAt'] = pd.to_datetime(df['createdAt'])
        
        try:
            monthly_revenue = df.resample('ME', on='createdAt')['totalAmount'].sum().reset_index()
        except:
            monthly_revenue = df.resample('M', on='createdAt')['totalAmount'].sum().reset_index()
            
        monthly_revenue.columns = ['Date', 'Revenue']
        
        # Chạy AI Linear Regression (Đã fix lỗi Warning Feature Names)
        monthly_revenue['Month_Index'] = np.arange(len(monthly_revenue))
        X = monthly_revenue[['Month_Index']]
        y = monthly_revenue['Revenue']
        
        model = LinearRegression()
        model.fit(X, y)
        future_X = pd.DataFrame({'Month_Index': [len(monthly_revenue)]})
        next_month_revenue = model.predict(future_X)[0]
        
        chart_data = [{"name": row['Date'].strftime("T%m"), "revenue": row['Revenue'], "prediction": None} for index, row in monthly_revenue.iterrows()]
        last_date = monthly_revenue.iloc[-1]['Date']
        next_date = last_date + pd.DateOffset(months=1)
        chart_data.append({"name": next_date.strftime("T%m"), "revenue": None, "prediction": max(0, round(next_month_revenue))})

        # 2. XỬ LÝ LỜI KHUYÊN
        last_revenue = y.iloc[-1]
        growth_rate = ((next_month_revenue - last_revenue) / last_revenue) * 100 if last_revenue > 0 else 0
        trend_status = "TĂNG TRƯỞNG" if next_month_revenue > last_revenue else "SUY GIẢM"
        
        current_month = datetime.now().month
        if current_month in [3, 4, 5]: season_advice = "Mùa Xuân. Nên nhập: Áo Cardigan mỏng, Váy hoa."
        elif current_month in [6, 7, 8]: season_advice = "Mùa Hè. Ưu tiên: Áo thun cotton, Quần Short."
        elif current_month in [9, 10, 11]: season_advice = "Mùa Thu. Nên nhập: Áo Hoodie, Blazer."
        else: season_advice = "Mùa Đông/Tết. Cần nhập gấp: Áo phao, Len dày."

        if growth_rate > 10: advice = f"Tăng mạnh (+{growth_rate:.1f}%). NHẬP THÊM HÀNG."
        elif growth_rate > 0: advice = f"Tăng nhẹ (+{growth_rate:.1f}%). Duy trì ổn định."
        else: advice = f"Giảm ({growth_rate:.1f}%). Hạn chế nhập, Xả kho."

        # 3. TOP BÁN CHẠY (Đã fix ép kiểu Số nguyên - Int)
        cursor.execute("""
            SELECT p.name, SUM(oi.quantity) as total_sold
            FROM OrderItem oi
            JOIN Product p ON oi.productId = p.id
            GROUP BY p.name
            ORDER BY total_sold DESC
            LIMIT 3
        """)
        raw_top_products = cursor.fetchall()
        
        top_products = []
        for item in raw_top_products:
            # Ép kiểu an toàn sang số nguyên để Next.js đọc được
            top_products.append({"name": item['name'], "total_sold": int(item['total_sold'])})
            
        print(">>> DEBUG AI ĐÃ TÌM THẤY TOP 3:", top_products)
        conn.close()

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
        print(f"LỖI: {e}")
        return {"error": str(e)}

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

        print(">>> DEBUG AI PHÂN CỤM KHÁCH HÀNG:", segment_summary.to_dict(orient='records'))

        return {
            "status": "success",
            "chart_data": segment_summary.to_dict(orient='records'),
            "details": df[['userId', 'Label', 'Recency', 'Frequency', 'Monetary']].to_dict(orient='records')
        }

    except Exception as e:
        print(f"LỖI PHÂN KHÚC: {e}")
        return {"status": "error", "error": str(e)}
# === [KẾT THÚC THÊM MỚI 2] ===