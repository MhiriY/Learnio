import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // --- Swagger config ---
  const config = new DocumentBuilder()
    .setTitle('Learnio API')
    .setDescription('API documentation for the Learnio platform')
    .setVersion('1.0')
    .addTag('agent')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
