import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { VerifyResetCodeDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,  
  ) {}

  async validateUser(email: string, password: string): Promise<{ id: number; email: string } | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return { id: user.id, email: user.email };
    }
    throw new UnauthorizedException('Invalid email or password');
  }
  

  async loginUser(loginUserDto: LoginUserDto) {
    const user = await this.validateUser(loginUserDto.email, loginUserDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = { email: user.email, sub: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }

  async requestPasswordReset(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Generate a secure random reset code and expiration time
    const resetCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g., "A1B2C3"
    const resetCodeExpiry = new Date();
    resetCodeExpiry.setMinutes(resetCodeExpiry.getMinutes() + 15); // Code expires in 15 minutes

    // Update user with reset code and expiry
    user.resetToken = resetCode;
    user.resetTokenExpiry = resetCodeExpiry;
    await this.usersService.updateUser(user);

    // Send reset code via email
    await this.sendPasswordResetEmail(user.email, resetCode);
    return { message: 'Password reset code sent to your email' };
  }

  private async sendPasswordResetEmail(email: string, resetCode: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        from: process.env.EMAIL_SENDER,
        subject: 'Password Reset Request',
        template: './reset-password', // Path to email template
        context: {
          resetCode,
          email,
          companyName: 'Your Company',
        },
      });
      console.log(`Password reset code sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send reset email to ${email}:`, error);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }

  async verifyResetCodeAndResetPassword(verifyResetCodeDto: VerifyResetCodeDto) {
    const user = await this.usersService.findByResetToken(verifyResetCodeDto.resetCode);
    if (!user) {
      throw new BadRequestException('Invalid reset code');
    }

    if (user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Reset code has expired');
    }

    // Hash the new password and update the user
    user.password = await bcrypt.hash(verifyResetCodeDto.newPassword, 10);
    user.resetToken = null; // Clear the token after successful reset
    user.resetTokenExpiry = null;
    await this.usersService.updateUser(user);

    return { message: 'Password reset successful' };
  }
}
