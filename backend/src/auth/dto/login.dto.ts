import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'admin',
    description: 'User password',
  })
  password: string;
}
