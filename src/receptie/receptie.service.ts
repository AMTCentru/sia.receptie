import { Injectable, Logger } from '@nestjs/common';
import { CreateReceptieDto } from './create.dto';
import { ReceptieModel } from './receptie.model';
import { InjectModel } from '@nestjs/sequelize';
import { VerificareReceptieDiferente } from './verificare-receptie-diferente.model';
import { CreateVerificareReceptieDto } from './create-verificare-receptie.dto';
import { UpdateVerificareReceptieDto } from './UpdateVerificareReceptie.dto';

@Injectable()
export class ReceptieService {

    private readonly logger = new Logger(ReceptieService.name)

    constructor(
        @InjectModel(ReceptieModel)
        private readonly receptieRepository: typeof ReceptieModel,
        @InjectModel(VerificareReceptieDiferente)
        private readonly verificarereceptiediferente: typeof VerificareReceptieDiferente
    ){}

    async create(dto: CreateReceptieDto){
        try{
            await this.receptieRepository.create(dto)
        } catch (e){
            this.logger.error(e)
        }
    }
    async createverificarereceptiediferente(dto: CreateVerificareReceptieDto){
        try{
            await this.verificarereceptiediferente.create(dto)
        } catch (e){
            this.logger.error(e)
        }
    }
    async updateTable(
    where: { institutie: string; numeMedic: string; specialitate:string, dataReceptie: string },
    updateDto: UpdateVerificareReceptieDto
    ) {
    const [rowsUpdated] = await this.verificarereceptiediferente.update(updateDto, {
        where,
    });

    return rowsUpdated;
    }
    // Service
    async getLastTable(data: CreateReceptieDto): Promise<string> {
        const lastRow = await this.verificarereceptiediferente.findOne({
            where: {
                institutie: data.institutie,
                numeMedic: data.medic,
                specialitate: data.specialitate,
                dataReceptie: data.dataReceptie,
            },
            order: [['id', 'DESC']], // ia rândul cel mai recent
        });

        return lastRow?.continutReceptie || '';
    }
    async getLastRow():Promise<number>{
        const lastrows = await this.receptieRepository.findOne({order:[['id','DESC']]});
        if (lastrows && lastrows.row != +process.env.LASTROW) {
            return lastrows.row; // Get the last ID
        } else {
            return 1
        }
    }
}
