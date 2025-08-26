const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Apply for a job
router.post('/', async (req, res) => {
  try {
    const { job_id, student_id, cover_letter } = req.body;

    if (!job_id || !student_id) {
      return res.status(400).json({ error: 'Job ID and Student ID are required' });
    }

    // Check duplicate
    const [existing] = await pool.execute(
      'SELECT id FROM job_applications WHERE job_id = ? AND student_id = ?',
      [job_id, student_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Already applied for this job' });
    }

    const [result] = await pool.execute(
      'INSERT INTO job_applications (job_id, student_id, cover_letter) VALUES (?, ?, ?)',
      [job_id, student_id, cover_letter]
    );

    res.status(201).json({ message: 'Application submitted', applicationId: result.insertId });
  } catch (error) {
    console.error('Error applying for job:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get applications for a student
router.get('/student/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId;
  const [rows] = await pool.execute(`
      SELECT ja.*, j.title as job_title, j.location as job_location, 
             o.organization_name, o.name as owner_name
      FROM job_applications ja
      JOIN jobs j ON ja.job_id = j.id
      JOIN owner_users o ON j.owner_id = o.id
      WHERE ja.student_id = ?
      ORDER BY ja.applied_at DESC
  `, [studentId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching student job applications:', error);
    res.status(500).json({ error: 'Failed to fetch job applications' });
  }
});

// Get applications for a job (owner view)
router.get('/job/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
  const [rows] = await pool.execute(`
      SELECT ja.*, s.name as student_name, s.email as student_email, 
             c.name as college_name
      FROM job_applications ja
      JOIN approved_students s ON ja.student_id = s.id
      LEFT JOIN colleges c ON s.college_id = c.id
      WHERE ja.job_id = ?
      ORDER BY ja.applied_at DESC
  `, [jobId]);

    res.json(rows);
  } catch (error) {
    console.error('Error fetching job applications:', error);
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
      'UPDATE job_applications SET status = ? WHERE id = ?',
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

// Approve job application (owner action)
router.post('/approve/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const [result] = await pool.execute(
      'UPDATE job_applications SET status = "accepted" WHERE id = ?',
      [applicationId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }
    res.json({ message: 'Application approved' });
  } catch (error) {
    console.error('Error approving job application:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

module.exports = router;
