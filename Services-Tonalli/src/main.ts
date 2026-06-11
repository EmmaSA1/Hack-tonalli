import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Stripe requires the exact raw payload to verify webhook signatures.
  app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8081'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Tonalli Backend running on http://localhost:${port}/api`);
}

bootstrap();
