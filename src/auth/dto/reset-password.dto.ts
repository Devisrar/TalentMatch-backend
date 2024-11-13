import { IsString, MinLength, Matches } from 'class-validator';

export class VerifyResetCodeDto {
  @IsString()
  resetCode: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W).+$/, {
    message: 'Password too weak. It must contain uppercase, lowercase, number, and special character.',
  })
  newPassword: string;
}
