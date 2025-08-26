import React, { useState, useEffect } from 'react';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  location: string;
  salary_range: string;
  job_type: string;
  organization_name: string;
  owner_name: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  max_participants: number;
  organization_name: string;
  owner_name: string;
  created_at: string;
}

interface StudentDashboardProps {
  user: any;
  onLogout: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'events' | 'applications'>(
    () => {
      const savedTab = localStorage.getItem('studentDashboardTab');
      return (savedTab as any) || 'dashboard';
    }
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [eventApplications, setEventApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [jobFilter, setJobFilter] = useState({
    search: '',
    location: '',
    jobType: ''
  });

  const [eventFilter, setEventFilter] = useState({
    search: '',
    location: ''
  });

  useEffect(() => {
    fetchJobs();
    fetchEvents();
    fetchApplications();
  }, []);

  // Update tab when changed
  useEffect(() => {
    localStorage.setItem('studentDashboardTab', activeTab);
  }, [activeTab]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (jobFilter.search) queryParams.append('search', jobFilter.search);
      if (jobFilter.location) queryParams.append('location', jobFilter.location);
      if (jobFilter.jobType) queryParams.append('jobType', jobFilter.jobType);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobs}?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (eventFilter.search) queryParams.append('search', eventFilter.search);
      if (eventFilter.location) queryParams.append('location', eventFilter.location);

      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.events}?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const [jobAppsRes, eventAppsRes] = await Promise.all([
        fetch(`${API_BASE_URL}${API_ENDPOINTS.jobApplications}/student/${user.id}`),
        fetch(`${API_BASE_URL}${API_ENDPOINTS.eventApplications}/student/${user.id}`)
      ]);

      if (jobAppsRes.ok) {
        const jobAppsData = await jobAppsRes.json();
        setJobApplications(jobAppsData);
      }

      if (eventAppsRes.ok) {
        const eventAppsData = await eventAppsRes.json();
        setEventApplications(eventAppsData);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const applyForJob = async (jobId: number, coverLetter: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobApplications}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          student_id: user.id,
          cover_letter: coverLetter
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Application submitted successfully!');
        fetchApplications();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to submit application');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error applying for job:', error);
      setError('Failed to submit application');
    }
  };

  const registerForEvent = async (eventId: number, message: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.eventApplications}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          student_id: user.id,
          message: message
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('Registration submitted successfully!');
        fetchApplications();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to register for event');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      setError('Failed to register for event');
    }
  };

  const handleJobApplication = (jobId: number) => {
    const coverLetter = prompt('Enter your cover letter:');
    if (coverLetter) {
      applyForJob(jobId, coverLetter);
    }
  };

  const handleEventRegistration = (eventId: number) => {
    const message = prompt('Enter a message (optional):') || '';
    registerForEvent(eventId, message);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'accepted';
      case 'rejected':
        return 'rejected';
      default:
        return 'pending';
    }
  };

  const getDashboardStats = () => {
    return {
      totalApplications: jobApplications.length + eventApplications.length,
      acceptedApplications: [...jobApplications, ...eventApplications].filter(app => app.status === 'accepted').length,
      pendingApplications: [...jobApplications, ...eventApplications].filter(app => app.status === 'pending').length,
      availableJobs: jobs.length,
      availableEvents: events.length
    };
  };

  const stats = getDashboardStats();

  return (
    <div style={styles.container}>
      <style>{dashboardCSS}</style>
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎓</span>
            <span style={styles.logoText}>Study A-Part</span>
          </div>
          <div style={styles.userProfile}>
            <div style={styles.userAvatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user.name}</div>
              <div style={styles.userRole}>Student</div>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: '📊' },
            { key: 'jobs', label: 'Browse Jobs', icon: '💼' },
            { key: 'events', label: 'Browse Events', icon: '🎯' },
            { key: 'applications', label: 'My Applications', icon: '📝' }
          ].map(item => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key as any)}
              style={{
                ...styles.navItem,
                ...(activeTab === item.key ? styles.navItemActive : {})
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button onClick={onLogout} style={styles.logoutButton}>
          <span style={styles.navIcon}>🚪</span>
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.headerTitle}>
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'jobs' && 'Browse Jobs'}
              {activeTab === 'events' && 'Browse Events'}
              {activeTab === 'applications' && 'My Applications'}
            </h1>
            <p style={styles.headerSubtitle}>
              {activeTab === 'dashboard' && 'Your study-work balance overview'}
              {activeTab === 'jobs' && 'Find the perfect part-time opportunity'}
              {activeTab === 'events' && 'Discover exciting events and workshops'}
              {activeTab === 'applications' && 'Track your application progress'}
            </p>
          </div>
          
          {/* Notification Messages */}
          {error && (
            <div style={styles.errorNotification}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={styles.successNotification}>
              ✅ {success}
            </div>
          )}
        </div>

        {/* Dashboard Content */}
        <div style={styles.content}>
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div style={styles.dashboardContent}>
              {/* Stats Cards */}
              <div style={styles.statsGrid}>
                <div style={{...styles.statCard, ...styles.statCardPrimary}}>
                  <div style={styles.statIcon}>📊</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.totalApplications}</div>
                    <div style={styles.statLabel}>Total Applications</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardSuccess}}>
                  <div style={styles.statIcon}>✅</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.acceptedApplications}</div>
                    <div style={styles.statLabel}>Accepted</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardWarning}}>
                  <div style={styles.statIcon}>⏳</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.pendingApplications}</div>
                    <div style={styles.statLabel}>Pending</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardInfo}}>
                  <div style={styles.statIcon}>🌟</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.availableJobs + stats.availableEvents}</div>
                    <div style={styles.statLabel}>Available Opportunities</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={styles.quickActionsSection}>
                <h3 style={styles.sectionTitle}>Quick Actions</h3>
                <div style={styles.quickActions}>
                  <button 
                    onClick={() => setActiveTab('jobs')}
                    style={{...styles.quickActionCard, ...styles.quickActionPrimary}}
                  >
                    <div style={styles.quickActionIcon}>💼</div>
                    <div style={styles.quickActionText}>Browse Jobs</div>
                    <div style={styles.quickActionCount}>{stats.availableJobs} available</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('events')}
                    style={{...styles.quickActionCard, ...styles.quickActionSecondary}}
                  >
                    <div style={styles.quickActionIcon}>🎯</div>
                    <div style={styles.quickActionText}>Browse Events</div>
                    <div style={styles.quickActionCount}>{stats.availableEvents} available</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('applications')}
                    style={{...styles.quickActionCard, ...styles.quickActionAccent}}
                  >
                    <div style={styles.quickActionIcon}>📝</div>
                    <div style={styles.quickActionText}>My Applications</div>
                    <div style={styles.quickActionCount}>{stats.totalApplications} total</div>
                  </button>
                </div>
              </div>

              {/* Recent Activity */}
              <div style={styles.recentActivitySection}>
                <h3 style={styles.sectionTitle}>Recent Applications</h3>
                <div style={styles.recentActivity}>
                  {[...jobApplications, ...eventApplications]
                    .slice(0, 5)
                    .map((app, index) => (
                      <div key={index} style={styles.activityItem}>
                        <div style={styles.activityIcon}>
                          {app.job_title ? '💼' : '🎯'}
                        </div>
                        <div style={styles.activityContent}>
                          <div style={styles.activityTitle}>
                            {app.job_title || app.event_title}
                          </div>
                          <div style={styles.activitySubtitle}>
                            {app.organization_name} • {new Date(app.applied_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{
                          ...styles.statusBadge,
                          ...styles[`status${getStatusBadgeClass(app.status).charAt(0).toUpperCase() + getStatusBadgeClass(app.status).slice(1)}`]
                        }}>
                          {app.status}
                        </div>
                      </div>
                    ))}
                  
                  {[...jobApplications, ...eventApplications].length === 0 && (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyStateIcon}>📭</div>
                      <div style={styles.emptyStateTitle}>No applications yet</div>
                      <div style={styles.emptyStateSubtitle}>Start applying to jobs and events to see your activity here</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div style={styles.tabContent}>
              {/* Search Filters */}
              <div style={styles.filtersCard}>
                <h3 style={styles.filtersTitle}>Find Your Perfect Job</h3>
                <div style={styles.filtersRow}>
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={jobFilter.search}
                    onChange={(e) => setJobFilter({...jobFilter, search: e.target.value})}
                    style={styles.filterInput}
                  />
                  <input
                    type="text"
                    placeholder="Location..."
                    value={jobFilter.location}
                    onChange={(e) => setJobFilter({...jobFilter, location: e.target.value})}
                    style={styles.filterInput}
                  />
                  <select
                    value={jobFilter.jobType}
                    onChange={(e) => setJobFilter({...jobFilter, jobType: e.target.value})}
                    style={styles.filterSelect}
                  >
                    <option value="">All Job Types</option>
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                  <button onClick={fetchJobs} style={styles.searchButton}>
                    🔍 Search
                  </button>
                </div>
              </div>

              {/* Jobs List */}
              <div style={styles.cardsGrid}>
                {jobs.map(job => (
                  <div key={job.id} style={styles.jobCard}>
                    <div style={styles.jobCardHeader}>
                      <div>
                        <h3 style={styles.jobTitle}>{job.title}</h3>
                        <p style={styles.jobCompany}>{job.organization_name}</p>
                      </div>
                      <div style={styles.jobType}>{job.job_type}</div>
                    </div>
                    
                    <p style={styles.jobDescription}>{job.description}</p>
                    
                    {job.requirements && (
                      <div style={styles.jobRequirements}>
                        <h4 style={styles.requirementsTitle}>Requirements:</h4>
                        <p style={styles.requirementsText}>{job.requirements}</p>
                      </div>
                    )}
                    
                    <div style={styles.jobFooter}>
                      <div style={styles.jobMeta}>
                        <span style={styles.jobLocation}>📍 {job.location}</span>
                        {job.salary_range && <span style={styles.jobSalary}>💰 {job.salary_range}</span>}
                        <span style={styles.jobDate}>📅 {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => handleJobApplication(job.id)}
                        style={styles.applyButton}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
                
                {jobs.length === 0 && !loading && (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyStateIcon}>💼</div>
                    <div style={styles.emptyStateTitle}>No jobs found</div>
                    <div style={styles.emptyStateSubtitle}>Try adjusting your search filters</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div style={styles.tabContent}>
              {/* Search Filters */}
              <div style={styles.filtersCard}>
                <h3 style={styles.filtersTitle}>Discover Amazing Events</h3>
                <div style={styles.filtersRow}>
                  <input
                    type="text"
                    placeholder="Search events..."
                    value={eventFilter.search}
                    onChange={(e) => setEventFilter({...eventFilter, search: e.target.value})}
                    style={styles.filterInput}
                  />
                  <input
                    type="text"
                    placeholder="Location..."
                    value={eventFilter.location}
                    onChange={(e) => setEventFilter({...eventFilter, location: e.target.value})}
                    style={styles.filterInput}
                  />
                  <button onClick={fetchEvents} style={styles.searchButton}>
                    🔍 Search
                  </button>
                </div>
              </div>

              {/* Events List */}
              <div style={styles.cardsGrid}>
                {events.map(event => (
                  <div key={event.id} style={styles.eventCard}>
                    <div style={styles.eventCardHeader}>
                      <h3 style={styles.eventTitle}>{event.title}</h3>
                      <p style={styles.eventOrganizer}>{event.organization_name}</p>
                    </div>
                    
                    <p style={styles.eventDescription}>{event.description}</p>
                    
                    <div style={styles.eventDetails}>
                      <div style={styles.eventMeta}>
                        <span style={styles.eventDate}>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                        <span style={styles.eventLocation}>📍 {event.location}</span>
                        {event.max_participants && (
                          <span style={styles.eventCapacity}>👥 Max {event.max_participants} participants</span>
                        )}
                      </div>
                    </div>
                    
                    <div style={styles.eventFooter}>
                      <button
                        onClick={() => handleEventRegistration(event.id)}
                        style={styles.registerButton}
                      >
                        Register Now
                      </button>
                    </div>
                  </div>
                ))}
                
                {events.length === 0 && !loading && (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyStateIcon}>🎯</div>
                    <div style={styles.emptyStateTitle}>No events found</div>
                    <div style={styles.emptyStateSubtitle}>Try adjusting your search filters</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div style={styles.tabContent}>
              <div style={styles.applicationsSection}>
                {/* Job Applications */}
                <div style={styles.applicationsGroup}>
                  <h3 style={styles.sectionTitle}>Job Applications ({jobApplications.length})</h3>
                  <div style={styles.applicationsGrid}>
                    {jobApplications.map(app => (
                      <div key={app.id} style={styles.applicationCard}>
                        <div style={styles.applicationHeader}>
                          <div>
                            <h4 style={styles.applicationTitle}>{app.job_title}</h4>
                            <p style={styles.applicationCompany}>{app.organization_name}</p>
                          </div>
                          <div style={{
                            ...styles.statusBadge,
                            ...styles[`status${getStatusBadgeClass(app.status).charAt(0).toUpperCase() + getStatusBadgeClass(app.status).slice(1)}`]
                          }}>
                            {app.status}
                          </div>
                        </div>
                        <div style={styles.applicationFooter}>
                          <span style={styles.applicationDate}>
                            Applied: {new Date(app.applied_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Event Applications */}
                <div style={styles.applicationsGroup}>
                  <h3 style={styles.sectionTitle}>Event Registrations ({eventApplications.length})</h3>
                  <div style={styles.applicationsGrid}>
                    {eventApplications.map(app => (
                      <div key={app.id} style={styles.applicationCard}>
                        <div style={styles.applicationHeader}>
                          <div>
                            <h4 style={styles.applicationTitle}>{app.event_title}</h4>
                            <p style={styles.applicationCompany}>{app.organization_name}</p>
                          </div>
                          <div style={{
                            ...styles.statusBadge,
                            ...styles[`status${getStatusBadgeClass(app.status).charAt(0).toUpperCase() + getStatusBadgeClass(app.status).slice(1)}`]
                          }}>
                            {app.status}
                          </div>
                        </div>
                        <div style={styles.applicationFooter}>
                          <span style={styles.applicationDate}>
                            Registered: {new Date(app.applied_at).toLocaleDateString()}
                          </span>
                          <span style={styles.eventDateInfo}>
                            Event: {new Date(app.event_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Empty State */}
                {jobApplications.length === 0 && eventApplications.length === 0 && (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyStateIcon}>📭</div>
                    <div style={styles.emptyStateTitle}>No applications yet</div>
                    <div style={styles.emptyStateSubtitle}>
                      Start applying to jobs and registering for events to track your progress here
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div style={styles.loadingOverlay}>
          <div style={styles.loadingSpinner}></div>
        </div>
      )}
    </div>
  );
};

// Enhanced CSS with animations
const dashboardCSS = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
    40%, 43% { transform: translateY(-10px); }
    70% { transform: translateY(-5px); }
    90% { transform: translateY(-2px); }
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
`;

// Enhanced styles with beautiful gradients and animations
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  sidebar: {
    width: '280px',
    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100vh',
    overflowY: 'auto',
    boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
  },

  sidebarHeader: {
    padding: '2rem 1.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },

  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '2rem',
  },

  logoIcon: {
    fontSize: '2rem',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
  },

  logoText: {
    fontSize: '1.5rem',
    fontWeight: '700',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },

  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
  },

  userAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '600',
    border: '2px solid rgba(255,255,255,0.3)',
  },

  userInfo: {
    flex: 1,
  },

  userName: {
    fontWeight: '600',
    fontSize: '1rem',
    marginBottom: '2px',
  },

  userRole: {
    fontSize: '0.875rem',
    opacity: 0.8,
  },

  nav: {
    flex: 1,
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'rgba(255,255,255,0.8)',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
    textAlign: 'left',
  },

  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: 'white',
    fontWeight: '600',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },

  navIcon: {
    fontSize: '1.25rem',
    width: '24px',
    textAlign: 'center',
  },

  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    margin: '1.5rem',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.9)',
    fontSize: '0.95rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  main: {
    flex: 1,
    marginLeft: '280px',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },

  header: {
    backgroundColor: 'white',
    padding: '2rem',
    borderBottom: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    position: 'relative',
  },

  headerTitle: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a202c',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  headerSubtitle: {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0,
  },

  errorNotification: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    border: '1px solid #fecaca',
    animation: 'fadeInUp 0.3s ease-out',
  },

  successNotification: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '0.875rem',
    border: '1px solid #a7f3d0',
    animation: 'fadeInUp 0.3s ease-out',
  },

  content: {
    flex: 1,
    padding: '2rem',
    backgroundColor: '#f8fafc',
  },

  dashboardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    animation: 'fadeInUp 0.6s ease-out',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
  },

  statCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.3s ease',
    animation: 'slideInLeft 0.6s ease-out',
  },

  statCardPrimary: {
    borderLeft: '4px solid #667eea',
  },

  statCardSuccess: {
    borderLeft: '4px solid #10b981',
  },

  statCardWarning: {
    borderLeft: '4px solid #f59e0b',
  },

  statCardInfo: {
    borderLeft: '4px solid #06b6d4',
  },

  statIcon: {
    fontSize: '2.5rem',
    opacity: 0.8,
  },

  statContent: {
    flex: 1,
  },

  statNumber: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a202c',
    lineHeight: 1,
  },

  statLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginTop: '4px',
  },

  quickActionsSection: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },

  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '1.5rem',
  },

  quickActions: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },

  quickActionCard: {
    padding: '1.5rem',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    color: 'white',
    fontWeight: '500',
  },

  quickActionPrimary: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },

  quickActionSecondary: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  },

  quickActionAccent: {
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  },

  quickActionIcon: {
    fontSize: '2rem',
    marginBottom: '0.5rem',
  },

  quickActionText: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '0.25rem',
  },

  quickActionCount: {
    fontSize: '0.875rem',
    opacity: 0.9,
  },

  recentActivitySection: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },

  recentActivity: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },

  activityIcon: {
    fontSize: '1.5rem',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  activityContent: {
    flex: 1,
  },

  activityTitle: {
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: '2px',
  },

  activitySubtitle: {
    fontSize: '0.875rem',
    color: '#64748b',
  },

  statusBadge: {
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  statusPending: {
    backgroundColor: '#fef3c7',
    color: '#d97706',
  },

  statusAccepted: {
    backgroundColor: '#d1fae5',
    color: '#065f46',
  },

  statusRejected: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },

  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#64748b',
  },

  emptyStateIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },

  emptyStateTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#374151',
  },

  emptyStateSubtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
  },

  tabContent: {
    animation: 'fadeInUp 0.6s ease-out',
  },

  filtersCard: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    marginBottom: '2rem',
  },

  filtersTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '1.5rem',
  },

  filtersRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    alignItems: 'end',
  },

  filterInput: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
  },

  filterSelect: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '2px solid #e2e8f0',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    cursor: 'pointer',
  },

  searchButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1.5rem',
  },

  jobCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
  },

  jobCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },

  jobTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 0.25rem 0',
  },

  jobCompany: {
    fontSize: '0.875rem',
    color: '#667eea',
    fontWeight: '500',
    margin: 0,
  },

  jobType: {
    padding: '4px 8px',
    backgroundColor: '#e0e7ff',
    color: '#3730a3',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  jobDescription: {
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: '1rem',
  },

  jobRequirements: {
    marginBottom: '1rem',
  },

  requirementsTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 0.5rem 0',
  },

  requirementsText: {
    fontSize: '0.875rem',
    color: '#6b7280',
    lineHeight: 1.5,
    margin: 0,
  },

  jobFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #f1f5f9',
  },

  jobMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '0.75rem',
    color: '#6b7280',
  },

  jobLocation: {},
  jobSalary: {},
  jobDate: {},

  applyButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  eventCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
  },

  eventCardHeader: {
    marginBottom: '1rem',
  },

  eventTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 0.25rem 0',
  },

  eventOrganizer: {
    fontSize: '0.875rem',
    color: '#f59e0b',
    fontWeight: '500',
    margin: 0,
  },

  eventDescription: {
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: '1rem',
  },

  eventDetails: {
    marginBottom: '1rem',
  },

  eventMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '0.75rem',
    color: '#6b7280',
  },

  eventDate: {},
  eventLocation: {},
  eventCapacity: {},

  eventFooter: {
    paddingTop: '1rem',
    borderTop: '1px solid #f1f5f9',
  },

  registerButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  applicationsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },

  applicationsGroup: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },

  applicationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1rem',
  },

  applicationCard: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },

  applicationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
  },

  applicationTitle: {
    fontSize: '1rem',
    fontWeight: '500',
    color: '#1a202c',
    margin: '0 0 0.25rem 0',
  },

  applicationCompany: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
  },

  applicationFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: '#6b7280',
  },

  applicationDate: {},
  eventDateInfo: {},

  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },

  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default StudentDashboard;
