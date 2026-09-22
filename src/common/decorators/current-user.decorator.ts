import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UsuarioAutenticado {
  id: string;
  email: string;
  rol: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UsuarioAutenticado | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UsuarioAutenticado;
    return data ? user?.[data] : user;
  },
);