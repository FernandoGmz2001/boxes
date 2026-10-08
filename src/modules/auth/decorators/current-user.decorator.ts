import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { IAuthUser } from '../interfaces/auth-user.interface.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): IAuthUser => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: IAuthUser }>();

    return request.user;
  },
);
