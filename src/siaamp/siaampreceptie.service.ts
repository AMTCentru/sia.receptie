import { Injectable } from '@nestjs/common';
import { Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { CreateReceptieDto } from 'src/receptie/create.dto';
import { ReceptieService } from 'src/receptie/receptie.service';

@Injectable()
export class SiaampReceptieService {

  constructor(private receptieService: ReceptieService) {}

  async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async Pas1(page: Page){
    await page.goto('https://sia.amp.md/siaamp/');  
    const clickReceptie = "#appMenuForm\\:tabMenuModules > ul > li:nth-child(2) > a"
    await page.waitForSelector(clickReceptie)
    await page.click(clickReceptie)

    const clickRegistru = ".leftBar>div:nth-child(2)"
    await this.isHidden(page)
    await page.click(clickRegistru)

    const clickReceptiePeZi = ".leftBar>div:nth-child(2)>div>div>ul>li:nth-child(1)"
    await this.isHidden(page)
    await page.click(clickReceptiePeZi)
    console.log('Final Pas1')
  }
  async Pas2(page: Page){
    // await page.goto('https://sia.amp.md/siaamp/');  
    await this.isHidden(page)
    console.log('Start Pas2')

    await this.tabelmedici(page)
    const lastrows = await this.receptieService.getLastRow()
    for (let row = lastrows; row <= 300; row++) {
      console.log('Rindul: '+ row)
      await this.isHidden(page)

      const click = `#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID > div:nth-child(2) > table > tbody > tr:nth-child(${row}) > td:nth-child(5)`
      await page.evaluate((click)=>{
        (document.querySelector(click) as HTMLElement).scrollIntoView()
      },click)
      // await page.select(click)
      // Extract the institution name
      const institutia = await page.evaluate((row) => {
        return document.querySelector(`#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(5)`).textContent;
      }, row);
      const numeMedic = await page.evaluate((row) => {
        return document.querySelector(`#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(2)`).textContent;
      }, row);
      const prenumeMedic = await page.evaluate((row) => {
        return document.querySelector(`#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(3)`).textContent;
      }, row);
      console.log(numeMedic,' ',prenumeMedic)
      
      const specialiatate = await page.evaluate((row) => {
          return document.querySelector(`#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(4)`).textContent;
      }, row);
      if (institutia !== 'AMS IMSP Institutul Mamei și Copilului'  && specialiatate !== 'Alta specialitate') {

        const receptieDto = new CreateReceptieDto();
        receptieDto.medic = numeMedic+" "+prenumeMedic
        receptieDto.institutie = institutia
        receptieDto.specialitate = specialiatate
        receptieDto.row = row
        
        const buton = `#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(1)>button`;
        await page.waitForSelector(buton); // Ensure the button is available before clicking
        await page.click(buton); // Click the button

        const perioadaStart = new Date('2024-10-21');
        const perioadaFinish = new Date('2024-11-30');
        
        await this.pas3(page, perioadaStart, perioadaFinish, receptieDto);

        await this.tabelmedici(page)

      }
    }
  }  
  async pas3(page: Page, perioadaStart: Date, perioadaStop: Date,data:CreateReceptieDto) {
    await this.isHidden(page)
    await page.waitForSelector('#contentform\\:panelTab_header'); // 10 seconds
    console.log('Start Pas3');

    let currentDate = perioadaStart;
    while (currentDate <= perioadaStop) {
      await this.isHidden(page);
      const suntemintabelulcaretrebuie = await this.ceziesteintabel(page, currentDate);
      const curentmonth = parseInt(suntemintabelulcaretrebuie.split('-')[1]);
      const startmonth = currentDate.getMonth() + 1; // +1 pentru a obține luna 1-12
      const monthDiff = startmonth - curentmonth;

      await this.verifyDay(page, monthDiff);

      await this.isHidden(page)
      const curentclickdate = await this.clickDate(page, currentDate);

      await this.getHTML(page, curentclickdate,data); // Așteaptă rezultatul

      currentDate.setDate(currentDate.getDate() + 1); // Adaugă o zi
    }
  }

  async clickDate(page: Page, currentDate: Date) : Promise<Date>{
    let curentclickdate
    const dataTabel = '#contentform\\:panelTab_header > span'
    const datacurenta = await page.evaluate((dataTabel)=>{
      return document.querySelector(dataTabel).textContent
    },dataTabel)
    const ceva = new Date(
      parseInt(datacurenta.split(' ')[3]),
      parseInt(datacurenta.split(' ')[2])-1,
      parseInt(datacurenta.split(' ')[1])
    )

    do{
      curentclickdate = await page.evaluate((currentDateISO) => {
        const td = Array.from(document.querySelectorAll('.fc-border-separate > tbody > tr > td'));
        for (const element of td) {
            const dateString = element.getAttribute('data-date');
            if (dateString === currentDateISO) {
              (element as HTMLElement).click(); // Face clic pe elementul corespunzător
              return dateString; // Salvează data găsită
            }
        }
      }, currentDate.toISOString().split('T')[0]);
      await this.isHidden(page)
    } while (new Date(curentclickdate) === ceva)
    return new Date(curentclickdate)
  }

  async verifyDay(page: Page, month: number) {
      const direction = month < 0 ? 'prev' : 'next';
      const buttonSelector = `#contentform\\:schedule_container > table > tbody > tr > td.fc-header-left > span.fc-button.fc-button-${direction}.ui-state-default.ui-corner-${direction === 'prev' ? 'left' : 'right'}`;

      for (let i = 0; i < Math.abs(month); i++) {
        await page.waitForSelector(buttonSelector);
        await page.click(buttonSelector);
        await this.isHidden(page)
          
        await this.isHidden(page);

        const firstday = "#contentform\\:schedule_container > div > div > table > tbody > tr:nth-child(3) > td.fc-day.fc-mon.ui-widget-content.fc-first";
        await page.waitForSelector(firstday);
        await page.click(firstday);
      }
  }


  async getHTML(page: Page, currentDate: Date, data:CreateReceptieDto) {
    const CLINIC_SELECTOR = '#contentform\\:setDoctorPatient > tbody > tr:nth-child(2) > td:nth-child(2)';
    const LEGEND_TABLE_SELECTOR = '#contentform\\:colorConsultNom>div>div';
    const RECEPTION_TABLE_SELECTOR = '#contentform\\:tableGraphic > div'

    try {
      const legendElement = await page.$(LEGEND_TABLE_SELECTOR);
      const cabinetMedic = await page.evaluate((CLINIC_SELECTOR) => {
        return document.querySelector(CLINIC_SELECTOR).textContent
      },CLINIC_SELECTOR);
      let legendContent = [];
      let receptieContent = [];
  
      if (legendElement) {
        const legenda = await page.evaluate(el => el.innerHTML, legendElement);
        const tabelReceptie = await page.$eval(RECEPTION_TABLE_SELECTOR, el => el.innerHTML);
  
        const $legend = cheerio.load(legenda);
        if($legend('tr').length > 0){
          $legend('tr').each((_, row) => {
            const cell = $legend(row).find('td');
            if (cell.length) {
              const backgroundColor = cell.attr('style')?.match(/background-color:\s*(#\w{6}|#\w{3})/)?.[1] || null;
              const textContent = cell.text().trim();
              legendContent.push({ text: textContent, backgroundColor });
            }
          });
    
          const $$ = cheerio.load(tabelReceptie);
          $$('tr').each((_, element) => {
            const cells = $$(element).find('td');
            if (cells.length) {
              const time = $$(element).find('td').eq(1).text().trim();
              const pacientData = $$(element).find('td').eq(2).html() || '';
              const backgroundColor = $$(element).find('td').eq(1).attr('style')?.match(/background-color:\s*(#\w{6}|#\w{3})/)?.[1];
              const pacientMatch = pacientData.match(/<br>(.*?), IDNP/);
              const idnpPacient = pacientData.match(/IDNP:\s*(.*?),/);
              const formattedDate = pacientData.match(/(\d{2})\/(\d{2})\/(\d{4})/);
              const dataNasterePacient = formattedDate
                ? new Date(
                    parseInt(formattedDate[3]),         // year
                    parseInt(formattedDate[2]) - 1,     // month (0-indexed)
                    parseInt(formattedDate[1])           // day
                  ).toLocaleString('sv-SE', { timeZone: 'Europe/Chisinau' }).replace('T', ' ')
                : null; // sau un alt default, dacă nu se găsește data
              const medicDeFamilie = $$(element).find('td').eq(3).text().trim();
              const programatDe = $$(element).find('td').eq(5).text().trim();
    
              receptieContent.push({
                pacient: pacientMatch ? pacientMatch[1].trim() : null,
                idnpPacient: idnpPacient ? idnpPacient[1].trim() : null,
                dataNasterePacient: dataNasterePacient ? dataNasterePacient : null,
                address: pacientData.match(/Adresă:\s*(.*)/)?.[1]?.trim() || null,
                medicDeFamilie,
                programatDe,
                backgroundColor,
                time
              });
            }
          });
  
          // Combine reception content with legend
          const newReceptionContent = receptieContent.map(entry => {
            const matchingLegend = legendContent.find(legend => entry.backgroundColor === legend.backgroundColor);
            return { ...entry, text: matchingLegend ? matchingLegend.text : null };
          });
          for (const entry of newReceptionContent) {
            data.cabinet = cabinetMedic;
            data.dataActiune = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Chisinau' }).replace('T', ' ');
            data.dataReceptie = currentDate.toLocaleString('sv-SE', { timeZone: 'Europe/Chisinau' }).replace('T', ' ');
            data.pacient = entry.pacient;
            data.idnpPacient = entry.idnpPacient;
            data.dataNasterePacient = entry.dataNasterePacient;
            data.adresaPacient = entry.address;
            data.medicDeFamiliePacient = entry.medicDeFamilie;
            data.pacientProgramatDe = entry.programatDe;
            data.oraPragamariiPacientului = entry.time;
            data.backgroundColor = entry.backgroundColor
            data.tipConsultatie = entry.text;
            await this.receptieService.create(data);
          }
        }
      } 
    } catch (error) {
      console.error("Error processing data:", error);
    }
  }
  
  async ceziesteintabel(page: Page,currentDate: Date){
    return await page.evaluate((currentDateISO) => {
      const td = document.querySelectorAll('#contentform\\:schedule_container > div > div > table > tbody > tr:nth-child(3) > td.fc-day.fc-mon.ui-widget-content.fc-first');
      let dateString
      td.forEach((element) => {
        dateString = element.getAttribute('data-date');
        if (dateString === currentDateISO) {
          (element as HTMLElement).click(); // Face clic pe elementul corespunzător
          return dateString
        }
      });
      return dateString; // Returnează toate datele găsite 
    }, currentDate.toISOString().split('T')[0]);
  }
  async isHidden(page: Page) {
    let value;
    let attempts = 0; // Track the number of attempts
  
    do {
      await this.delay(300); // Wait for a short duration
      value = await page.evaluate(() => {
        const element = document.querySelector('body > div:nth-child(5)');
        return element && element.getAttribute('style') 
          ? element.getAttribute('style').includes('hidden') 
          : false; // Check if the element exists and has the hidden style
      });
      attempts++; // Increment the attempts counter
  
      // Reload the page if the limit of attempts is exceeded
      if (attempts > 10) {
        await page.reload();
        console.log('Reloading page due to hidden element');
        attempts = 0; // Reset attempts after reloading
      }
    } while (value !== true); // Continue until the element is no longer hidden
    return value; // Return the final state
  }
  

  async tabelmedici(page:Page){
    console.log('Start Tabel Medici')

    await this.isHidden(page)
    const clickAlegeMedicul = "#contentform\\:selectedDoctor>tbody>tr:nth-child(2)>td:nth-child(2)>button"
    await page.waitForSelector(clickAlegeMedicul)
    await page.click(clickAlegeMedicul)    

    await this.isHidden(page)
    const alltable = await page.evaluate(() => {
      const rows = document.querySelectorAll('#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID_data>tr'); // Selectorul corect pentru rânduri
      return rows.length > 250;
    });
    if(alltable === false){
      const changeValuePaginator = "#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID_paginator_bottom > select > option:nth-child(2)"
      await page.waitForSelector(changeValuePaginator)
  
      await page.evaluate((selector) => {
        const select = document.querySelector(selector) as HTMLSelectElement;
        select.value = '300'; // Set the desired value
        select.dispatchEvent(new Event('change')); // Trigger change event
      }, changeValuePaginator);
  
      // Now you can select an option if needed
      const clickPaginator = "#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID_paginator_bottom > select";
      await this.isHidden(page)
      await page.waitForSelector(clickPaginator)
      await page.click(clickPaginator);
  
      await this.isHidden(page)
      const dropdown = await page.$(clickPaginator); // Use the same selector for the dropdown
      await dropdown.select('300'); // Use the value of the option you want to select
      console.log('Tabel Medici - clickpaginator')
    }
    await this.isHidden(page)
    console.log('Final Tabel Medici')
  }
}