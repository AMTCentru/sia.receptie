import { Injectable } from '@nestjs/common';
import { CreateReceptieDto } from './create.dto';
import { ReceptieModel } from './receptie.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class ReceptieService {

    constructor(
        
        @InjectModel(ReceptieModel)
        private readonly receptieRepository: typeof ReceptieModel
    ){}

    async create(dto: CreateReceptieDto){
        try{
            await this.receptieRepository.create(dto)
        } catch (e){
            console.log(e)
        }
    }

    async getLastRow():Promise<number>{
        const lastrows = await this.receptieRepository.findOne({order:[['id','DESC']]});
        if (lastrows && lastrows.row != 279) {
            return lastrows.row; // Get the last ID
        } else {
            return 1
        }
    }
}
