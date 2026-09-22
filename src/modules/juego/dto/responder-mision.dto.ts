import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrigenIntento } from '../../../common/enums/origen-intento.enum';

export class ResponderMisionDto {
  @IsString()
  @IsNotEmpty()
  respuesta: string;

  @IsOptional()
  @IsEnum(OrigenIntento)
  origen?: OrigenIntento;
}