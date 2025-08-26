const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Apply for event
router.post('/', async (req, res) => {
  try {
    const { event_id, student_id, cover_letter } = req.body;

    if (!event_id || !student_id) {
      return res.status(400).json({ error: 'Event ID and Student ID are required' });
    }

    // Check if already applied
    const [existing] = await pool.execute(
      'SELECT id FROM event_applications WHERE event_id = ? AND student_id = ?',
      [event_id, student_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already applied for this event' });
    }

    // Note: event_applications table uses `message` column for the student's message
    const [result] = await pool.execute(
      'INSERT INTO event_applications (event_id, student_id, message) VALUES (?, ?, ?)',
      [event_id, student_id, cover_letter || null]
    );

    res.status(201).json({
      message: 'Event application submitted successfully',
      applicationId: result.insertId
    });
  } catch (error) {
    console.error('Error applying for event:', error);
    res.status(500).json({ error: 'Failed to submit event application' });
  }
});

// Get applications for a student (events)
router.get('/student/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;

  const [rows] = await pool.execute(`
      SELECT ea.*, e.title as event_title, e.location as event_location, 
             o.organization_name, o.name as owner_name
      FROM event_applications ea
      JOIN events e ON ea.event_id = e.id
      JOIN owner_users o ON e.owner_id = o.id
      WHERE ea.student_id = ?
      ORDER BY ea.applied_at DESC
    `, [studentId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching student event applications:', error);
    res.status(500).json({ error: 'Failed to fetch event applications' });
  }
});

// Get applications for an event (owner view)
router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;

  const [rows] = await pool.execute(`
      SELECT ea.*, s.name as student_name, s.email as student_email, 
             c.name as college_name
      FROM event_applications ea
      JOIN approved_students s ON ea.student_id = s.id
      LEFT JOIN colleges c ON s.college_id = c.id
      WHERE ea.event_id = ?
      ORDER BY ea.applied_at DESC
    `, [eventId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching event applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status
router.put('/:id/status', async (req, res) => {
  try {
    const applicationId = req.params.id;
    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const [result] = await pool.execute(
      'UPDATE event_applications SET status = ? WHERE id = ?',
      [status, applicationId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Approve event registration (owner action)
router.post('/approve/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const [result] = await pool.execute(
      'UPDATE event_applications SET status = "accepted" WHERE id = ?',
      [applicationId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Event registration approved' });
  } catch (error) {
    console.error('Error approving event registration:', error);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

module.exports = router;
