import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  
  // Enable CORS for frontend communication
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL') || 'http://localhost:5173',
    credentials: true,
  });
  
  // --- Swagger config ---
  const config = new DocumentBuilder()
    .setTitle('Learnio API')
    .setDescription('API documentation for the Learnio platform')
    .setVersion('1.0')
    .addTag('agent')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
}
bootstrap();
