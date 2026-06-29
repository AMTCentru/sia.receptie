import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement
} from 'sequelize-typescript';

interface VerificareAttributes {
  id: number;
  institutie?: string;
  numeMedic?: string;
  specialitate?:string;
  dataReceptie?: string;
  continutReceptie?: string;
  numeImagine?: string;
}

interface VerificareCreationAttributes
  extends Omit<VerificareAttributes, 'id'> {}

@Table({
  tableName: 'verificare_receptie_diferente',
  schema: 'dbo',
  timestamps: false
})
export class VerificareReceptieDiferente extends Model<
  VerificareAttributes,
  VerificareCreationAttributes
> {

  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @Column(DataType.STRING(500))
  institutie: string;

  @Column(DataType.STRING(200))
  numeMedic: string;

    @Column({ type: DataType.STRING, allowNull: false })
    dataReceptie: Date;

  @Column(DataType.TEXT)
  continutReceptie: string;

  @Column(DataType.STRING(255))
  numeImagine: string;

  @Column(DataType.TEXT)
  specialitate: string;
}