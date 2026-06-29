import { Module } from '@nestjs/common';
import { TransfersiaController} from './siaamp.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReceptieModel } from '../receptie/receptie.model';
import { siaampService } from './siaamp.service';
import { SiaampReceptieService } from './siaampreceptie.service';
import { ReceptieService } from '../receptie/receptie.service';
import { VerificareReceptieDiferente } from 'src/receptie/verificare-receptie-diferente.model';
import { ScreenshotsService } from './screenshots.service';


@Module({
  controllers: [TransfersiaController],
  providers: [
    siaampService,
    SiaampReceptieService,
    ReceptieService,
    ScreenshotsService
  ],
  imports:[
    SequelizeModule.forFeature([
      ReceptieModel,
      VerificareReceptieDiferente
    ]),
  ]
})
export class SiaampModule {}
