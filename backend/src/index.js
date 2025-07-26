// ----------------------------
// ✅ BACKEND - index.js
// ----------------------------
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

// Load environment variables
dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Health check
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, serverTime: result.rows[0] });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ success: false, error: "Database connection error" });
  }
});

// GET /documents - Obtener todos los documentos
app.get("/documents", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM documents ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /documents error:", err);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

// POST /documents - Crear un documento
app.post("/documents", async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO documents (title, content) VALUES ($1, $2) RETURNING *",
      [title, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /documents error:", err);
    res.status(500).json({ error: "Failed to add document" });
  }
});

// DELETE /documents/:id - Eliminar un documento
app.delete("/documents/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM documents WHERE id = $1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /documents error:", err);
    res.status(500).json({ error: "Failed to delete document" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
