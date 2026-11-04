const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Jib l'techniciens
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, phone FROM users WHERE role = 'technicien'");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Zid technicien
router.post('/', auth, async (req, res) => {
  const { name, email, phone, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, 'technicien') RETURNING id, name, email, phone",
      [name, email, hash, phone]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: 'Email deja msta3mel' }); }
});

// Modifier technicien
router.put('/:id', auth, async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING id, name, email, phone",
      [name, email, phone, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: 'Mochkil f l\'modification' }); }
});

// Supprimer technicien
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;