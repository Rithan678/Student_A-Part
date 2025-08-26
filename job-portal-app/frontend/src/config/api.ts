// Allow overriding the API base URL at build time via REACT_APP_API_BASE_URL.
// This is the recommended way when building the frontend for Render (or Vercel)
// because Render exposes env vars at build time and CRA only exposes vars that
// begin with REACT_APP_. If REACT_APP_API_BASE_URL is not set, fall back to the
// previous NODE_ENV-based defaults.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (process.env.NODE_ENV === 'production'
  ? 'https://your-production-domain.com'
  : 'http://localhost:3001');

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
