import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { parseValidationErrors } from './errors/parse-validation-errors.js';

export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]): BadRequestException => {
        return new BadRequestException(parseValidationErrors(errors));
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
}
