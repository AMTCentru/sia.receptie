import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReceptieService } from './receptie.service';

@ApiTags('Receptie')
@Controller('receptie')
export class ReceptieController {
  constructor(private service: ReceptieService) {}

  @Get()
  @ApiOperation({ summary: 'Obține ultima linie din baza de date' }) // Descrierea endpoint-ului
  @ApiResponse({ status: 200, description: 'Ultima linie a fost returnată cu succes.' }) // Răspunsuri posibile
  @ApiResponse({ status: 500, description: 'Eroare internă a serverului.' }) // Eroare posibilă
  async getLastRow() {
    return this.service.getLastRow();
  }
}
