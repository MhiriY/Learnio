import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password: string;
}
