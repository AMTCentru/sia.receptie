import { PartialType } from '@nestjs/mapped-types';
import { CreateVerificareReceptieDto } from './create-verificare-receptie.dto';

export class UpdateVerificareReceptieDto extends PartialType(
  CreateVerificareReceptieDto
) {}