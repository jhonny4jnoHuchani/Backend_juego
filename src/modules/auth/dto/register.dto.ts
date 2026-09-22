import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Rol } from '../../../common/enums/rol.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsEnum(Rol)
  rol: Rol;

  @IsOptional()
  @IsString()
  universidad?: string;

  @IsOptional()
  @IsString()
  carrera?: string;

  @IsOptional()
  @IsString()
  semestre?: string;
}