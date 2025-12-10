import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ErrorResponseNormalizerFilter } from './filter/error-response-normalizer.filter';
import { AuditInterceptor } from 'src/interceptor/main.interceptor';
import { ResponseNormalizerInterceptor } from './interceptor/response-normalizer.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //   }),
  // );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
      transform: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(errors);
      },
    }),
  );

  app.useGlobalInterceptors(new AuditInterceptor());

  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });

  app.useGlobalFilters(new ErrorResponseNormalizerFilter());
  app.useGlobalInterceptors(new ResponseNormalizerInterceptor());

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Running on port ${port}`);
}
bootstrap();
