import { IsOptional, IsString, IsDateString, IsNumber } from 'class-validator';

export class CreateVerificareReceptieDto {

  @IsOptional()
  @IsString()
  institutie?: string;

  @IsOptional()
  @IsString()
  numeMedic?: string;

  @IsOptional()
  @IsDateString()
  dataReceptie?: string;

  @IsOptional()
  @IsString()
  continutReceptie?: string;

  @IsOptional()
  @IsString()
  numeImagine?: string;
  
  @IsOptional()
  @IsString()
  specialitate?: string;
}