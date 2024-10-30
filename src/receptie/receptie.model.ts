// src/receptie/receptie.model.ts

import { Column, Model, Table, PrimaryKey, AutoIncrement, Length, DataType } from 'sequelize-typescript';

@Table({ tableName: 'receptie', timestamps:false })
export class ReceptieModel extends Model<ReceptieModel> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: 'nvarchar', allowNull: false })
  medic: string;

  @Column({ type: 'nvarchar', allowNull: false })
  institutie: string;

  @Column({ type: 'nvarchar', allowNull: false })
  specialitate: string;

  @Column({ type: DataType.STRING, allowNull: false })
  cabinet: string;

  @Column({ type: DataType.STRING, allowNull: false })
  dataActiune: string;

  @Column({ type: DataType.STRING, allowNull: true })
  dataReceptie: string;

  @Column({ type: 'int', allowNull: false })
  row: number;
  
  @Column({ type: 'nvarchar', allowNull: true })
  pacient?: string;

  @Length({min:13,max:13})
  @Column({ type: 'nvarchar', allowNull: true})
  idnpPacient?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  dataNasterePacient?: string;

  @Column({ type: 'nvarchar', allowNull: true })
  adresaPacient?: string;

  @Column({ type: 'nvarchar', allowNull: true })
  medicDeFamiliePacient?: string;

  @Column({ type: 'nvarchar', allowNull: true })
  pacientProgramatDe?: string;

  @Column({ type: DataType.TIME, allowNull: true })
  oraPragamariiPacientului?: string;

  @Column({ type: 'nvarchar', allowNull: true })
  backgroundColor?: string;

  @Column({ type: 'nvarchar', allowNull: true })
  tipConsultatie?: string;
}