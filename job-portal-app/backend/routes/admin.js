const express = require('express');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Optional S3 support (mirror of auth.js behavior)
let s3Client = null;
let S3_BUCKET = process.env.S3_BUCKET || null;
if (process.env.S3_BUCKET && process.env.S3_REGION && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
  const { S3Client } = require('@aws-sdk/client-s3');
  s3Client = new S3Client({
    region: process.env.S3_REGION,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    }
  });
  S3_BUCKET = process.env.S3_BUCKET;
}

const router = express.Router();

// DEBUG: Check what we actually imported
console.log('🔍 DEBUG - Pool object:', typeof pool);
console.log('🔍 DEBUG - Pool methods:', pool ? Object.getOwnPropertyNames(pool) : 'undefined');

// Get pending students - FIXED
router.get('/pending-students', async (req, res) => {
  try {
    console.log('📋 Attempting to fetch pending students...');
    
    const [rows] = await pool.execute(`
      SELECT u.*, c.name as college_name 
      FROM users u 
      LEFT JOIN colleges c ON u.college_id = c.id 
      WHERE u.verification_status = 'pending'
      ORDER BY u.created_at DESC
    `);
    
    console.log('✅ Successfully fetched', rows.length, 'pending students');
    res.json(rows);
  } catch (error) {
    console.error('❌ Error fetching pending students:', error);
    res.status(500).json({ error: 'Failed to fetch pending students' });
  }
});

// Approve student
router.post('/approve-student/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const [studentRows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND verification_status = "pending"',
      [studentId]
    );
    
    if (studentRows.length === 0) {
      return res.status(404).json({ error: 'Pending student not found' });
    }
    
    const student = studentRows[0];
    
    await pool.execute(`
      INSERT INTO approved_students 
      (name, email, password, date_of_birth, college_id, student_college_id, pdf_path) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      student.name,
      student.email,
      student.password,
      student.date_of_birth,
      student.college_id,
      student.student_college_id,
      student.pdf_path
    ]);
    
    await pool.execute('DELETE FROM users WHERE id = ?', [studentId]);
    
    res.json({ message: 'Student approved successfully' });
  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({ error: 'Failed to approve student' });
  }
});

// Reject student
router.post('/reject-student/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    
    const [studentRows] = await pool.execute(
      'SELECT pdf_path FROM users WHERE id = ? AND verification_status = "pending"',
      [studentId]
    );
    
    if (studentRows.length === 0) {
      return res.status(404).json({ error: 'Pending student not found' });
    }
    
    if (studentRows[0].pdf_path) {
      const stored = studentRows[0].pdf_path;
      if (s3Client && stored.startsWith('college-ids/')) {
        try {
          const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
          await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: stored }));
        } catch (err) {
          console.error('❌ Failed to delete S3 object:', err);
        }
      } else {
        const pdfPath = path.join(__dirname, '../uploads', stored);
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
      }
    }
    
    await pool.execute(
      'UPDATE users SET verification_status = "rejected" WHERE id = ?',
      [studentId]
    );
    
    res.json({ message: 'Student rejected successfully' });
  } catch (error) {
    console.error('Error rejecting student:', error);
    res.status(500).json({ error: 'Failed to reject student' });
  }
});

// Serve PDF files
router.get('/pdf/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    // If S3 configured and filename looks like an S3 key, generate signed URL
    if (s3Client && filename.startsWith('college-ids/')) {
      try {
        const { GetObjectCommand } = require('@aws-sdk/client-s3');
        const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
        const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: filename });
        const url = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 }); // 5 min
        return res.json({ url });
      } catch (err) {
        console.error('❌ Failed to generate signed URL:', err);
        return res.status(500).json({ error: 'Failed to generate file URL' });
      }
    }

    const filePath = path.join(__dirname, '../uploads', filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving PDF:', error);
    res.status(500).json({ error: 'Failed to serve file' });
  }
});

module.exports = router;
