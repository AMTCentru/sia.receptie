import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { format, Logger, transports } from 'winston';
import { WinstonModule } from 'nest-winston';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const logger = new Logger()

  const PORT = process.env.PORT || 3000;

  const logLocation = process.env.LOG_LOCATION || './logs';
  if (!existsSync(logLocation)) {
    mkdirSync(logLocation, { recursive: true });
  }
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => {
          // Format simplificat pentru log
          return `[${timestamp}] [${level}] ${message}`;
        })
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.colorize(), // Activează culorile pentru consolă
            format.printf(({ timestamp, level, message }) => {
              return `[${timestamp}] [${level}] ${message}`;
            })
          ),
        }),
        new transports.File({
          level: 'error',
          filename: `${process.env.LOG_LOCATION}/error.log`,
          format: format.json(), // Format JSON pentru fișiere
        }),
        new transports.File({
          level: 'info',
          filename: `${process.env.LOG_LOCATION}/info.log`,
          format: format.json(),
        }),
      ],
    }),
  });

  // Configure CORS
  app.enableCors({
    origin: '*', // Schimbați '*' cu domeniile de încredere
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
  });
  // Configurare Swagger
  const config = new DocumentBuilder()
    .setTitle('SiaReceptie API')
    .setDescription('API pentru gestionarea logării și transferului în SiaReceptie')
    .setVersion('1.0')
    .addTag('siaReceptie')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Endpointul pentru Swagger este "/api"


  await app.listen(PORT, () => logger.log('info', `Server started on port = ${PORT}`))


}
bootstrap();
