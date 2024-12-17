import { Module } from '@nestjs/common';
import { TransfersiaController} from './siaamp.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReceptieModel } from '../receptie/receptie.model';
import { siaampService } from './siaamp.service';
import { SiaampReceptieService } from './siaampreceptie.service';
import { ReceptieService } from '../receptie/receptie.service';


@Module({
  controllers: [TransfersiaController],
  providers: [
    siaampService,
    SiaampReceptieService,
    ReceptieService,
  ],
  imports:[
    SequelizeModule.forFeature([
      ReceptieModel
    ]),
  ]
})
export class SiaampModule {}
