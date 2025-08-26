const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// Get all jobs
router.get('/jobs', async (req, res) => {
  try {
    const { search, location, jobType } = req.query;
    
    let query = `
      SELECT j.*, o.name as owner_name, o.organization_name 
      FROM jobs j 
      LEFT JOIN owner_users o ON j.owner_id = o.id 
      WHERE j.status = 'active'
    `;
    let params = [];
    
    if (search) {
      query += ' AND (j.title LIKE ? OR j.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (location) {
      query += ' AND j.location LIKE ?';
      params.push(`%${location}%`);
    }
    
    if (jobType) {
      query += ' AND j.job_type = ?';
      params.push(jobType);
    }
    
    query += ' ORDER BY j.created_at DESC';
    
    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Get jobs by owner
router.get('/jobs/owner/:ownerId', async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    
    const [rows] = await pool.execute(
      'SELECT * FROM jobs WHERE owner_id = ? ORDER BY created_at DESC',
      [ownerId]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching owner jobs:', error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Create new job
router.post('/jobs', async (req, res) => {
  try {
    const {
      owner_id,
      title,
      description,
      requirements,
      location,
      salary_range,
      job_type
    } = req.body;
    
    if (!owner_id || !title) {
      return res.status(400).json({ error: 'Owner ID and title are required' });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO jobs (owner_id, title, description, requirements, location, salary_range, job_type, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `, [owner_id, title, description || '', requirements || '', location || '', salary_range || '', job_type || 'part-time']);
    
    res.status(201).json({
      message: 'Job created successfully',
      jobId: result.insertId
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Failed to create job' });
  }
});

// Create job application
router.post('/job-applications', async (req, res) => {
  try {
    const { job_id, student_id, cover_letter } = req.body;
    
    if (!job_id || !student_id) {
      return res.status(400).json({ error: 'Job ID and Student ID are required' });
    }
    
    // Check if student already applied
    const [existing] = await pool.execute(
      'SELECT id FROM job_applications WHERE job_id = ? AND student_id = ?',
      [job_id, student_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO job_applications (job_id, student_id, cover_letter, status) VALUES (?, ?, ?, "pending")',
      [job_id, student_id, cover_letter || '']
    );
    
    res.status(201).json({ 
      message: 'Application submitted successfully', 
      id: result.insertId 
    });
  } catch (error) {
    console.error('Error creating job application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// Get student's job applications
router.get('/job-applications/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT ja.*, j.title as job_title, o.organization_name 
      FROM job_applications ja 
      JOIN jobs j ON ja.job_id = j.id 
      LEFT JOIN owner_users o ON j.owner_id = o.id 
      WHERE ja.student_id = ? 
      ORDER BY ja.applied_at DESC
    `, [studentId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get applications for a job
router.get('/job-applications/job/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const [rows] = await pool.execute(`
      SELECT ja.id, ja.cover_letter, ja.status, ja.applied_at,
             s.name AS student_name, s.email AS student_email,
             c.name AS college_name
      FROM job_applications ja
      JOIN approved_students s ON ja.student_id = s.id
      LEFT JOIN colleges c ON s.college_id = c.id
      WHERE ja.job_id = ?
      ORDER BY ja.applied_at DESC
    `, [jobId]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching applications for job:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

module.exports = router;
