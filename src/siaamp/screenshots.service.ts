import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ScreenshotsService {

    private FOLDER = path.resolve('./logs/screenshots');
    private META_FILE = path.join(this.FOLDER, 'meta.json');

    async saveMeta(data: {
        institutie: string;
        medic: string;
        specialitate: string;
        data_programare: string;
        dataActiune: string
    }) {
        // 1️⃣ Creează folderul dacă nu există
        await fs.mkdir(this.FOLDER, { recursive: true });

        // 2️⃣ Citește meta.json existent
        let meta: any[] = [];
        try {
        const raw = await fs.readFile(this.META_FILE, 'utf-8');
        meta = JSON.parse(raw);
        } catch (err) {
        meta = [];
        }

        // 3️⃣ Generează UUID pentru filename
        const id = uuidv4();
        const filename = `${id}.webp`;
        const path = `${this.FOLDER}/${filename}`;

        // 4️⃣ Creează obiectul de salvare
        const newEntry = {
        id,
        filename,
        institutie: data.institutie,
        medic: data.medic,
        specialitate: data.specialitate,
        data_programare: data.data_programare,
        data_generare: data.dataActiune,
        path
        };

        // 4️⃣ Adaugă în meta array
        meta.push(newEntry);

        // 5️⃣ Scrie înapoi în meta.json
        await fs.writeFile(this.META_FILE, JSON.stringify(meta, null, 2));

        return newEntry;
    }
}