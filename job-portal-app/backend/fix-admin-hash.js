const bcrypt = require('bcryptjs');
const { pool } = require('./config/database');

async function createFreshAdminHash() {
    try {
        console.log('🔑 Generating fresh hash for admin123...');
        
        // Generate a completely fresh hash
        const freshHash = await bcrypt.hash('admin123', 10);
        console.log('✨ Fresh hash generated:', freshHash);
        
        // Test the hash immediately
        const testResult = await bcrypt.compare('admin123', freshHash);
        console.log('🧪 Hash test result:', testResult);
        
        if (testResult) {
            // Delete old admin and create new one
            await pool.execute('DELETE FROM admin_users WHERE email = ?', ['admin@jobportal.com']);
            
            await pool.execute(
                'INSERT INTO admin_users (name, email, password) VALUES (?, ?, ?)',['System Admin', 'admin@jobportal.com', freshHash]
            );
            
            console.log('✅ Admin user created successfully with fresh hash');
        } else {
            console.log('❌ Hash generation failed test');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
    process.exit();
}

createFreshAdminHash();
