import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorResponseNormalizerFilter } from './filter/error-response-normalizer.filter';
import { AuditInterceptor } from 'interceptors/main.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new AuditInterceptor());

  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalFilters(new ErrorResponseNormalizerFilter());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Running on port ${port}`);
}
bootstrap();
