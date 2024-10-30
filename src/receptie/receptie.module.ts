import { Module } from '@nestjs/common';
import { ReceptieController } from './receptie.controller';
import { ReceptieService } from './receptie.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReceptieModel } from './receptie.model';
import { SiaampModule } from 'src/siaamp/siaamp.module';

@Module({
  controllers: [ReceptieController],
  providers: [ReceptieService],
  imports: [
    SequelizeModule.forFeature([
      ReceptieModel
    ])
  ],
  exports:[ReceptieService]
})
export class ReceptieModule {}