import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entity/users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Find user by reset token (used for password reset validation)
  async findByResetToken(resetToken: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { resetToken } });
  }

  // Save updated user details (e.g., updating reset token or password)
  async updateUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
