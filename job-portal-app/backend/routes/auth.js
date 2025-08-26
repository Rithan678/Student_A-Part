const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');

// Optional S3 support
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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `college-id-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Student and Owner Signup
router.post('/signup', upload.single('collegeIdPdf'), async (req, res) => {
  try {
    console.log('📝 Signup request received:', req.body);
    console.log('📎 File uploaded:', req.file);

    const { name, email, password, userType, dateOfBirth, collegeId, studentCollegeId, organizationName, location } = req.body;

    if (!name || !email || !password || !userType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (userType === 'student') {
      // ✅ STUDENT REGISTRATION: Goes to 'users' table with 'pending' status
      if (!dateOfBirth || !collegeId || !studentCollegeId || !req.file) {
        return res.status(400).json({ error: 'Missing required student fields or college ID PDF' });
      }

      // If S3 is configured, upload the file to S3 and remove local file
      let storedPath = req.file.filename; // default: local filename
      if (s3Client) {
        try {
          const { PutObjectCommand } = require('@aws-sdk/client-s3');
          const fileStream = fs.createReadStream(req.file.path);
          const key = `college-ids/${req.file.filename}`;
          await s3Client.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: fileStream,
            ContentType: 'application/pdf'
          }));
          // remove local file after upload
          try { fs.unlinkSync(req.file.path); } catch(e) { /* ignore */ }
          storedPath = key; // store S3 key in DB
          console.log('✅ Uploaded college ID to S3 as', key);
        } catch (s3Err) {
          console.error('❌ S3 upload failed, falling back to local file:', s3Err);
          // keep storedPath as local filename
        }
      }

      // Check if email already exists in ANY table
      const [existingUser] = await pool.execute(
        'SELECT id FROM users WHERE email = ? UNION SELECT id FROM approved_students WHERE email = ? UNION SELECT id FROM owner_users WHERE email = ?',
        [email, email, email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      // Insert student into 'users' table with 'pending' status
      const [result] = await pool.execute(
        `INSERT INTO users (name, email, password, date_of_birth, college_id, student_college_id, pdf_path, verification_status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [name, email, hashedPassword, dateOfBirth, collegeId, studentCollegeId, storedPath]
      );

      console.log('✅ Student registered in users table (pending approval):', result.insertId);
      res.status(201).json({ 
        message: 'Student registration submitted. Please wait for admin approval.',
        id: result.insertId
      });

    } else if (userType === 'owner') {
      // ✅ OWNER REGISTRATION: Goes directly to 'owner_users' table
      if (!organizationName) {
        return res.status(400).json({ error: 'Organization name is required for owners' });
      }

      // Check if email already exists in ANY table
      const [existingOwner] = await pool.execute(
        'SELECT id FROM owner_users WHERE email = ? UNION SELECT id FROM approved_students WHERE email = ? UNION SELECT id FROM users WHERE email = ?',
        [email, email, email]
      );

      if (existingOwner.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Insert owner directly into 'owner_users' table
      const [result] = await pool.execute(
        `INSERT INTO owner_users (name, email, password, organization_name, location) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, hashedPassword, organizationName, location || null]
      );

      console.log('✅ Owner registered in owner_users table (can login immediately):', result.insertId);
      res.status(201).json({ 
        message: 'Owner registration successful. You can now log in immediately!',
        id: result.insertId
      });

    } else {
      res.status(400).json({ error: 'Invalid user type' });
    }
  } catch (error) {
    console.error('❌ Signup error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Login - ENFORCES APPROVAL WORKFLOW
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login request received:', req.body);
    
    const { email, password, userType } = req.body;

    if (!email || !password || !userType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let user = null;

    if (userType === 'admin') {
      // ✅ ADMIN LOGIN: Simplified hardcoded authentication
      console.log('👑 Admin login attempt for:', email);
      
      if (email === 'admin@jobportal.com' && password === 'admin123') {
        console.log('✅ Admin login successful');
        return res.json({
          message: 'Login successful',
          user: { 
            id: 1, 
            email: 'admin@jobportal.com', 
            name: 'System Admin',
            userType: 'admin' 
          }
        });
      } else {
        console.log('❌ Invalid admin credentials');
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }
      
    } else if (userType === 'student') {
      // ✅ STUDENT LOGIN: ONLY from 'approved_students' table
      console.log('🎓 Student login attempt for:', email);
      
      const [rows] = await pool.execute(
        'SELECT * FROM approved_students WHERE email = ?',
        [email]
      );
      user = rows[0];
      
      if (!user) {
        // Check if student exists in users table but not yet approved
        const [pendingRows] = await pool.execute(
          'SELECT verification_status FROM users WHERE email = ?',
          [email]
        );
        
        if (pendingRows.length > 0) {
          const status = pendingRows[0].verification_status;
          if (status === 'pending') {
            console.log('🕒 Student pending approval:', email);
            return res.status(401).json({ 
              error: 'Your account is pending admin approval. Please wait for approval before logging in.' 
            });
          } else if (status === 'rejected') {
            console.log('❌ Student rejected:', email);
            return res.status(401).json({ 
              error: 'Your account has been rejected by admin. Please contact support.' 
            });
          }
        }
        
        console.log('❌ Student not found or not approved:', email);
        return res.status(401).json({ 
          error: 'Student account not found. Please register first or wait for admin approval.' 
        });
      }
      
    } else if (userType === 'owner') {
      // ✅ OWNER LOGIN: ONLY from 'owner_users' table
      console.log('🏢 Owner login attempt for:', email);
      
      const [rows] = await pool.execute(
        'SELECT * FROM owner_users WHERE email = ?',
        [email]
      );
      user = rows[0];
      
      if (!user) {
        console.log('❌ Owner not found:', email);
        return res.status(401).json({ error: 'Owner account not found' });
      }
      
    } else {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Verify password for student/owner
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Password mismatch for:', email, 'as', userType);
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('✅ Login successful for:', email, 'as', userType);
    res.json({
      message: 'Login successful',
      user: { ...userWithoutPassword, userType }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed - server error' });
  }
});

module.exports = router;
