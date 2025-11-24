import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QuestionsService } from './questions.service.js';
import { CreateQuestionDto } from './dto/create-question.dto.js';
import { UpdateQuestionDto } from './dto/update-question.dto.js';
import { QuestionResponseDto } from './dto/question-response.dto.js';

@ApiTags('questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new question' })
  @ApiResponse({
    status: 201,
    description: 'Question successfully created',
    type: QuestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async create(
    @Body() createQuestionDto: CreateQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionsService.create(createQuestionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all questions' })
  @ApiResponse({
    status: 200,
    description: 'List of all questions',
    type: [QuestionResponseDto],
  })
  async findAll(): Promise<QuestionResponseDto[]> {
    return this.questionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiResponse({
    status: 200,
    description: 'Question found',
    type: QuestionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async findOne(@Param('id') id: string): Promise<QuestionResponseDto> {
    return this.questionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a question' })
  @ApiResponse({
    status: 200,
    description: 'Question successfully updated',
    type: QuestionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
  })
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
  ): Promise<QuestionResponseDto> {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a question' })
  @ApiResponse({
    status: 204,
    description: 'Question successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.questionsService.remove(id);
  }
}

