const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database Initialization
const db = new sqlite3.Database('./notes.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite:', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.run(
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT DEFAULT 'Others',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );
  }
});

// API Routes

// 1. Create a New Note
app.post('/notes', (req, res) => {
  const { title, description, category = 'Others' } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and Description are required.' });
  }

  const query = `INSERT INTO notes (title, description, category) VALUES (?, ?, ?)`;
  db.run(query, [title, description, category], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, description, category });
  });
});

// 2. Fetch All Notes with Filters
app.get('/notes', (req, res) => {
  const { category, search } = req.query;
  let query = `SELECT * FROM notes WHERE 1=1`;
  let params = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }
  if (search) {
    query += ` AND title LIKE ?`;
    params.push(`%${search}%`);
  }

  query += ` ORDER BY created_at DESC`;

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 3. Update a Note
app.put('/notes/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, category } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and Description are required.' });
  }

  const query = `UPDATE notes SET title = ?, description = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
  db.run(query, [title, description, category, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Note not found.' });
    res.json({ id, title, description, category });
  });
});

// 4. Delete a Note
app.delete('/notes/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM notes WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Note not found.' });
    res.status(204).send();
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
