// backend/src/auth/auth.controller.ts
import { Controller, Post, Body, Get, Request, UseGuards, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(
        @Body('email') email: string,
        @Body('password') password: string,
        @Body('fullName') fullName: string,
    ) {
        return this.authService.register(email, password, fullName);
    }

    @Post('login')
    @HttpCode(200)
    login(
        @Body('email') email: string,
        @Body('password') password: string,
    ) {
        return this.authService.login(email, password);
    }

    // API lấy thông tin user đang đăng nhập (dùng JWT Guard)
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getProfile(@Request() req: any) {
        return this.authService.getProfile(req.user.sub);
    }
}