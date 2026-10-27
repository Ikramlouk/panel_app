const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

const uploadsDir = path.join(__dirname, 'uploads', 'snapshots3');

async function seed() {
  try {
    const folders = fs.readdirSync(uploadsDir);
    let count = 0;

    for (const folder of folders) {
      const folderPath = path.join(uploadsDir, folder);
      if (fs.lstatSync(folderPath).isDirectory()) {
        const files = fs.readdirSync(folderPath);
        // Kayqelleb 3la awal tswira f l'dossier
        const imageFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.jpeg'));

        if (imageFile) {
          const imageUrl = `http://localhost:5000/uploads/snapshots3/${folder}/${imageFile}`;
          
          // Ghan7eto panneau_id random bin 1 w 5 l'test
          const panneauId = Math.floor(Math.random() * 5) + 1; 
          const confidence = (Math.random() * (0.99 - 0.70) + 0.70).toFixed(2);
          
          await pool.query(
            'INSERT INTO detections (panneau_id, image_url, anomalie_type, confidence, detected_at) VALUES ($1, $2, $3, $4, NOW())',
            [panneauId, imageUrl, 'Anomalie Détectée', confidence]
          );
          console.log(`✅ Tswira mzada: ${folder}/${imageFile}`);
          count++;
        }
      }
    }
    console.log(`🎉 Salat l'automatisation! Total: ${count} tswira tzadou.`);
    process.exit(0);
  } catch (err) {
    console.error("Erreur:", err);
    process.exit(1);
  }
}

seed();