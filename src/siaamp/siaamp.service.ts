import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import puppeteer, { Browser, Page } from 'puppeteer';
import { SiaampReceptieService } from './siaampreceptie.service';

@Injectable()
export class siaampService {

    private browser: Browser;
    private readonly logger = new Logger(siaampService.name)

    constructor(private siaservice: SiaampReceptieService) {}

    async logareSiaReceptie(): Promise<Buffer> {
        if (this.browser) {
            this.logger.error('[logareSiaReceptie] Exista browser pornit');

            throw new Error('[logareSiaReceptie] Exista browser pornit');
        }
        this.logger.log('Launching Puppeteer...');
        this.browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome-stable',
            //headless: false,
            //executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const pages: Page[] = await this.browser.pages();
        const page: Page = pages[0]; // Prima pagină deschisă
        try {
            await page.goto('https://sia.amp.md/siaamp/',{
                waitUntil:'load',
                timeout: 5000
            });
            this.logger.log(`[logareSiaReceptie] Pagina Deschisa`)

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
            const filePath = `${process.env.LOG_LOCATION}/screenshot.png`;
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
            this.browser = null
            this.logger.error('[logareSiaReceptie] :', error);
            throw new BadRequestException('An error occurred while processing your request.');
        }
    }

    async checkLogat(){
        if (!this.browser) {
            throw new Error('Nu exista browser pornit');
        }
        const page = await this.browser.newPage();
        this.logger.error('[checkLogat] Pagina deschisa');
        try{
            await page.goto('https://sia.amp.md/siaamp/mpassUsers.html');
            const opertorRegistratura = ".ui-datagrid-row>td:nth-child(2)>div>div>form>input:nth-child(6)"
            await page.waitForSelector(opertorRegistratura,{timeout:5000})
            const filePath = `${process.env.LOG_LOCATION}/screenshot.png`;
            if (!opertorRegistratura) {
                await page.screenshot({path: filePath,})
                const screenshotBuffer = await readFile(filePath);
                return screenshotBuffer
            }  
            await page.click(opertorRegistratura)

            await page.goto('https://sia.amp.md/siaamp/',{waitUntil: 'load', // Așteaptă încărcarea completă
            });

            await page.screenshot({path: filePath,})
            const screenshotBuffer = await readFile(filePath);
            return screenshotBuffer
        } catch (error) {
            if (this.browser) {
                await this.browser.close();  // Închide browserul doar dacă este deschis
                this.browser = null
            }
            this.logger.error('[checkLogat]', error);
            throw new BadRequestException(error);
        } finally {
            await page.close()
            this.logger.error('[checkLogat] Pagina inchisa');
        }
    }

    async startSiaReceptie(startdata: string, stopdata: string){

        const pages: Page[] = await this.browser.pages();
        const page: Page = pages[0]; // Prima pagină deschisă
        
        try {
            await this.siaservice.Pas1(page)
            await this.siaservice.isHidden(page)
            const startDate = new Date(startdata);
            const stopDate = new Date(stopdata);
            await this.siaservice.Pas2(page,startDate,stopDate)
        } 
        catch (error) {
            await this.browser.close()
            this.browser = null
            this.logger.error(`[startSiaReceptie] eroare : ${error}`);
        } 
    }

    async captureAllPages() {
        try {
            if (!this.browser) {
                throw new Error('Browser-ul nu este pornit.');
            }
    
            // Obține toate paginile deschise din browser
            const pages = await this.browser.pages();
            if (!pages.length) {
                throw new Error('Nu există pagini deschise în browser.');
            }
    
            const screenshots = [];
            const filePath = `${process.env.LOG_LOCATION}`;
    
            // Iterează prin fiecare pagină și capturează un screenshot
            for (const [index, page] of pages.entries()) {
                const screenshotPath = `${filePath}/screenshot_page_${index + 1}.png`;
                await page.screenshot({ path: screenshotPath, fullPage: true });
    
                // Opțional: citește bufferul screenshot-ului pentru a returna
                const screenshotBuffer = await readFile(screenshotPath);
                screenshots.push({
                    pageIndex: index + 1,
                    url: page.url(),
                    screenshotBuffer,
                });
            }
    
            return screenshots;
        } catch (error) {
            this.logger.error('[captureAllPages]', error);
            throw new BadRequestException(error);
        }
    }   
}