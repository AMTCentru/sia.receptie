import { Module } from '@nestjs/common';
import { ReceptieController } from './receptie.controller';
import { ReceptieService } from './receptie.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReceptieModel } from './receptie.model';
import { VerificareReceptieDiferente } from './verificare-receptie-diferente.model';

@Module({
  controllers: [ReceptieController],
  providers: [ReceptieService],
  imports: [SequelizeModule.forFeature([ReceptieModel,VerificareReceptieDiferente])],
  exports:[ReceptieService]
})
export class ReceptieModule {}
