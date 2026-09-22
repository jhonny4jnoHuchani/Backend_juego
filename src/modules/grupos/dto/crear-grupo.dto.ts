import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CrearGrupoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  nombre: string;

  @IsOptional()
  @IsDateString()
  fechaExpiracion?: string;
}