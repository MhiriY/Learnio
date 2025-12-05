/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createCourseDto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        userId,
        title: createCourseDto.title,
        description: createCourseDto.description || null,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.course.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            documents: true,
            conversations: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            documents: true,
            conversations: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.userId !== userId) {
      throw new ForbiddenException('You do not have access to this course');
    }

    return course;
  }

  async update(id: string, userId: string, updateCourseDto: UpdateCourseDto) {
    // Verify ownership
    await this.findOne(id, userId);

    return this.prisma.course.update({
      where: { id },
      data: {
        title: updateCourseDto.title,
        description: updateCourseDto.description,
        updatedAt: new Date(),
      },
    });
  }

  async remove(id: string, userId: string) {
    // Verify ownership
    await this.findOne(id, userId);

    return this.prisma.course.delete({
      where: { id },
    });
  }
}
