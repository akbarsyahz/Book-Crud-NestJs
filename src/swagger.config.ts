// src/swagger.config.ts

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Simple App Bookstore API')
    .setDescription('API documentation for the Bookstore application')
    .setVersion('1.0.3')
    .addTag('books', 'Endpoints related to managing books')
    .addBearerAuth() 
    .build();
    // .addTag('users', 'Endpoints related to managing users')

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
