import { Module } from '@nestjs/common';
import { TransfersiaController} from './siaamp.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReceptieModel } from 'src/receptie/receptie.model';
import { siaampService } from './siaamp.service';
import { SiaampReceptieService } from './siaampreceptie.service';
import { ReceptieService } from 'src/receptie/receptie.service';


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
