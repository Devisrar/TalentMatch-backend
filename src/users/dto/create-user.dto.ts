// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format. Please enter a valid email address.' })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, {
    message: 'Password too weak. It must contain uppercase, lowercase, number, and special character.',
  })
  password: string;
}
