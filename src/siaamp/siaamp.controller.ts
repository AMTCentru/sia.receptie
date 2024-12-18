import { siaampService } from './siaamp.service';
import { Response } from 'express';
import { Controller, Get, Query, Res, HttpStatus, Logger, HttpException } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('siaReceptie') // Gruparea endpoint-urilor în Swagger
@Controller('siaReceptie')
export class TransfersiaController {

  private readonly logger = new Logger(TransfersiaController.name)

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
      this.logger.error(`[logareSiaReceptie] : ${error}`);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({message: 'An error occurred during login.',});
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
      this.logger.error('[checkLogatClientSIAAMP]', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(error);
    }
  }

  @Get('startSiaReceptie')
  @ApiOperation({ summary: 'Start proces în SiaReceptie' })
  @ApiQuery({ name: 'startdata', type: String, description: 'Data de început (format YYYY-MM-DD)' })
  @ApiQuery({ name: 'stopdata', type: String, description: 'Data de sfârșit (format YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Procesul a fost pornit cu succes.' })
  @ApiResponse({ status: 500, description: 'Eroare în timpul procesului.' })
  startSiaReceptie(
    @Query('startdata') startdata: string,
    @Query('stopdata') stopdata: string,
  ) {
    this.service.startSiaReceptie(startdata, stopdata);
  }

  @Get('screenshots')
  @ApiResponse({
      status: 200,
      description: 'Screenshot-uri capturate cu succes.',
  })
  @ApiResponse({
      status: 500,
      description: 'Eroare la capturarea screenshot-urilor.',
  })
  async getScreenshots(@Res() res: Response) {
      try {
          const screenshots = await this.service.captureAllPages();

          const result = screenshots.map((screenshot) => ({
              pageIndex: screenshot.pageIndex,
              url: screenshot.url,
              image: screenshot.screenshotBuffer.toString('base64'),
          }));

          return res.status(HttpStatus.OK).json({
              success: true,
              pages: result,
          });
      } catch (error) {
          throw new HttpException(
              { message: 'Eroare la capturarea screenshot-urilor', details: error.message },
              HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }
  }
}
