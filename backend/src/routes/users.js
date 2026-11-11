const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const auth = require('../middleware/auth');

// ==========================================
// 1. Routes dyal l'Profil (L'FO9 MOHIM!)
// ==========================================

// Jib l'Profil
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Beddel l'Profil (Smiya w Email)
router.put('/me', auth, async (req, res) => {
  const { name, email } = req.body;
  try {
    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
    if (emailCheck.rowCount > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre utilisateur' });
    }
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email, role',
      [name, email, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("ERREUR BACKEND:", err.message); 
    res.status(500).json({ error: 'Erreur serveur lors de la modification' });
  }
});

// Beddel l'Mot de passe
router.put('/me/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (user.rowCount === 0) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password);
    if (!validPassword) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.user.id]);
    
    res.json({ success: true, message: 'Mot de passe mis à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ==========================================
// 2. Routes dyal l'Users
// ==========================================

// Jib l'users KOLLHOM (Admin + Techniciens)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, email, phone, role FROM users ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Zid user jdid (Mn l'Modal)
router.post('/', auth, async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password || '123456', 10);
    const userRole = role || 'technicien'; // Par défaut technicien
    const result = await pool.query(
      "INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role",
      [name, email, hash, phone, userRole]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: 'Email déja msta3mel' }); }
});

// ==========================================
// 3. Routes dyal l'Permissions w l'Actions
// ==========================================

// Jib les permissions dyal chi user
router.get('/:id/permissions', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT permissions FROM users WHERE id = $1', [req.params.id]);
    res.json(result.rows[0]?.permissions || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update les permissions dyal chi user
router.put('/:id/permissions', auth, async (req, res) => {
  const { permissions } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET permissions = $1 WHERE id = $2 RETURNING permissions',
      [permissions, req.params.id]
    );
    res.json(result.rows[0].permissions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Réinitialiser l'mot de passe dyal chi user
router.put('/:id/reset-password', auth, async (req, res) => {
  try {
    const defaultPassword = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, req.params.id]);
    
    res.json({ success: true, message: `Mot de passe réinitialisé à: ${defaultPassword}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Modifier user (Smiya, Email, Phone, Role)
router.put('/:id', auth, async (req, res) => {
  const { name, email, phone, role } = req.body;
  try {
    const result = await pool.query(
      "UPDATE users SET name = $1, email = $2, phone = $3, role = $4 WHERE id = $5 RETURNING id, name, email, phone, role",
      [name, email, phone, role, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(400).json({ error: 'Mochkil f l\'modification' }); }
});

// Supprimer user
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;