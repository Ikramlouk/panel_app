const router = require('express').Router();
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, ImageRun } = require('docx');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { generateReportData } = require('../services/geminiService');

const reportsDir = path.join(__dirname, '../../uploads/reports');
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

// T'akked blli l'logo smito logo.png w m7et f dossier backend/uploads
const logoPath = path.join(__dirname, '../../uploads/logo.png'); 

router.post('/generate', auth, async (req, res) => {
  const { format, prompt } = req.body; 
  try {
    const panneaux = await pool.query('SELECT reference, emplacement, status FROM panneaux');
    const anomalies = await pool.query("SELECT anomalie_type, confidence, detected_at FROM detections WHERE anomalie_type IS NOT NULL");
    const dataContext = `Panneaux: ${JSON.stringify(panneaux.rows)}\nAnomalies: ${JSON.stringify(anomalies.rows)}`;

    const reportData = await generateReportData(prompt || "Rapport général", dataContext);

    const fileName = `Rapport_${Date.now()}.${format === 'pdf' ? 'pdf' : format === 'word' ? 'docx' : 'xlsx'}`;
    const filePath = path.join(reportsDir, fileName);
    const fileUrl = `http://localhost:5000/uploads/reports/${fileName}`;

    // ================= PDF =================
    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // 1. L'Logo f l'wjeh
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, { fit: [120, 60], align: 'center' });
        doc.moveDown();
      }

      // 2. Titre w Résumé
      doc.fontSize(20).fillColor('#E30613').text('NMN Communication', { align: 'center' });
      doc.fontSize(14).fillColor('#000000').text(reportData.title, { align: 'center' });
      doc.moveDown();
      doc.fontSize(11).fillColor('#333333').text(reportData.summary);
      doc.moveDown();

      // 3. Tableau (M3a Saut de Page)
      if (reportData.columns && reportData.data) {
        const tableTop = doc.y;
        const itemHeight = 25;
        
        // Header dyal l'Tableau
        reportData.columns.forEach((col, i) => {
          doc.fillColor('#E30613').text(col, 50 + (i * 150), tableTop, { width: 150, bold: true });
        });

        let y = tableTop + itemHeight;
        
        reportData.data.forEach(row => {
          // Ila wselna l'te7t dyal l'page, nzido page jdida
          if (y > doc.page.height - 80) {
            doc.addPage();
            y = 50; // Kanbdawo mn l'fo9 f l'page jdida
            
            // Kan3awdo nktbo l'Header f l'page jdida
            reportData.columns.forEach((col, i) => {
              doc.fillColor('#E30613').text(col, 50 + (i * 150), y, { width: 150, bold: true });
            });
            y += itemHeight;
          }

          // Kan7eto l'data dyal l'ligne
          row.forEach((cell, i) => {
            doc.fillColor('#000000').text(String(cell), 50 + (i * 150), y, { width: 150 });
          });
          y += itemHeight;
        });
      }

      doc.end();
      writeStream.on('finish', () => res.json({ success: true, url: fileUrl, name: fileName }));
      writeStream.on('error', (err) => res.status(500).json({ error: err.message }));

    // ================= WORD =================
    } else if (format === 'word') {
      // L'Logo f l'Word
      const logoImage = fs.existsSync(logoPath) ? new ImageRun({
          data: fs.readFileSync(logoPath),
          transformation: { width: 100, height: 50 },
      }) : null;

      const tableRows = [
        new TableRow({
          children: reportData.columns.map(col => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: col, bold: true, color: "E30613" })] })] }))
        }),
        ...reportData.data.map(row => new TableRow({
          children: row.map(cell => new TableCell({ children: [new Paragraph(String(cell))] }))
        }))
      ];

      const doc = new Document({
        sections: [{
          children: [
            ...(logoImage ? [new Paragraph({ children: [logoImage], alignment: AlignmentType.CENTER })] : []),
            new Paragraph({ text: "NMN Communication", heading: "Heading1", alignment: AlignmentType.CENTER }),
            new Paragraph({ text: reportData.title, heading: "Heading2", alignment: AlignmentType.CENTER }),
            new Paragraph({ text: reportData.summary }),
            new Paragraph({ text: "" }), 
            new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } })
          ],
        }],
      });
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(filePath, buffer);
      res.json({ success: true, url: fileUrl, name: fileName });

    // ================= EXCEL =================
    } else if (format === 'excel') {
      const wsData = [reportData.columns, ...reportData.data];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rapport");
      XLSX.writeFile(wb, filePath);
      res.json({ success: true, url: fileUrl, name: fileName });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;