const mysql = require('mysql2/promise');
require('dotenv').config();

const colleges = [
  // Medical Colleges
  { name: 'Kasturba Medical College, Mangalore', location: 'Mangalore' },
  { name: 'Yenepoya Medical College', location: 'Mangalore' },
  { name: 'AJ Institute of Medical Sciences', location: 'Mangalore' },
  { name: 'KS Hegde Medical Academy', location: 'Mangalore' },
  
  // Engineering Colleges  
  { name: 'National Institute of Technology Karnataka (NITK)', location: 'Surathkal' },
  { name: 'Manipal Institute of Technology', location: 'Manipal' },
  { name: 'NMAM Institute of Technology', location: 'Nitte' },
  { name: 'Sahyadri College of Engineering & Management', location: 'Mangalore' },
  { name: 'PA College of Engineering', location: 'Mangalore' },
  { name: 'St Joseph Engineering College', location: 'Mangalore' },
  { name: 'AJ Institute of Engineering and Technology', location: 'Mangalore' },
  { name: 'Canara Engineering College', location: 'Bantwal' },
  { name: 'Bearys Institute of Technology', location: 'Mangalore' },
  { name: 'Shree Devi Institute of Technology', location: 'Mangalore' },
  { name: 'Mangalore Institute of Technology and Engineering (MITE)', location: 'Moodbidri' },
  { name: 'Alvas Institute of Engineering and Technology', location: 'Moodbidri' },
  { name: 'Yenepoya Institute of Technology', location: 'Moodbidri' },
  { name: 'Vivekananda College of Engineering & Technology', location: 'Puttur' },
  { name: 'SDM Institute of Technology', location: 'Ujire' },
  { name: 'Srinivas Institute of Technology', location: 'Mangalore' },
  
  // Arts & Science Colleges
  { name: 'St. Aloysius College', location: 'Mangalore' },
  { name: 'St. Agnes College', location: 'Mangalore' },
  { name: 'Canara College', location: 'Mangalore' },
  { name: 'Pompei College', location: 'Mangalore' },
  { name: 'Government First Grade College', location: 'Mangalore' },
  { name: 'University College', location: 'Mangalore' },
  { name: 'St. Joseph College', location: 'Mangalore' },
  { name: 'Besant Evening College', location: 'Mangalore' },
  { name: 'Besant Womens College', location: 'Mangalore' },
  { name: 'Sacred Heart College', location: 'Madanthyar' },
  { name: 'Alvas College', location: 'Moodbidri' },
  { name: 'Milagres College', location: 'Mangalore' },
  { name: 'Rosario College', location: 'Mangalore' },
  { name: 'SDM College', location: 'Ujire' },
  { name: 'Sri Bhuvanendra College', location: 'Karkala' },
  { name: 'Sri Venkatramana Swamy College', location: 'Bantwal' },
  { name: 'Poornaprajna College', location: 'Udupi' },
  { name: 'MGM College', location: 'Udupi' },
  
  // Management Colleges
  { name: 'TA Pai Management Institute (TAPMI)', location: 'Manipal' },
  { name: 'Srinivas Institute of Management Studies', location: 'Mangalore' },
  { name: 'SDM College of Business Management', location: 'Mangalore' },
  { name: 'Welcomgroup Graduate School of Hotel Administration', location: 'Manipal' },
  
  // Dental & Pharmacy Colleges
  { name: 'Manipal College of Dental Sciences', location: 'Mangalore' },
  { name: 'Yenepoya Dental College', location: 'Mangalore' },
  { name: 'Manipal College of Pharmaceutical Sciences', location: 'Manipal' },
  { name: 'Yenepoya Pharmacy College', location: 'Mangalore' },
  
  // Nursing & Allied Health
  { name: 'Manipal College of Nursing', location: 'Manipal' },
  { name: 'Yenepoya Nursing College', location: 'Mangalore' },
  { name: 'Manipal College of Health Professions', location: 'Mangalore' },
  
  // Design & Media Colleges
  { name: 'Manipal Institute of Communication', location: 'Manipal' },
  { name: 'Srishti Manipal Institute of Art, Design & Technology', location: 'Bangalore' },
  { name: 'Manipal School of Architecture and Planning', location: 'Manipal' },
  
  // Other Notable Colleges
  { name: 'Nitte Deemed University', location: 'Mangalore' },
  { name: 'Srinivas University', location: 'Mangalore' },
  { name: 'Yenepoya Deemed University', location: 'Mangalore' },
  { name: 'Mangalore University', location: 'Mangalore' }
];

const seedDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'job_portal'
  });

  try {
    console.log('Seeding colleges...');
    
    // Clear existing data
    await connection.execute('DELETE FROM colleges');
    
    // Insert new colleges
    for (const college of colleges) {
      await connection.execute(
        'INSERT INTO colleges (name, location) VALUES (?, ?)'
      , [college.name, college.location]);
    }
    
    console.log(`✅ Successfully seeded ${colleges.length} colleges!`);
  } catch (error) {
    console.error('❌ Error seeding colleges:', error);
  } finally {
    await connection.end();
  }
};

seedDatabase();
