import { IsNotEmpty, IsString, Length } from 'class-validator';

export class UnirseGrupoDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'El código debe tener exactamente 6 caracteres' })
  codigo: string;
}