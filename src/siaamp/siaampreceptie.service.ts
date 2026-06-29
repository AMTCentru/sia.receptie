import { Injectable, Logger } from '@nestjs/common';
import { Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import { CreateReceptieDto } from '../receptie/create.dto';
import { ReceptieService } from '../receptie/receptie.service';
import { UpdateVerificareReceptieDto } from 'src/receptie/UpdateVerificareReceptie.dto';
import * as fs from 'fs';
import { ScreenshotsService } from './screenshots.service';

@Injectable()
export class SiaampReceptieService {

  private readonly logger = new Logger(SiaampReceptieService.name)
  private lastRowPath = './ultima_pozitie.json';
  
  constructor(
    private receptieService: ReceptieService,
    private screenshotsService: ScreenshotsService
  ) {}

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
    this.logger.log('[SiaampReceptieService] Final Pas1')
  }
  async Pas2(page: Page, perioadaStart: Date, perioadaFinish: Date){
    let i = 0
    //let lastrows = await this.receptieService.getLastRow()
    let lastrows: number; // variabilă definită în afara blocului

    if (fs.existsSync(this.lastRowPath)) {
      const data = JSON.parse(fs.readFileSync(this.lastRowPath, 'utf-8'));
      lastrows = data.ultimaPozitie;
    } else {
      lastrows = 1; // valoare inițială
      fs.writeFileSync(this.lastRowPath, JSON.stringify({ ultimaPozitie: lastrows }));
    }

    while(true){
      await this.isHidden(page)
      this.logger.log(`[Pas2] Numarul de repetari : ${i}`)
      
      const totalRow = await this.tabelmedici(page)
      this.logger.log(`[Pas2] totalRow : ${totalRow}, lastrows : ${lastrows}`)

      for (let row = lastrows; row <= totalRow; row++) {
        this.logger.log(`[Pas2] Rindul: ${row}`)
        fs.writeFileSync(this.lastRowPath, JSON.stringify({ ultimaPozitie: row }));
        await this.isHidden(page)
  
        const click = `#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID > div:nth-child(2) > table > tbody > tr:nth-child(${row}) > td:nth-child(5)`
        await page.evaluate((click)=>{
          (document.querySelector(click) as HTMLElement).scrollIntoView()
        },click)

        const institutia = await page.evaluate((row) => {
          return document.querySelector(`#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(5)`).textContent;
        }, row);
        const numeMedic = await page.evaluate((row) => {
          return document.querySelector(`#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(2)`).textContent;
        }, row);
        const prenumeMedic = await page.evaluate((row) => {
          return document.querySelector(`#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(3)`).textContent;
        }, row);
        const specialiatate = await page.evaluate((row) => {
          return document.querySelector(`#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(4)`).textContent;
        }, row);

        this.logger.log(`[Pas2] ${numeMedic} ${prenumeMedic} ${specialiatate}`)        
        const excludeSpecialitati = [
          'Alta specialitate',
          //'Medic de familie'
        ];

        if (
          institutia !== 'Instituția Medico-Sanitară Publică Institutul Mamei și Copilului' &&
          !excludeSpecialitati.includes(specialiatate)
        ) {
          const receptieDto = new CreateReceptieDto();
          receptieDto.medic = numeMedic+" "+prenumeMedic
          receptieDto.institutie = institutia
          receptieDto.specialitate = specialiatate
          receptieDto.row = row
          
          const buton = `#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID>div:nth-child(2)>table>tbody>tr:nth-child(${row})>td:nth-child(1)>button`;
          await page.waitForSelector(buton); // Ensure the button is available before clicking
          await page.click(buton); // Click the button
          
          await this.pas3(page, perioadaStart, perioadaFinish, receptieDto);         
        }
        await this.tabelmedici(page)
        if(totalRow === row){
          lastrows = 1
          fs.writeFileSync(this.lastRowPath, JSON.stringify({ ultimaPozitie: lastrows }));
        }
      }
      i++
    }
  }  
  async pas3(page: Page, perioadaStart: Date, perioadaStop: Date,data:CreateReceptieDto) {
    await this.isHidden(page)
    await page.waitForSelector('#contentform\\:panelTab_header'); // 10 seconds

    let currentDate = new Date(perioadaStart);
    while (currentDate <= perioadaStop) {
      await this.isHidden(page);
      const suntemintabelulcaretrebuie = await this.ceziesteintabel(page, currentDate);
      const curentYear = parseInt(suntemintabelulcaretrebuie.split('-')[0]);
      const year = (currentDate.getFullYear() - curentYear) * 12
      const curentmonth = parseInt(suntemintabelulcaretrebuie.split('-')[1]);
      const startmonth = currentDate.getMonth() + 1; // +1 pentru a obține luna 1-12
      const monthDiff = year + startmonth - curentmonth;

      await this.verifyDay(page, monthDiff);

      await this.isHidden(page)
      const curentclickdate = await this.clickDate(page, currentDate);

      //await this.getHTML(page, curentclickdate,data); // Așteaptă rezultatul
      data.dataReceptie=curentclickdate
      await this.checkAndSaveTable(page,data); // Așteaptă rezultatul
      currentDate.setDate(currentDate.getDate() + 1); // Adaugă o zi
    }
  }

  async clickDate(page: Page, currentDate: Date) : Promise<string>{
    let curentclickdate
    const dataTabel = '#contentform\\:panelTab_header > span'
    const datacurenta = await page.evaluate((dataTabel)=>{
      return document.querySelector(dataTabel).textContent
    },dataTabel)
    const parts = datacurenta.trim().split(' ');
    const ceva = new Date(
      parseInt(parts[3]),      // an
      parseInt(parts[2]) - 1,  // luna (0-11)
      parseInt(parts[1])       // zi
    );

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
    this.logger.log(`[clickDate] : ${curentclickdate}`)
    return curentclickdate
  }

  async verifyDay(page: Page, month: number) {
      const direction = month < 0 ? 'prev' : 'next';
      const buttonSelector = `#contentform\\:schedule_container > table > tbody > tr > td.fc-header-left > span.fc-button.fc-button-${direction}.ui-state-default.ui-corner-${direction === 'prev' ? 'left' : 'right'}`;

      for (let i = 0; i < Math.abs(month); i++) {
        await page.waitForSelector(buttonSelector);
        await page.click(buttonSelector);
        await this.isHidden(page)

        const firstday = "#contentform\\:schedule_container > div > div > table > tbody > tr:nth-child(3) > td.fc-day.fc-mon.ui-widget-content.fc-first";
        await page.waitForSelector(firstday);
        await page.click(firstday);
      }
  }

  async getHTML(page: Page, currentDate:string, data:CreateReceptieDto) {
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
            data.dataReceptie = currentDate;
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
      this.logger.error(`[getHTML] eroare : ${error}`);
    }
  }
  async checkAndSaveTable(page: Page,data: CreateReceptieDto,) {
    const RECEPTION_TABLE_SELECTOR = '#contentform\\:tableGraphic_data';
    data.dataActiune = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Chisinau' }).replace('T', ' ');
    //const imagePath = `screenshots/${data.institutie}_${data.medic}_${data.specialitate}_${data.dataReceptie}_${data.dataActiune}.png`;
    const emptyTable = '<tbody id="contentform:tableGraphic_data" class="ui-datatable-data ui-widget-content"><tr class="ui-widget-content ui-datatable-empty-message"><td colspan="6">(0) Înregistrări găsite</td></tr></tbody>'
    try {
      const tableHandle = await page.$(RECEPTION_TABLE_SELECTOR);
      if (!tableHandle) {
        //this.logger.warn('Tabelul nu a fost găsit!');
        return;
      }

      // 1️⃣ ia outerHTML
      const currentHTML = await page.evaluate(el => el.outerHTML, tableHandle);
      if(currentHTML.trim() == emptyTable.trim()){
        // nu exista sablon
        //this.logger.warn('Tabelul este gol!');
        return;
      }
      // 2️⃣ caută rând existent în BD
      const existingRow = await this.receptieService.getLastTable(data)
      if (!existingRow) {
        const meta = await this.screenshotsService.saveMeta({
          institutie: data.institutie,
          medic: data.medic,
          specialitate: data.specialitate,
          data_programare: data.dataReceptie,
          dataActiune: data.dataActiune
        });
        // 3️⃣ rând inexistent → INSERT
        await page.screenshot({
          path: meta.path,
          type: 'webp',      // Puppeteer suportă webp
          quality: 80,       // calitate (0-100)
          fullPage: true 
        });
        await this.receptieService.createverificarereceptiediferente({
          institutie: data.institutie,
          numeMedic: data.medic,
          specialitate: data.specialitate,
          dataReceptie: data.dataReceptie,
          continutReceptie: currentHTML,
          numeImagine: meta.path,
        });

        this.logger.log('Rând nou inserat și screenshot salvat.');
      } else if (existingRow.trim() !== currentHTML.trim()) {
          //this.logger.log(`[checkAndSaveTable] - curent : ${currentHTML.trim()} - precedent : ${existingRow.trim()}`)
          const pacientiInainte = await this.extragePacientiDinHtml(existingRow);
          const pacientiDupa = await this.extragePacientiDinHtml(currentHTML);
          const modificari = await this.verificaSchimbari(pacientiInainte, pacientiDupa,page,data);
          if(modificari.length > 0){

            const meta = await this.screenshotsService.saveMeta({
              institutie: data.institutie,
              medic: data.medic,
              specialitate: data.specialitate,
              data_programare: data.dataReceptie,
              dataActiune: data.dataActiune
            });
            const updateDto: UpdateVerificareReceptieDto = {
              continutReceptie: currentHTML,
              numeImagine: meta.path,
            };
            await this.receptieService.updateTable(
              {
                institutie: data.institutie,
                numeMedic: data.medic,
                specialitate: data.specialitate,
                dataReceptie: data.dataReceptie,
              },
              updateDto,
            );
            await this.detaliiScreenshot(page, modificari, meta.path);

            await this.getHTML(page, data.dataReceptie,data);
            this.logger.log('Rând existent actualizat și screenshot refăcut.');
          }
      } else {
        // 5️⃣ rând existent și identic → nimic de făcut
        this.logger.log('Tabelul este identic, continuăm.');
      }

    } catch (error) {
      this.logger.error(`[checkAndSaveTable] eroare: ${error}`);
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
      await new Promise(resolve => setTimeout(resolve, 300));
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
        this.logger.log('[isHidden] Reloading page due to hidden element');
        attempts = 0; // Reset attempts after reloading
      }
    } while (value !== true); // Continue until the element is no longer hidden
    return value; // Return the final state
  }
  
  async tabelmedici(page:Page) : Promise<number> {
    this.logger.log('[tabelmedici] Start Tabel Medici')

    await this.isHidden(page)
    const clickAlegeMedicul = "#contentform\\:selectedDoctor>tbody>tr:nth-child(2)>td:nth-child(2)>button"
    await page.waitForSelector(clickAlegeMedicul)
    await page.click(clickAlegeMedicul)    

    await this.isHidden(page)
    await page.waitForSelector('#contentform\\:docTableDoctor\\:doctorFormSpecialization', {
        visible: true, // Asigură-te că este vizibil
        timeout: 10000 // Timeout de 20 de secunde
    });
    const alltable = await page.evaluate(() => {
      const rows = document.querySelectorAll('#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID_data>tr'); // Selectorul corect pentru rânduri
      return rows.length > 250;
    });
    // Get the total number of items
    const text = await page.evaluate(() => {
      return document.querySelector('.ui-paginator-current').textContent;
    });

    const match = text.match(/din (\d+)/);
    const total = match[1]; // Default to '0' if no match found
    if(total == '0'){
      return null
    }

    if(alltable === false){
      
      const changeValuePaginator = "#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID_paginator_bottom > select > option:nth-child(2)"
      await page.waitForSelector(changeValuePaginator)

      await page.evaluate((selector,total) => {
        const select = document.querySelector(selector) as HTMLSelectElement;
        select.value = total; // Set the desired value
        select.dispatchEvent(new Event('change')); // Trigger change event
      }, changeValuePaginator,total);
      // Now you can select an option if needed
      const clickPaginator = "#contentform\\:docTableDoctor\\:doctorFormSpecialization\\:doctorTableID_paginator_bottom > select";
      await this.isHidden(page)
      await page.waitForSelector(clickPaginator)
      await page.click(clickPaginator);
      await this.isHidden(page)
      const dropdown = await page.$(clickPaginator); // Use the same selector for the dropdown
      await dropdown.select(total); // Use the value of the option you want to select
      this.logger.log('[tabelmedici] Tabel Medici - clickpaginator')
    }
    await this.isHidden(page)
    this.logger.log('[tabelmedici] Final Tabel Medici')
    return parseInt(total)
  }

  async extragePacientiDinHtml(html: string): Promise<string[]> {
    const pacienti: string[] = [];

    // 1️⃣ Spargem după <br> și eliminăm spațiile goale
    const lines = html.split('<br>').map(l => l.trim());

    const regex = /IDNP:\s*(\d{13})/;

    for (const line of lines) {
      if (!line) {
        // linie goală → adăugăm string gol
        pacienti.push('');
        continue;
      }

      const match = line.match(regex);
      if (match) {
        // Poți alege ce să adaugi: linia completă sau doar nume+IDNP+data
        pacienti.push(match[0].trim());
      } 
    }
    return pacienti;
  }

  async verificaSchimbari(
    pacientiInainte: string[],
    pacientiDupa: string[],
    page: Page,
    data: CreateReceptieDto
  ) {
    const modificari = [];
    //this.logger.log(`[verificaSchimbari] - start`);

    const maxLength = Math.max(pacientiInainte.length, pacientiDupa.length);

    for (let i = 0; i < maxLength; i++) {
      const inainte = (pacientiInainte[i] || '').trim();
      const dupa = (pacientiDupa[i] || '').trim();

      if (inainte !== dupa) {
        let tip = '';

        if (!inainte && dupa) {
          tip = 'added'; // 🟢 nou
        } else if (inainte && !dupa) {
          tip = 'removed'; // 🔴 șters
        } else {
          tip = 'modified'; // 🔴 modificat
        }

        this.logger.log(`[verificaSchimbari] ${tip}: '${inainte}' -> '${dupa}'`);

        modificari.push({ index: i, inainte, dupa, tip });
      }
    }
    return modificari;
  }

  async detaliiScreenshot(page: Page, modificari: any[], imagePath: string) {
    await page.evaluate((lista) => {

      const normalize = (str: string) =>str.replace(/\s+/g, ' ').trim();

      const extractIdnp = (text: string) => {
        const m = text.match(/IDNP:\s*(\d+)/);
        return m ? m[1] : null;
      };

      // 🔥 1. Transformăm în MAP pentru lookup rapid O(1)
      const targetsMap = new Map<string, string>();

      lista.forEach(m => {
        const idnp = extractIdnp(m.dupa || m.inainte);
        if (idnp) {
          targetsMap.set(idnp, m.tip);
        }
      });

      // 🔥 2. Reset stiluri (mai rapid)
      document.querySelectorAll('td, tr').forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.border = '';
        htmlEl.style.backgroundColor = '';
      });

      const tds = document.querySelectorAll('td');

      let firstMatch: HTMLElement | null = null;

      // 🔥 3. Iterare unică fără nested loop
      tds.forEach(td => {
        const htmlTd = td as HTMLElement;
        const content = normalize(htmlTd.innerText);
        const idnp = extractIdnp(content);

        if (!idnp) return;

        const tip = targetsMap.get(idnp);
        if (!tip) return;

        let borderColor = 'red';
        let bgColor = 'rgba(255,0,0,0.15)';

        if (tip === 'added') {
          borderColor = 'green';
          bgColor = 'rgba(0,255,0,0.15)';
        }

        // aplicare stil
        htmlTd.style.border = `3px solid ${borderColor}`;
        htmlTd.style.backgroundColor = bgColor;

        const tr = htmlTd.closest('tr') as HTMLElement;
        if (tr) {
          tr.style.border = `3px solid ${borderColor}`;
          tr.style.backgroundColor = bgColor;
        }

        // 🔥 salvăm doar primul pentru scroll
        if (!firstMatch) {
          firstMatch = htmlTd;
        }
      });

      // 🔥 4. scroll o singură dată
      if (firstMatch) {
        firstMatch.scrollIntoView({ block: 'center' });
      }

    }, modificari);

    await new Promise(r => setTimeout(r, 200)); // redus

    await page.screenshot({
      path: imagePath,
      type: 'webp',
      quality: 80,
      fullPage: true
    });
  }
}