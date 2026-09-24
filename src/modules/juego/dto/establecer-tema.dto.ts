import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class EstablecerTemaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'El tema debe tener al menos 10 caracteres',
  })
  temaInvestigacion: string;
}