import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { ip, method, path: url } = req;
        const userAgent = req.get('user-agent') || '';
        const startTime = Date.now();

        res.on('finish', () => {
        const { statusCode } = res;
        const contentLength = res.get('content-length');
        const duration = Date.now() - startTime;

        this.logger.log(
            `HTTP ${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip} ${duration}ms` 
        );
        });

        next();
    }
}
