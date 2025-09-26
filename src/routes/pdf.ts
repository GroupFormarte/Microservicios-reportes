import { Router } from "express";
import { generateReport } from "../controllers/pdf/pdf.controller";
import ejs from "ejs";
import path from "path";
import fs from 'fs';

const  router = Router();
router.post("/generate", generateReport);
router.get("/preview", async (req, res) => {
    const student = {
      evaluacion: 'ASIT',
      nombre: 'Aguilar',
      codigo: '1112049372',
      numeroLista: 1,
      institucion: 'FORMARTE MEDELLIN',
      grupo: 'UDEA G-1',
      puesto: 5,
      gra: 0,
      gru: 0,
      ciudad: 'Medellín',
      fecha: '2025-06-13T09:16:10.030',
      puntaje: 24.885,
      areas: [
        {
          nombre: 'Competencia Lectora',
          correctas: 10,
          total: 40,
          puntaje: 25
        },
        {
          nombre: 'Razonamiento Lógico',
          correctas: 13,
          total: 40,
          puntaje: 33
        }
      ]
    };  

    const logoPath = path.join(process.cwd(), 'storage/templates/logo_podium.png');
const logoBase64 = fs.readFileSync(logoPath, { encoding: 'base64' });
const logoDataUrl = `data:image/png;base64,${logoBase64}`;
    // const html = await ejs.renderFile(path.join(__dirname, "../templates/report.ejs"), { student });  path.join(process.cwd(), "src/templates/report.ejs"),
    const html = await ejs.renderFile( path.join(process.cwd(), "storage/templates/report.ejs"),  { student, logoUrl: logoDataUrl },);
  res.send(html);
}); 
export default router;