import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ValidationError } from 'joi';
import { Response } from 'express';

export const normalizeResponse = (res: any) => {
  let message = '';
  let data = {};
  let errors = [];

  if (res._message) {
    message = res._message;
    delete res._message;
  }
  if (res._errors) {
    errors = res._errors;
    delete res._errors;
  }
  data = res;
  return {
    message,
    data,
    errors,
  };
};

export class ErrorResponseNormalizerFilter
  implements ExceptionFilter<HttpException>
{
  private readonly logger = new Logger(ErrorResponseNormalizerFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const responseHelper = host.switchToHttp().getResponse<Response>();
    if (exception instanceof ValidationError) {
      const response = normalizeResponse({
        _message: exception.message,
        _timestamp : new Date().toISOString(),
        _errors: exception.details.map((detail) => ({
          key: detail.context?.key,
          message: detail.message,
          type: detail.type,
        })),
      });
      return responseHelper
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .json(response);
    }
  }
}