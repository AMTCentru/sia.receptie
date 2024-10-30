import { BadRequestException, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import * as path from 'path';
import puppeteer, { Browser, Page } from 'puppeteer';
import { SiaampReceptieService } from './siaampreceptie.service';

@Injectable()
export class siaampService {

    private browser: Browser;

    constructor(
        private siaservice: SiaampReceptieService,
    ) {}

    async logareSiaReceptie(): Promise<Buffer> {
        try {
            console.log('Launching Puppeteer...');
            this.browser = await puppeteer.launch({
                executablePath: '/usr/bin/google-chrome-stable',
                args: ['--no-sandbox'],
                headless: false,
                defaultViewport: { width: 1920, height: 1080 },
            });

            const page = await this.browser.newPage();
            await page.goto('https://sia.amp.md/siaamp/');

            const butonLogare = "#formMPass > div > div:nth-child(2) > a"
            await page.waitForSelector(butonLogare)
            await page.click(butonLogare)
            const qr = "#evosign-desktop"
            await page.waitForFunction((selector) => {
                return document.querySelector(selector) !== null;
            }, {}, qr);
            
            // Take a screenshot and save it to the specified path
            const filePath = path.resolve(__dirname, '../../screenshot.png');
            await page.screenshot({ path: filePath });

            // Read the screenshot file
            const screenshotBuffer = await readFile(filePath);
            return screenshotBuffer;

        } catch (error) {
            console.error('Error occurred:', error);
            throw new BadRequestException('An error occurred while processing your request.');
        } 
    }

    async startSiaReceptie(){

        const page : Page = (await this.browser.newPage())
        
        try {
            await page.goto('https://sia.amp.md/siaamp/mpassUsers.html');  
            const opertorRegistratura = ".ui-datagrid-row>td:nth-child(2)>div>div>form>input:nth-child(6)"
            await page.waitForSelector(opertorRegistratura)
            await page.click(opertorRegistratura)

            await this.siaservice.Pas1(page)
            await this.siaservice.isHidden(page)
            await this.siaservice.Pas2(page)
        } 
        catch (error) {
          return `Error while scraping job listings: ${error}`;
        } finally {
            // if (this.browser) {
            //     await this.browser.close(); // Ensure the browser is closed
            // }
            //trebuie sa trimit mesaj la bot de finisare
        }

    }
}
