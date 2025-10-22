import {
  ArgumentsHost,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ValidationError } from 'joi';
import { Response } from 'express';
import moment from 'moment';
import { normalizeResponse } from '../util/helper/response.helpers';

export class ErrorResponseNormalizerFilter
  implements ExceptionFilter<HttpException>
{
  private readonly logger = new Logger(ErrorResponseNormalizerFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const responseHelper = host.switchToHttp().getResponse<Response>();
    if (exception instanceof ValidationError) {
      const response = normalizeResponse({
        _message: exception.message,
        _timestamp : moment().toISOString(),
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
