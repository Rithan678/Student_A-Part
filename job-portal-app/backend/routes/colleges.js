const express = require('express');
const { pool } = require('../config/database'); // use pool directly

const router = express.Router();

// Get all colleges
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let query = 'SELECT id, name, location FROM colleges';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

// Add new college (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, location } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'College name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO colleges (name, location) VALUES (?, ?)',
      [name, location || null]
    );

    res.status(201).json({
      message: 'College added successfully',
      collegeId: result.insertId
    });
  } catch (error) {
    console.error('Error adding college:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'College already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add college' });
    }
  }
});

module.exports = router;
