const db = require('../db');

exports.createRequest = async (req, res) => {
  const { user_id, full_name, document_type, document_url } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO requests (user_id, full_name, document_type, document_url, status, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
      [user_id, full_name, document_type, document_url, 'Recibido']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserRequests = async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await db.query('SELECT * FROM requests WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
