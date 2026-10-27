const fs = require('fs');
const path = require('path');
const pool = require('./src/config/db');

const resultsFile = path.join(__dirname, '../yolo-service/results.json');

// L'blayes w l'coordonnées dyalhom
const cities = [
  { name: 'Fès', lat: 34.033, lng: -5.000 },
  { name: 'Tanger', lat: 35.759, lng: -5.834 },
  { name: 'Nador', lat: 35.168, lng: -2.928 },
  { name: 'Oujda', lat: 34.686, lng: -1.911 },
  { name: 'Tétouan', lat: 35.578, lng: -5.368 },
  { name: 'Casablanca', lat: 33.573, lng: -7.589 },
];

async function importData() {
  try {
    const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
    
    // Nmse7o l'data l'9dima
    await pool.query('DELETE FROM detections');
    await pool.query('DELETE FROM panneaux');
    console.log('Nettoyage: L\'data l\'9dima tmse7at.');

    let count = 0;
    for (const res of results) {
      const imageUrl = `http://localhost:5000/uploads/snapshots3/${res.folder}/${res.image}`;
      
      // Nkhtaro blassa 3achwa'iya mn l'cities
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      
      // Zid l'Panneau m3a l'coordonnées
      const pRes = await pool.query(
        'INSERT INTO panneaux (reference, emplacement, type, status, latitude, longitude) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [res.folder, randomCity.name, 'Panneau LED', res.status, randomCity.lat, randomCity.lng]
      );
      const panneauId = pRes.rows[0].id;

      // Zid l'Detection
      await pool.query(
        'INSERT INTO detections (panneau_id, image_url, anomalie_type, confidence, detected_at) VALUES ($1, $2, $3, $4, NOW())',
        [panneauId, imageUrl, res.class, res.confidence]
      );

      count++;
    }
    console.log(`Salat! ${count} panneaux w detections tzadou f l'base de données.`);
    process.exit(0);
  } catch (err) {
    console.error("Erreur:", err);
    process.exit(1);
  }
}

importData();