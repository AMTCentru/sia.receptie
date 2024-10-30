import { Type } from '@nestjs/class-transformer';
import { IsString, IsOptional, IsNotEmpty, IsNumber} from '@nestjs/class-validator';


export class CreateReceptieDto {
  @IsString()
  @IsNotEmpty()
  medic: string;

  @IsString()
  @IsNotEmpty()
  institutie: string;

  @IsString()
  @IsNotEmpty()
  specialitate: string;

  @IsString()
  @IsNotEmpty()
  cabinet: string;

  @IsString()
  // @IsDate()
  // @Type(() => Date)
  @IsNotEmpty()
  dataActiune: string;

  // @Type(() => Date)
  @IsString()
  @IsNotEmpty()
  dataReceptie: string;

  @IsNumber()
  @IsNotEmpty()
  row: number;

  @IsOptional()
  @IsString()
  pacient?: string;

  @IsOptional()
  @IsString()
  idnpPacient?: string;

  // @Type(() => String)
  @IsString()
  @IsOptional()
  dataNasterePacient?: string;

  @IsOptional()
  @IsString()
  adresaPacient?: string;

  @IsOptional()
  @IsString()
  medicDeFamiliePacient?: string;

  @IsOptional()
  @IsString()
  pacientProgramatDe?: string;

  @Type(() => String)
  @IsOptional()
  @IsString()
  oraPragamariiPacientului?: string;

  @IsOptional()
  @IsString()
  backgroundColor?:string

  @IsOptional()
  @IsString()
  tipConsultatie?: string;
}