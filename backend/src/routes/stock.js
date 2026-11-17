const router = require('express').Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const logAction = require('../utils/audit');

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stock_pieces ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  const { reference, name, category, stock_quantity, min_quantity, price, location } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO stock_pieces (reference, name, category, stock_quantity, min_quantity, price, location) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [reference, name, category, parseInt(stock_quantity) || 0, parseInt(min_quantity) || 0, parseFloat(price) || 0, location]
    );
    await logAction(req, 'CREATE', 'Stock', result.rows[0].id, `Nouvelle pièce ajoutée: ${name}`);
    res.json(result.rows[0]);
  } catch (err) { 
    console.error("ERREUR INSERT STOCK:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

router.put('/:id', auth, async (req, res) => {
  const { name, category, stock_quantity, min_quantity, price, location } = req.body;
  try {
    const result = await pool.query(
      `UPDATE stock_pieces 
       SET name = $1, category = $2, stock_quantity = $3, min_quantity = $4, price = $5, location = $6
       WHERE id = $7 RETURNING *`,
      [name, category, stock_quantity, min_quantity, price, location, req.params.id]
    );
    await logAction(req, 'UPDATE', 'Stock', req.params.id, `Mise à jour de la pièce: ${name}`);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM stock_pieces WHERE id = $1', [req.params.id]);
    await logAction(req, 'DELETE', 'Stock', req.params.id, `Suppression d'une pièce`);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;