import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && await bcrypt.compare(password, user.password)) {
        const { password, ...result } = user;
        return result;
      }
      throw new UnauthorizedException('Invalid email or password');
    } catch (error) {
      throw new InternalServerErrorException('An error occurred while validating the user');
    }
  }

  async login(loginUserDto: LoginUserDto) {
    try {
      const user = await this.validateUser(loginUserDto.email, loginUserDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid email or password');
      }
      const payload = { email: user.email, sub: user.id };
      return { access_token: this.jwtService.sign(payload) };
    } catch (error) {
      throw new InternalServerErrorException('An error occurred during login');
    }
  }
}
