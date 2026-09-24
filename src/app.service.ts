import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Backend de Acceso... mas info en /api/docs';
  }
}
