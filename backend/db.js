// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // si estás usando render.com o hosting externo
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
