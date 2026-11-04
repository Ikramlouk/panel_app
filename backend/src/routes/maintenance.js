const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const auth = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// 1. Jib l'khedma kollha m3a smiyt l'technicien w l'panneau
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, p.reference, p.emplacement, u.name as technicien_name
      FROM maintenance_tasks m
      JOIN panneaux p ON m.panneau_id = p.id
      JOIN users u ON m.technicien_id = u.id
      ORDER BY m.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Zid khedma jdida (Admin kay3ti l'khedma l'technicien)
router.post('/', auth, async (req, res) => {
  const { panneau_id, technicien_id, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO maintenance_tasks (panneau_id, technicien_id, description) VALUES ($1, $2, $3) RETURNING *',
      [panneau_id, technicien_id, description]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Technicien kaymarki l'khedma bhal "Terminé" w kaysift tswira
router.put('/:id/complete', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Khass tswira dyal l\'khedma' });

    // Khezen l'tswira
    const fileName = `fixed_${Date.now()}_${req.file.originalname}`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    fs.writeFileSync(filePath, req.file.buffer);
    const imageUrl = `http://localhost:5000/uploads/${fileName}`;

    // Update l'khedma
    await pool.query(
      "UPDATE maintenance_tasks SET status = 'Terminé', proof_image = $1, completed_at = NOW() WHERE id = $2",
      [imageUrl, req.params.id]
    );
    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Modifier khedma (Jdid)
router.put('/:id', auth, async (req, res) => {
  const { panneau_id, technicien_id, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE maintenance_tasks SET panneau_id = $1, technicien_id = $2, description = $3 WHERE id = $4 RETURNING *',
      [panneau_id, technicien_id, description, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Tâche introuvable' });
    res.json(result.rows[0]);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// 5. Supprimer khedma (Jdid)
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_tasks WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Tâche introuvable' });
    res.json({ success: true });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;