import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearRecomendacionDto {
  @IsString()
  @IsNotEmpty()
  estudianteId: string;

  @IsString()
  @IsNotEmpty()
  misionId: string;

  @IsOptional()
  @IsString()
  nota?: string;
}