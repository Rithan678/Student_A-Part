const express = require('express');
const { pool } = require('../config/database'); // ✅ Fixed: Use pool instead of db

const router = express.Router();

// Get all events
router.get('/events', async (req, res) => {
  try {
    const { search, location } = req.query;
    
    let query = `
      SELECT e.*, o.name as owner_name, o.organization_name 
      FROM events e 
      LEFT JOIN owner_users o ON e.owner_id = o.id 
      WHERE e.status = 'active'
    `;
    let params = [];
    
    if (search) {
      query += ' AND (e.title LIKE ? OR e.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (location) {
      query += ' AND e.location LIKE ?';
      params.push(`%${location}%`);
    }
    
    query += ' ORDER BY e.event_date ASC';
    
    const [rows] = await pool.execute(query, params); // ✅ Fixed: Use pool
    res.json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get events by owner
router.get('/events/owner/:ownerId', async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    
    const [rows] = await pool.execute( // ✅ Fixed: Use pool
      'SELECT * FROM events WHERE owner_id = ? ORDER BY event_date DESC',
      [ownerId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching owner events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Create new event
router.post('/events', async (req, res) => {
  try {
    const {
      owner_id,
      title,
      description,
      event_date,
      location,
      max_participants,
      registration_deadline
    } = req.body;
    
    if (!owner_id || !title || !description || !event_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [result] = await pool.execute(` // ✅ Fixed: Use pool
      INSERT INTO events (owner_id, title, description, event_date, location, max_participants, registration_deadline) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [owner_id, title, description, event_date, location, max_participants, registration_deadline]);
    
    res.status(201).json({
      message: 'Event created successfully',
      eventId: result.insertId
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ✅ NEW: Create event application (for Student Dashboard)
router.post('/event-applications', async (req, res) => {
  try {
    const { event_id, student_id, message } = req.body;
    
    if (!event_id || !student_id) {
      return res.status(400).json({ error: 'Event ID and Student ID are required' });
    }
    
    // Check if student already applied
    const [existing] = await pool.execute(
      'SELECT id FROM event_applications WHERE event_id = ? AND student_id = ?',
      [event_id, student_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already applied for this event' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO event_applications (event_id, student_id, message, status) VALUES (?, ?, ?, "pending")',
      [event_id, student_id, message || '']
    );
    
    res.status(201).json({ 
      message: 'Event registration submitted successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating event application:', error);
    res.status(500).json({ error: 'Failed to register for event' });
  }
});

// ✅ NEW: Get student's event applications (for Student Dashboard)
router.get('/event-applications/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT ea.*, e.title as event_title, e.event_date, o.organization_name 
      FROM event_applications ea 
      JOIN events e ON ea.event_id = e.id 
      LEFT JOIN owner_users o ON e.owner_id = o.id 
      WHERE ea.student_id = ? 
      ORDER BY ea.applied_at DESC
    `, [studentId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching event applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// NEW: Get event applications for an event (for Owner Dashboard)
router.get('/event-applications/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const [rows] = await pool.execute(`
      SELECT ea.id, ea.message, ea.status, ea.applied_at,
             s.name AS student_name, s.email AS student_email,
             c.name AS college_name
      FROM event_applications ea
      JOIN approved_students s ON ea.student_id = s.id
      LEFT JOIN colleges c ON s.college_id = c.id
      WHERE ea.event_id = ?
      ORDER BY ea.applied_at DESC
    `, [eventId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching registrations for event:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Update event
router.put('/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const {
      title,
      description,
      event_date,
      location,
      max_participants,
      registration_deadline,
      status
    } = req.body;
    
    const [result] = await pool.execute(` // ✅ Fixed: Use pool
      UPDATE events 
      SET title = ?, description = ?, event_date = ?, location = ?, 
          max_participants = ?, registration_deadline = ?, status = ?
      WHERE id = ?
    `, [title, description, event_date, location, max_participants, registration_deadline, status, eventId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event
router.delete('/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    const [result] = await pool.execute('DELETE FROM events WHERE id = ?', [eventId]); // ✅ Fixed: Use pool
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
