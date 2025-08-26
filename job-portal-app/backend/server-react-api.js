const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Import route modules (guarded requires so server won't crash if a file is missing)
let authRoutes, adminRoutes, eventsRoutes, jobsRoutes, collegesRoutes, reportsRoutes, jobAppsRoutes, eventAppsRoutes;
try { authRoutes = require('./routes/auth'); } catch (e) { console.warn('auth routes not found'); }
try { adminRoutes = require('./routes/admin'); } catch (e) { console.warn('admin routes not found'); }
try { eventsRoutes = require('./routes/events'); } catch (e) { console.warn('events routes not found'); }
try { jobsRoutes = require('./routes/jobs'); } catch (e) { console.warn('jobs routes not found'); }
try { collegesRoutes = require('./routes/colleges'); } catch (e) { console.warn('colleges routes not found'); }
try { reportsRoutes = require('./routes/reports'); } catch (e) { console.warn('reports routes not found'); }
try { jobAppsRoutes = require('./routes/job-applications'); } catch (e) { console.warn('job-applications routes not found'); }
try { eventAppsRoutes = require('./routes/event-applications'); } catch (e) { console.warn('event-applications routes not found'); }

// Enable CORS for your React frontend
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads (PDFs, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect routes only if they were successfully required
if (authRoutes) app.use('/api/auth', authRoutes);
if (adminRoutes) app.use('/api/admin', adminRoutes);

// eventsRoutes and jobsRoutes export routers that contain paths like '/events' and '/jobs'
// so keep mounting at '/api' (this yields `/api/events` and `/api/jobs`)
if (eventsRoutes) app.use('/api', eventsRoutes);
if (jobsRoutes) app.use('/api', jobsRoutes);
// Mount application routers explicitly
if (jobAppsRoutes) app.use('/api/job-applications', jobAppsRoutes);
if (eventAppsRoutes) app.use('/api/event-applications', eventAppsRoutes);

// collegesRoutes router uses router.get('/') so mount at /api/colleges
if (collegesRoutes) app.use('/api/colleges', collegesRoutes);

// reports routes (if implemented) — mount under /api/reports so frontend calls to
// /api/reports/event/:id/... and /api/reports/job/:id/... resolve correctly
if (reportsRoutes) app.use('/api/reports', reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Study A-Part API is running!',
    endpoints: {
      auth: '/api/auth',
      admin: '/api/admin',
      events: '/api/events',
      jobs: '/api/jobs',
      colleges: '/api/colleges',
      reports: '/api/reports'
    }
  });
});

// 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Basic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Study A-Part API Server running on http://localhost:${PORT}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Admin Dashboard: http://localhost:3000/admin`);
  console.log(`🎓 Student Dashboard: http://localhost:3000/student`);
  console.log(`🏢 Owner Dashboard: http://localhost:3000/owner`);
  console.log(`📈 Reports Dashboard: http://localhost:3000/reports`);
});

module.exports = app;
