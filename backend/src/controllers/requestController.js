const db = require('../../db');

exports.createRequest = async (req, res) => {
  const { user_id, type, data, file_url } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO requests (user_id, type, status, data, file_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [user_id, type, 'recibido', data, file_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserRequests = async (req, res) => {
  const userId = req.params.userId;
  try {
    const result = await db.query('SELECT * FROM requests WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
