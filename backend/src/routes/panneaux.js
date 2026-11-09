const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Configuration dyal Multer bach n9belo l'tsawir
const upload = multer({ storage: multer.memoryStorage() });

// 1. Jib l'liste dyal l'panneaux m3a akhir tswira l kol wa7d
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
        (SELECT image_url FROM detections d WHERE d.panneau_id = p.id ORDER BY detected_at DESC LIMIT 1) as latest_image,
        (SELECT detected_at FROM detections d WHERE d.panneau_id = p.id ORDER BY detected_at DESC LIMIT 1) as latest_time
      FROM panneaux p 
      ORDER BY p.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Jib l'akhir détections (l'Alertes) m3a smiyt li 7elha w li zadha (LEFT JOIN)
router.get('/detections/all', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, 
             p.reference, 
             p.emplacement, 
             p.status as panneau_status, 
             u.name as acknowledged_by_name,
             creator.name as created_by_name
      FROM detections d
      JOIN panneaux p ON d.panneau_id = p.id
      LEFT JOIN users u ON d.acknowledged_by = u.id
      LEFT JOIN users creator ON d.created_by = creator.id
      ORDER BY d.detected_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Jib panneau wa7d b l'ID
router.get('/:id', auth, async (req, res) => {
  try {
    const p = await pool.query('SELECT * FROM panneaux WHERE id=$1', [req.params.id]);
    const det = await pool.query(
      'SELECT * FROM detections WHERE panneau_id=$1 ORDER BY detected_at DESC LIMIT 1',
      [req.params.id]
    );
    res.json({ panneau: p.rows[0], detection: det.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Route bach n'acquittiw l'alerte (M3a l'Traçabilité w Update dyal l'Panneau)
router.put('/detections/:id/acquitter', auth, async (req, res) => {
  try {
    const detectionId = req.params.id;

    // 1. Acquitter l'alerte (is_acknowledged = TRUE)
    const result = await pool.query(
      'UPDATE detections SET is_acknowledged = TRUE, acknowledged_by = $1, acknowledged_at = NOW() WHERE id = $2 RETURNING panneau_id',
      [req.user.id, detectionId]
    );

    if (result.rowCount === 0) return res.status(404).json({ error: 'Alerte introuvable' });
    const panneauId = result.rows[0].panneau_id;

    // 2. Chof wach l'panneau mazal 3ndo alertes khrin li MA T7ELLAWCH
    const checkAnomalies = await pool.query(
      "SELECT COUNT(*) FROM detections WHERE panneau_id = $1 AND is_acknowledged = FALSE AND anomalie_type IS NOT NULL",
      [panneauId]
    );

    // 3. Ila ma b9ach 3ndo 7ta alerte, rje3 l'statut dyal l'panneau l 'ok'
    if (parseInt(checkAnomalies.rows[0].count) === 0) {
      await pool.query("UPDATE panneaux SET status = 'ok' WHERE id = $1", [panneauId]);
    }

    res.json({ success: true, message: "Alerte acquittée avec succès" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 5. Route bach nzido alerte b l'yed (Manuel) m3a Upload dyal l'tswira
router.post('/detections/manual', auth, upload.single('image'), async (req, res) => {
  const { panneau_id, anomalie_type, description } = req.body;
  
  try {
    let imageUrl = null;

    // Ila l'user uploada tswira, kansejjlo f dossier uploads
    if (req.file) {
      const fileName = `manual_${Date.now()}_${req.file.originalname}`;
      const filePath = path.join(__dirname, '../../uploads', fileName);
      fs.writeFileSync(filePath, req.file.buffer);
      imageUrl = `http://localhost:5000/uploads/${fileName}`;
    }

    // Nzido l'detection f l'base (source = 'MANUAL')
    const result = await pool.query(
      'INSERT INTO detections (panneau_id, image_url, anomalie_type, description, confidence, detected_at, created_by, source) VALUES ($1, $2, $3, $4, 1.0, NOW(), $5, $6) RETURNING *',
      [panneau_id, imageUrl, anomalie_type, description, req.user.id, 'MANUAL']
    );

    // Nbedelo l'statut dyal l'panneau l anomalie
    await pool.query("UPDATE panneaux SET status = 'anomalie' WHERE id = $1", [panneau_id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;