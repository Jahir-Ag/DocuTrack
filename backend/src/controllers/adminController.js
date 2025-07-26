const db = require('../../db');

exports.getAllRequests = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM requests ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  const { request_id, new_status } = req.body;
  try {
    const result = await db.query(
      'UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [new_status, request_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
