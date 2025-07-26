// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db'); // Asegúrate de que esta conexión exista

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (email, password, role, created_at) VALUES ($1, $2, 'USER', NOW()) RETURNING *",
      [email, hashedPassword]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ error: "No se pudo registrar el usuario" });
  }
});

module.exports = router;
