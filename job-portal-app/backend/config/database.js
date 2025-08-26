const mysql = require('mysql2/promise'); // ✅ Direct promise import
require('dotenv').config();

// Create connection pool with direct promise support
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'job_portal',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10,
    idleTimeout: 60000,
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

// Test connection function
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully to:', process.env.DB_NAME || 'job_portal');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Initialize database and create tables
const initializeDatabase = async () => {
    try {
        console.log('🔄 Initializing database and tables...');
        
        await createTables();
        await seedInitialData();
        
        console.log('✅ Database initialized successfully');
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
    }
};

const createTables = async () => {
    const tables = [
        // Colleges table
        `CREATE TABLE IF NOT EXISTS colleges (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        // Admin users table - ADDED
        `CREATE TABLE IF NOT EXISTS admin_users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        // Users table (pending students)
        `CREATE TABLE IF NOT EXISTS users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            date_of_birth DATE,
            college_id INT UNSIGNED,
            student_college_id VARCHAR(100),
            pdf_path VARCHAR(500),
            verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_college_id (college_id),
            CONSTRAINT fk_users_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        // Approved students table
        `CREATE TABLE IF NOT EXISTS approved_students (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            date_of_birth DATE,
            college_id INT UNSIGNED,
            student_college_id VARCHAR(100),
            pdf_path VARCHAR(500),
            approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_college_id (college_id),
            CONSTRAINT fk_approved_college FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        // Owner users table
        `CREATE TABLE IF NOT EXISTS owner_users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            organization_name VARCHAR(255) NOT NULL,
            location VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        // Jobs table
        `CREATE TABLE IF NOT EXISTS jobs (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            owner_id INT UNSIGNED NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            requirements TEXT,
            location VARCHAR(255),
            salary_range VARCHAR(100),
            job_type ENUM('full-time', 'part-time', 'internship', 'contract') DEFAULT 'part-time',
            status ENUM('active', 'inactive', 'closed') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_owner_id (owner_id),
            CONSTRAINT fk_job_owner FOREIGN KEY (owner_id) REFERENCES owner_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        // Events table
        `CREATE TABLE IF NOT EXISTS events (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            owner_id INT UNSIGNED NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            event_date DATETIME,
            location VARCHAR(255),
            max_participants INT,
            registration_deadline DATETIME,
            status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_owner_id (owner_id),
            CONSTRAINT fk_event_owner FOREIGN KEY (owner_id) REFERENCES owner_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        // Job applications table
        `CREATE TABLE IF NOT EXISTS job_applications (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            job_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            cover_letter TEXT,
            status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_job_id (job_id),
            INDEX idx_student_id (student_id),
            UNIQUE KEY unique_application (job_id, student_id),
            CONSTRAINT fk_job_application_job FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
            CONSTRAINT fk_job_application_student FOREIGN KEY (student_id) REFERENCES approved_students(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        // Event applications table
        `CREATE TABLE IF NOT EXISTS event_applications (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            event_id INT UNSIGNED NOT NULL,
            student_id INT UNSIGNED NOT NULL,
            message TEXT,
            status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_event_id (event_id),
            INDEX idx_student_id (student_id),
            UNIQUE KEY unique_registration (event_id, student_id),
            CONSTRAINT fk_event_application_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
            CONSTRAINT fk_event_application_student FOREIGN KEY (student_id) REFERENCES approved_students(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
    ];

    for (const table of tables) {
        await pool.execute(table);
    }
    console.log('✅ Database tables created successfully');
};

const seedInitialData = async () => {
    try {
        // Seed colleges
        const colleges = [
            ['National Institute of Technology Karnataka (NITK)', 'Surathkal'],
            ['Kasturba Medical College, Mangalore', 'Mangalore'],
            ['St. Aloysius College', 'Mangalore'],
            ['St. Agnes College', 'Mangalore'],
            ['Manipal Institute of Technology', 'Manipal'],
            ['Yenepoya Medical College', 'Mangalore'],
            ['Sahyadri College of Engineering & Management', 'Mangalore'],
            ['PA College of Engineering', 'Mangalore'],
            ['St Joseph Engineering College', 'Mangalore'],
            ['Canara College', 'Mangalore'],
            ['AJ Institute of Engineering and Technology', 'Mangalore'],
            ['Bearys Institute of Technology', 'Mangalore'],
            ['Manipal College of Dental Sciences', 'Mangalore'],
            ['TA Pai Management Institute (TAPMI)', 'Manipal'],
            ['SDM College', 'Ujire'],
            ['Alvas College', 'Moodbidri'],
            ['Pompei College', 'Mangalore'],
            ['Sacred Heart College', 'Madanthyar'],
            ['NMAM Institute of Technology', 'Nitte'],
            ['Srinivas University', 'Mangalore']
        ];

        // Check if colleges already exist
        const [existingColleges] = await pool.execute('SELECT COUNT(*) as count FROM colleges');
        
        if (existingColleges[0].count === 0) {
            for (const [name, location] of colleges) {
                await pool.execute(
                    'INSERT IGNORE INTO colleges (name, location) VALUES (?, ?)',
                    [name, location]
                );
            }
            console.log('✅ Colleges seeded successfully');
        }
        
        // Insert default admin user (password: admin123)
        await pool.execute(
            'INSERT IGNORE INTO admin_users (name, email, password) VALUES (?, ?, ?)',
            ['System Admin', 'admin@jobportal.com', '$2b$10$8K1p/a0dLPMwIjCLa9vnjOgvUx4lFhK8r9f/6Y.xEJl9dZ2nQl5Je']
        );
        console.log('✅ Admin user seeded successfully');
        
    } catch (err) {
        console.error('❌ Error seeding initial data:', err.message);
    }
};

// Initialize database on startup
initializeDatabase();

// ✅ Direct export - no complex async getters needed
module.exports = { pool, testConnection };
