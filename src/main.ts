import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ErrorResponseNormalizerFilter } from './filter/error-response-normalizer.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

   app.useGlobalFilters(new ErrorResponseNormalizerFilter());
 
  await app.listen(process.env.PORT ?? 3000);
  console.log(`Running on port ${process.env.PORT}`);
}
bootstrap();
