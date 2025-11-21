import { IsEmail, IsString, IsOptional, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  password?: string;

  @IsOptional()
  @IsString()
  subscriptionTier?: string;
}

