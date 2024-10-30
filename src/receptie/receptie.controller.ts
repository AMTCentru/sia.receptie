import { Controller, Get } from '@nestjs/common';
import { ReceptieService } from './receptie.service';

@Controller('receptie')
export class ReceptieController {

    constructor(
        private service:ReceptieService
    ) {}

    @Get()
    async getlastrow(){
        return this.service.getLastRow()
    }
}
