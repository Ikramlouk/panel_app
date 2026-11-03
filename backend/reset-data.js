const path = require('path');
const XLSX = require('xlsx');
const pool = require('./src/config/db');

// L'Chemin dyal l'fichier Excel
const filePath = path.join(__dirname, 'data', 'locations.xlsx');

async function resetDatabase() {
  try {
    console.log("🧹 Nmse7o l'data l'9dima...");
    // 1. Nmse7o l'data l'9dima (l'détections 9bel l'panneaux bach ma ykounch conflit dyal foreign key)
    await pool.query('DELETE FROM detections');
    await pool.query('DELETE FROM panneaux');
    console.log("✅ L'base de données n9at.");

    // 2. Nqraw l'fichier Excel
    console.log("⏳ Kanqraw l'Excel...");
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let count = 0;

    // 3. Ndiro loop 3la kol ligne f l'Excel
    for (const row of data) {
      const ref = row['Internal Reference']; // Smiyt l'colonne
      const coordsStr = row['Address']; // L'coordonnées "35.56, -5.36"
      const city = row['City'] || 'Inconnu'; // L'ville

      if (!ref || !coordsStr) continue;

      // Fark l'Latitude w l'Longitude
      const [lat, lng] = coordsStr.split(',').map(c => parseFloat(c.trim()));

      if (isNaN(lat) || isNaN(lng)) continue;

      // 4. Zid l'Panneau l'jdid f l'base
      await pool.query(
        'INSERT INTO panneaux (reference, emplacement, type, status, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6)',
        [ref, city, 'Panneau LED', 'ok', lat, lng] // Dimaaa f l'awal kaybda OK
      );
      count++;
    }

    console.log(`🎉 Salat! ${count} panneaux tzado b l'coordonnées l'7a9i9iyin.`);
    console.log("💡 Daba l'base wellat fiha ghir l'data l'7a9i9iya.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur:", err);
    process.exit(1);
  }
}

resetDatabase();