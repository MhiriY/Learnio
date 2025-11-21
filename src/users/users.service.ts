import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password } = createUserDto;

    // Check if user already exists
    const existingUser = await (this.prisma as any).user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // For now, passwordHash equals password (will be replaced with hashing later)
    const passwordHash = password;

    // Create user
    const user = await (this.prisma as any).user.create({
      data: {
        email,
        passwordHash,
      },
    });

    // Return user without passwordHash
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
  }

  async findAll(): Promise<UserResponseDto[]> {
    const users = await (this.prisma as any).user.findMany();
    return users.map((user: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash: _, ...userWithoutPassword } = user;
      return userWithoutPassword as UserResponseDto;
    });
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await (this.prisma as any).user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // If email is being updated, check for conflicts
    if (updateUserDto.email) {
      const emailConflict = await (this.prisma as any).user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailConflict && emailConflict.id !== id) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }
    if (updateUserDto.password) {
      updateData.passwordHash = updateUserDto.password; // For now, passwordHash equals password
    }
    if (updateUserDto.subscriptionTier) {
      updateData.subscriptionTier = updateUserDto.subscriptionTier;
    }

    const user = await (this.prisma as any).user.update({
      where: { id },
      data: updateData,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as UserResponseDto;
  }

  async remove(id: string): Promise<void> {
    const user = await (this.prisma as any).user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await (this.prisma as any).user.delete({
      where: { id },
    });
  }
}
