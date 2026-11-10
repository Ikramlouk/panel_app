const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// 1. Jib l'Paramètres
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM app_settings WHERE id = 1');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Update l'Paramètres
router.put('/', auth, async (req, res) => {
  const { 
    detection_threshold, capture_frequency, 
    notif_app, notif_email, notif_sms, 
    theme, language, timezone 
  } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE app_settings 
       SET detection_threshold = $1, capture_frequency = $2, 
           notif_app = $3, notif_email = $4, notif_sms = $5, 
           theme = $6, language = $7, timezone = $8, updated_at = NOW()
       WHERE id = 1 
       RETURNING *`,
      [detection_threshold, capture_frequency, notif_app, notif_email, notif_sms, theme, language, timezone]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;