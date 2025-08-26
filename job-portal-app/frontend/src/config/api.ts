const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-domain.com'
  : 'http://localhost:3001';

export default API_BASE_URL;

export const API_ENDPOINTS = {
  // Auth
  signup: '/api/auth/signup',
  login: '/api/auth/login',
  
  // Colleges
  colleges: '/api/colleges',
  
  // Admin
  pendingStudents: '/api/admin/pending-students',
  approveStudent: '/api/admin/approve-student',
  rejectStudent: '/api/admin/reject-student',
  getPdf: '/api/admin/pdf',
  
  // Jobs
  jobs: '/api/jobs',
  jobsByOwner: '/api/jobs/owner',
  
  // Events
  events: '/api/events',
  eventsByOwner: '/api/events/owner',
  
  // Applications
  jobApplications: '/api/job-applications',
  eventApplications: '/api/event-applications',
  
  // Reports
  acceptedStudentsPdf: '/api/reports/owner',
  eventAcceptedStudentsPdf: '/api/reports/event',
  jobAcceptedStudentsPdf: '/api/reports/job',
};
