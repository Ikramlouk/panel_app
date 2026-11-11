const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// 1. Jib l'Tasks kollhom m3a l'infos dyal l'panneau w l'technicien
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             p.reference as panneau_ref, p.emplacement as panneau_loc,
             u.name as technicien_name
      FROM maintenance_tasks t
      LEFT JOIN panneaux p ON t.panneau_id = p.id
      LEFT JOIN users u ON t.technicien_id = u.id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Zid Task jdida
router.post('/', auth, async (req, res) => {
  const { panneau_id, technicien_id, description, priority, due_date } = req.body;
  
  try {
    if (!panneau_id) return res.status(400).json({ error: 'Le panneau est obligatoire' });

    const result = await pool.query(
      `INSERT INTO maintenance_tasks (panneau_id, technicien_id, description, priority, due_date, status) 
       VALUES ($1, $2, $3, $4, $5, 'À planifier') RETURNING *`,
      [panneau_id, technicien_id || null, description || 'Aucune description', priority || 'Moyenne', due_date || null]
    );
    res.json(result.rows[0]);
  } catch (err) { 
    console.error("ERREUR INSERT TASK:", err.message); 
    res.status(500).json({ error: err.message }); 
  }
});

// 3. Update Task (Status, Technicien, Notes, w completed_at)
router.put('/:id', auth, async (req, res) => {
  const { status, technicien_id, notes } = req.body;
  try {
    // Ila status wlla 'Terminées', nsejjlo l'we9t f completed_at
    const completedAtQuery = status === 'Terminées' ? 'NOW()' : 'completed_at';
    
    const result = await pool.query(
      `UPDATE maintenance_tasks 
       SET status = COALESCE($1, status), 
           technicien_id = COALESCE($2, technicien_id), 
           notes = COALESCE($3, notes),
           completed_at = ${completedAtQuery}
       WHERE id = $4 RETURNING *`,
      [status, technicien_id, notes, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Supprimer Task
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM maintenance_tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;