import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import { SiaampReceptieService } from './siaampreceptie.service';

@Injectable()
export class siaampService {

    private browser: Browser;
    private readonly logger = new Logger(siaampService.name)

    constructor(private siaservice: SiaampReceptieService) {}

    async logareSiaReceptie(): Promise<Buffer> {
        try {
            console.log('Launching Puppeteer...');
            this.browser = await puppeteer.launch({
                //executablePath: '/usr/bin/google-chrome-stable',
                //headless: false,
                executablePath: '/usr/bin/chromium-browser',
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            const page = await this.browser.newPage();
            await page.goto('https://sia.amp.md/siaamp/');

            const butonLogare = "#formMPass > div > div:nth-child(2) > a"
            await page.waitForSelector(butonLogare)
            await page.click(butonLogare)
            const qr = "#evosign-qr"
            await page.waitForSelector(qr)
            await page.waitForFunction((selector) => {
                const img = document.querySelector(selector) as HTMLImageElement;
                return img && img.naturalWidth > 0 && img.naturalHeight > 0;
            }, {timeout: 5000}, qr);
            
            // Take a screenshot and save it to the specified path
            const filePath = path.resolve(__dirname, '../../screenshot.png');
            const boundingBox = await (await page.$(qr)).boundingBox();
            await page.screenshot({ 
                path: filePath,
                clip: {
                    x: boundingBox.x,
                    y: boundingBox.y,
                    width: boundingBox.width,
                    height: boundingBox.height,
                }  
            });

            // Read the screenshot file
            const screenshotBuffer = await readFile(filePath);
            return screenshotBuffer;

        } catch (error) {
            await this.browser.close()
            this.logger.error('[logareSiaReceptie] :', error);
            throw new BadRequestException('An error occurred while processing your request.');
        } 
    }

    async checkLogat(){
        try{
            if (!this.browser) {
                throw new Error('Nu exista browser pornit');
            }
            const page = await this.browser.newPage();
            await page.goto('https://sia.amp.md/siaamp/mpassUsers.html');

            const opertorRegistratura = ".ui-datagrid-row>td:nth-child(2)>div>div>form>input:nth-child(6)"
            await page.waitForSelector(opertorRegistratura)
            const filePath = path.resolve(__dirname, '../../screenshot.png');
            if (!opertorRegistratura) {
                await page.screenshot({path: filePath,})
                const screenshotBuffer = await readFile(filePath);
                return screenshotBuffer
            }  
            await page.click(opertorRegistratura)

            await page.goto('https://sia.amp.md/siaamp/',{
                waitUntil: 'load', // Așteaptă încărcarea completă
            });

            await page.screenshot({path: filePath,})
            const screenshotBuffer = await readFile(filePath);

            return screenshotBuffer
        } catch (error) {
            if (this.browser) {
                await this.browser.close();  // Închide browserul doar dacă este deschis
            }
            this.logger.error('[checkLogat]', error);
            throw new BadRequestException(error);
        } 
    }

    async startSiaReceptie(startdata: string, stopdata: string){

        const page : Page = await this.browser.newPage()
        
        try {
            await this.siaservice.Pas1(page)
            await this.siaservice.isHidden(page)
            const startDate = new Date(startdata);
            const stopDate = new Date(stopdata);
            await this.siaservice.Pas2(page,startDate,stopDate)
        } 
        catch (error) {
            await this.browser.close()
            return `Error while scraping job listings: ${error}`;
        } 
    }
}
