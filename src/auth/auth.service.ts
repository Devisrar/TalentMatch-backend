import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { handleDatabaseError } from '../common/utils/error-handler.util';
import { PublicUser } from 'src/users/interfaces/users.interfaces';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
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

  async login(loginUserDto: LoginUserDto) {
    const user = await this.validateUser(loginUserDto.email, loginUserDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload = { email: user.email, sub: user.id };
    return { access_token: this.jwtService.sign(payload) };
  }
}
