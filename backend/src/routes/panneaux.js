const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

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

// 2. Jib l'akhir détections (l'Alertes)
router.get('/detections/all', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, p.reference, p.emplacement, p.status as panneau_status
      FROM detections d
      JOIN panneaux p ON d.panneau_id = p.id
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

module.exports = router;