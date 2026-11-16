const pool = require('../config/db');

const logAction = async (req, action, entity, entityId, details) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.name : 'Système';

    await pool.query(
      `INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, details) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, userName, action, entity, entityId, details]
    );
  } catch (err) {
    console.error("Erreur dyal l'Audit Log:", err.message);
  }
};

module.exports = logAction;