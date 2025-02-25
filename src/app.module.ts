import { ReceptieModule } from './receptie/receptie.module';
import { SiaampModule } from './siaamp/siaamp.module';
import { ReceptieModel } from './receptie/receptie.model';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { HttpLoggerMiddleware } from './HttpLoggerMiddleware';


@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env'
    }),
    SequelizeModule.forRoot({
      logging: false,
      dialect: 'mssql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      models: [
        ReceptieModel,
      ],
    }),
    ReceptieModule,
    SiaampModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
