import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { handleDatabaseError } from '../common/utils/error-handler.util';
import { PublicUser } from 'src/users/interfaces/users.interfaces';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,  
  ) {}

  async validateUser(email: string, password: string): Promise<PublicUser | null> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && await bcrypt.compare(password, user.password)) {
        return { id: user.id, email: user.email };
      }
      throw new UnauthorizedException('Invalid email or password');
    } catch (error) {
      handleDatabaseError(error, AuthService.name);
    }
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
    const genericMessage = 'If an account with that email exists, a password reset link will be sent.';
    
    try {
      const user = await this.usersService.findByEmail(forgotPasswordDto.email);
      if (!user) {
        // Avoid exposing if the user exists or not.
        return { message: genericMessage };
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await this.usersService.updateUser(user);

      await this.sendPasswordResetEmail(user.email, resetToken);
      return { message: genericMessage };
    } catch (error) {
      console.error('Error during password reset request:', error);
      throw new InternalServerErrorException(genericMessage);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      const user = await this.usersService.findByResetToken(resetPasswordDto.resetToken);
      if (!user || user.resetTokenExpiry < new Date()) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      user.password = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await this.usersService.updateUser(user);

      return { message: 'Password reset successful' };
    } catch (error) {
      console.error('Error during password reset:', error);
      throw new InternalServerErrorException('An error occurred during password reset');
    }
  }

  private async sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    try {
      await this.mailerService.sendMail({
        to: email,
        from: process.env.EMAIL_SENDER,
        subject: 'Password Reset Request',
        template: './reset-password',  
        context: {                      
          resetLink,
          userEmail: email,
          companyName: 'Your Company',
        },
      });
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error(`Failed to send reset email to ${email}:`, error);
      throw new InternalServerErrorException('Failed to send password reset email');
    }
  }
}
