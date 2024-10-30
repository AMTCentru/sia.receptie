import { siaampService } from './siaamp.service';
import { Response } from 'express';
import { Controller, Get, Res, HttpStatus} from '@nestjs/common';


@Controller('siaReceptie')
export class TransfersiaController {
    constructor(
        private service: siaampService
    ) {}

    @Get('logareSiaReceptie')
    async logareSiaReceptie(@Res() res: Response): Promise<void> {
        try {
            const data = await this.service.logareSiaReceptie(); // Call the service method
            res.setHeader('Content-Type', 'image/png'); // Set the content type for a PNG image
            res.status(HttpStatus.OK).send(data); // Send the image buffer as response
        } catch (error) {
            console.error('Error during login:', error);
            res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                message: 'An error occurred during login.',
            });
        }
    }
    @Get('startSiaReceptie')
    async startSiaReceptie(){
        return await this.service.startSiaReceptie()
    }
}
