import { siaampService } from './siaamp.service';
import { Response } from 'express';
import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('siaReceptie') // Gruparea endpoint-urilor în Swagger
@Controller('siaReceptie')
export class TransfersiaController {
  constructor(private service: siaampService) {}

  @Get('logareSiaReceptie')
  @ApiOperation({ summary: 'Logare în SiaReceptie' })
  @ApiResponse({ status: 200, description: 'Imaginea a fost generată cu succes.' })
  @ApiResponse({ status: 500, description: 'Eroare în timpul procesului de logare.' })
  async logareSiaReceptie(@Res() res: Response): Promise<void> {
    try {
      const data = await this.service.logareSiaReceptie(); // Apel către serviciu
      res.setHeader('Content-Type', 'image/png'); // Setăm tipul de conținut
      res.status(HttpStatus.OK).send(data); // Răspuns cu bufferul imaginii
    } catch (error) {
      console.error('Error during login:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'An error occurred during login.',
      });
    }
  }

  @ApiOperation({ summary: 'Verificare daca sa logat cu operatorRegistratura' })
  @Get('checkLogatClientSIAAMP')
  async checkLogatClientSIAAMP(@Res() res : Response) {
    try {
      const image = await this.service.checkLogat(); // Call the service method
      res.setHeader('Content-Type', 'image/png'); // Set the content type for a PNG image
      res.status(HttpStatus.OK).send(image); // Send the image buffer as response
    } catch (error) {
      //this.logger.error('[checkLogatClientSIAAMP]', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('startSiaReceptie')
  @ApiOperation({ summary: 'Start proces în SiaReceptie' })
  @ApiQuery({ name: 'startdata', type: String, description: 'Data de început (format YYYY-MM-DD)' })
  @ApiQuery({ name: 'stopdata', type: String, description: 'Data de sfârșit (format YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Procesul a fost pornit cu succes.' })
  @ApiResponse({ status: 500, description: 'Eroare în timpul procesului.' })
  async startSiaReceptie(
    @Query('startdata') startdata: string,
    @Query('stopdata') stopdata: string,
  ) {
    return await this.service.startSiaReceptie(startdata, stopdata);
  }
}
