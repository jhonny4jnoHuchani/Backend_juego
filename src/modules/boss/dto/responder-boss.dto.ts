import { IsNotEmpty, IsString } from 'class-validator';

export class ResponderBossDto {
  @IsString()
  @IsNotEmpty()
  misionId: string;

  @IsString()
  @IsNotEmpty()
  respuesta: string;
}