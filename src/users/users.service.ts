import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { handleDatabaseError } from '../common/utils/error-handler.util';
import { User } from './entity/users.entity';
import { PublicUser } from './interfaces/users.interfaces';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<PublicUser> {
    try {
      const user = this.userRepository.create(createUserDto);
      const savedUser = await this.userRepository.save(user);
      return { id: savedUser.id, email: savedUser.email };
    } catch (error) {
      handleDatabaseError(error, UsersService.name);
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      handleDatabaseError(error, UsersService.name);
    }
  }
}
