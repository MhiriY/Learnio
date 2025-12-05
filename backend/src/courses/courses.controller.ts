import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { CourseDocumentResponseDto } from './dto/course-document-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({
    status: 201,
    description: 'Course successfully created',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  create(@Req() req: any, @Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(req.user.id, createCourseDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of courses',
    type: [CourseResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  findAll(@Req() req: any) {
    return this.coursesService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a course by ID' })
  @ApiResponse({
    status: 200,
    description: 'Course found',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Course does not belong to user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiResponse({
    status: 200,
    description: 'Course successfully updated',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Course does not belong to user',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, req.user.id, updateCourseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiResponse({
    status: 204,
    description: 'Course successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Course does not belong to user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.coursesService.remove(id, req.user.id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get all documents in a course' })
  @ApiResponse({
    status: 200,
    description: 'List of documents in the course',
    type: [CourseDocumentResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Course does not belong to user',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getCourseDocuments(@Param('id') id: string, @Req() req: any) {
    // Verify course ownership
    await this.coursesService.findOne(id, req.user.id);

    // Get all documents for this course
    const documents = await this.prisma.document.findMany({
      where: {
        courseId: id,
        userId: req.user.id as string, // Ensure documents belong to the user
      },
      select: {
        id: true,
        originalFilename: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return documents;
  }
}
