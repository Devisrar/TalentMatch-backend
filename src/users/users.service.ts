import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entity/users.entity';
import { QueryFailedError } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const user = this.userRepository.create(createUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof QueryFailedError && error.message.includes('duplicate key value')) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByResetToken(resetToken: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { resetToken } });
  }

  async updateUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
