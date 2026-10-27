import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { parseValidationErrors } from './errors/parse-validation-errors.js';

const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1']);

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  const configuredOrigins = process.env.CORS_ORIGINS?.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredOrigins?.length) {
    return configuredOrigins.includes(origin);
  }

  try {
    const { hostname } = new URL(origin);
    return LOCAL_DEV_HOSTS.has(hostname);
  } catch {
    return false;
  }
}

export function configureApp(app: INestApplication): void {
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      callback(null, isAllowedOrigin(origin));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
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
