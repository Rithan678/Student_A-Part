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
  status: string;
  created_at: string;
}

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  max_participants: number;
  registration_deadline: string;
  status: string;
  created_at: string;
}

interface OwnerDashboardProps {
  user: any;
  onLogout: () => void;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'events' | 'applications'>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [eventApplications, setEventApplications] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form states
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salary_range: '',
    job_type: 'full-time',
    status: 'active'
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_date: '',
    location: '',
    max_participants: '',
    registration_deadline: '',
    status: 'active'
  });

  useEffect(() => {
    fetchJobs();
    fetchEvents();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobsByOwner}/${user.id}`);
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
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.eventsByOwner}/${user.id}`);
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

  const fetchJobApplications = async (jobId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobApplications}/job/${jobId}`);
      if (response.ok) {
        const data = await response.json();
        setJobApplications(data);
      }
    } catch (error) {
      console.error('Error fetching job applications:', error);
    }
  };

  const fetchEventApplications = async (eventId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.eventApplications}/event/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEventApplications(data);
      }
    } catch (error) {
      console.error('Error fetching event applications:', error);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingJob 
        ? `${API_BASE_URL}${API_ENDPOINTS.jobs}/${editingJob.id}`
        : `${API_BASE_URL}${API_ENDPOINTS.jobs}`;
      
      const method = editingJob ? 'PUT' : 'POST';
      const body = editingJob ? jobForm : { ...jobForm, owner_id: user.id };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSuccess(editingJob ? 'Job updated successfully!' : 'Job created successfully!');
        setShowJobModal(false);
        setEditingJob(null);
        resetJobForm();
        fetchJobs();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save job');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error saving job:', error);
      setError('Failed to save job');
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingEvent 
        ? `${API_BASE_URL}${API_ENDPOINTS.events}/${editingEvent.id}`
        : `${API_BASE_URL}${API_ENDPOINTS.events}`;
      
      const method = editingEvent ? 'PUT' : 'POST';
      const body = editingEvent ? eventForm : { ...eventForm, owner_id: user.id };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSuccess(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
        setShowEventModal(false);
        setEditingEvent(null);
        resetEventForm();
        fetchEvents();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save event');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error saving event:', error);
      setError('Failed to save event');
    }
  };

  const updateApplicationStatus = async (applicationId: number, status: string, type: 'job' | 'event') => {
    try {
      const endpoint = type === 'job' 
        ? `${API_BASE_URL}${API_ENDPOINTS.jobApplications}/${applicationId}/status`
        : `${API_BASE_URL}${API_ENDPOINTS.eventApplications}/${applicationId}/status`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setSuccess(`Application ${status} successfully!`);
        if (type === 'job' && selectedJobId) {
          fetchJobApplications(selectedJobId);
        } else if (type === 'event' && selectedEventId) {
          fetchEventApplications(selectedEventId);
        }
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update application status');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      setError('Failed to update application status');
    }
  };

  const downloadEventAcceptedStudentsPdf = async (eventId: number, eventTitle: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/reports/event/${eventId}/accepted-students-pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accepted_students_${eventTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setSuccess(`PDF downloaded successfully for ${eventTitle}!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to download report');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const downloadJobAcceptedStudentsPdf = async (jobId: number, jobTitle: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/reports/job/${jobId}/accepted-students-pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accepted_applicants_${jobTitle.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        setSuccess(`PDF downloaded successfully for ${jobTitle}!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to download report');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setError('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      location: job.location,
      salary_range: job.salary_range,
      job_type: job.job_type,
      status: job.status
    });
    setShowJobModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      event_date: event.event_date.split('T')[0],
      location: event.location,
      max_participants: event.max_participants.toString(),
      registration_deadline: event.registration_deadline ? event.registration_deadline.split('T')[0] : '',
      status: event.status
    });
    setShowEventModal(true);
  };

  const handleDeleteJob = async (jobId: number) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.jobs}/${jobId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSuccess('Job deleted successfully!');
          fetchJobs();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('Failed to delete job');
          setTimeout(() => setError(''), 3000);
        }
      } catch (error) {
        console.error('Error deleting job:', error);
        setError('Failed to delete job');
      }
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.events}/${eventId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSuccess('Event deleted successfully!');
          fetchEvents();
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('Failed to delete event');
          setTimeout(() => setError(''), 3000);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        setError('Failed to delete event');
      }
    }
  };

  const resetJobForm = () => {
    setJobForm({
      title: '',
      description: '',
      requirements: '',
      location: '',
      salary_range: '',
      job_type: 'full-time',
      status: 'active'
    });
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      event_date: '',
      location: '',
      max_participants: '',
      registration_deadline: '',
      status: 'active'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'statusActive';
      case 'inactive': return 'statusInactive';
      case 'closed': case 'completed': return 'statusClosed';
      case 'accepted': return 'statusAccepted';
      case 'rejected': return 'statusRejected';
      default: return 'statusPending';
    }
  };

  const getDashboardStats = () => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalEvents = events.length;
    const activeEvents = events.filter(event => event.status === 'active').length;
    
    return {
      totalJobs,
      activeJobs,
      totalEvents,
      activeEvents,
      totalOpportunities: totalJobs + totalEvents
    };
  };

  const stats = getDashboardStats();

  return (
    <div style={styles.container}>
      <style>{ownerDashboardCSS}</style>
      
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
              <div style={styles.userRole}>Owner</div>
              <div style={styles.organizationName}>{user.organization_name}</div>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: '📊' },
            { key: 'jobs', label: 'My Jobs', icon: '💼' },
            { key: 'events', label: 'My Events', icon: '🎯' },
            { key: 'applications', label: 'Applications', icon: '📝' }
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
              {activeTab === 'dashboard' && 'Owner Dashboard'}
              {activeTab === 'jobs' && 'My Jobs'}
              {activeTab === 'events' && 'My Events'}
              {activeTab === 'applications' && 'Application Management'}
            </h1>
            <p style={styles.headerSubtitle}>
              {activeTab === 'dashboard' && 'Manage your opportunities and track success'}
              {activeTab === 'jobs' && 'Create and manage job postings'}
              {activeTab === 'events' && 'Organize and manage events'}
              {activeTab === 'applications' && 'Review and manage applications'}
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
                  <div style={styles.statIcon}>💼</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.totalJobs}</div>
                    <div style={styles.statLabel}>Total Jobs</div>
                    <div style={styles.statSubLabel}>{stats.activeJobs} active</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardSuccess}}>
                  <div style={styles.statIcon}>🎯</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.totalEvents}</div>
                    <div style={styles.statLabel}>Total Events</div>
                    <div style={styles.statSubLabel}>{stats.activeEvents} active</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardInfo}}>
                  <div style={styles.statIcon}>🌟</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.totalOpportunities}</div>
                    <div style={styles.statLabel}>Total Opportunities</div>
                    <div style={styles.statSubLabel}>Jobs + Events</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardWarning}}>
                  <div style={styles.statIcon}>📊</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>
                      {stats.totalJobs > 0 ? Math.round((stats.activeJobs / stats.totalJobs) * 100) : 0}%
                    </div>
                    <div style={styles.statLabel}>Active Rate</div>
                    <div style={styles.statSubLabel}>Job activity</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={styles.quickActionsSection}>
                <h3 style={styles.sectionTitle}>Quick Actions</h3>
                <div style={styles.quickActions}>
                  <button 
                    onClick={() => setShowJobModal(true)}
                    style={{...styles.quickActionCard, ...styles.quickActionPrimary}}
                  >
                    <div style={styles.quickActionIcon}>➕</div>
                    <div style={styles.quickActionText}>Create New Job</div>
                    <div style={styles.quickActionSubtext}>Post a new opportunity</div>
                  </button>
                  
                  <button 
                    onClick={() => setShowEventModal(true)}
                    style={{...styles.quickActionCard, ...styles.quickActionSecondary}}
                  >
                    <div style={styles.quickActionIcon}>🎉</div>
                    <div style={styles.quickActionText}>Create New Event</div>
                    <div style={styles.quickActionSubtext}>Organize an event</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('applications')}
                    style={{...styles.quickActionCard, ...styles.quickActionAccent}}
                  >
                    <div style={styles.quickActionIcon}>📝</div>
                    <div style={styles.quickActionText}>Review Applications</div>
                    <div style={styles.quickActionSubtext}>Manage submissions</div>
                  </button>
                </div>
              </div>

              {/* Recent Jobs & Events */}
              <div style={styles.recentSection}>
                <div style={styles.recentColumn}>
                  <h3 style={styles.sectionTitle}>Recent Jobs ({jobs.slice(0, 5).length})</h3>
                  <div style={styles.recentList}>
                    {jobs.slice(0, 5).map(job => (
                      <div key={job.id} style={styles.recentItem}>
                        <div style={styles.recentItemContent}>
                          <div style={styles.recentItemTitle}>{job.title}</div>
                          <div style={styles.recentItemMeta}>
                            {job.location} • {new Date(job.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{
                          ...styles.statusBadge,
                          ...styles[getStatusBadgeClass(job.status)]
                        }}>
                          {job.status}
                        </div>
                      </div>
                    ))}
                    
                    {jobs.length === 0 && (
                      <div style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>💼</div>
                        <div style={styles.emptyStateText}>No jobs yet</div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={styles.recentColumn}>
                  <h3 style={styles.sectionTitle}>Recent Events ({events.slice(0, 5).length})</h3>
                  <div style={styles.recentList}>
                    {events.slice(0, 5).map(event => (
                      <div key={event.id} style={styles.recentItem}>
                        <div style={styles.recentItemContent}>
                          <div style={styles.recentItemTitle}>{event.title}</div>
                          <div style={styles.recentItemMeta}>
                            {event.location} • {new Date(event.event_date).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{
                          ...styles.statusBadge,
                          ...styles[getStatusBadgeClass(event.status)]
                        }}>
                          {event.status}
                        </div>
                      </div>
                    ))}
                    
                    {events.length === 0 && (
                      <div style={styles.emptyState}>
                        <div style={styles.emptyStateIcon}>🎯</div>
                        <div style={styles.emptyStateText}>No events yet</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <div style={styles.tabContent}>
              <div style={styles.tabHeader}>
                <div style={styles.tabHeaderLeft}>
                  <h3 style={styles.tabTitle}>Job Postings ({jobs.length})</h3>
                  <p style={styles.tabSubtitle}>Manage your job opportunities</p>
                </div>
                <button
                  onClick={() => setShowJobModal(true)}
                  style={styles.createButton}
                >
                  ➕ Create New Job
                </button>
              </div>

              <div style={styles.cardsGrid}>
                {jobs.map(job => (
                  <div key={job.id} style={styles.itemCard}>
                    <div style={styles.itemCardHeader}>
                      <div>
                        <h4 style={styles.itemTitle}>{job.title}</h4>
                        <p style={styles.itemLocation}>{job.location}</p>
                      </div>
                      <div style={{
                        ...styles.statusBadge,
                        ...styles[getStatusBadgeClass(job.status)]
                      }}>
                        {job.status}
                      </div>
                    </div>
                    
                    <p style={styles.itemDescription}>{job.description}</p>
                    
                    <div style={styles.itemMeta}>
                      <span>Type: {job.job_type}</span>
                      {job.salary_range && <span>Salary: {job.salary_range}</span>}
                      <span>Created: {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div style={styles.itemActions}>
                      <button
                        onClick={() => handleEditJob(job)}
                        style={styles.editButton}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        style={styles.deleteButton}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {jobs.length === 0 && (
                  <div style={styles.emptyStateCard}>
                    <div style={styles.emptyStateIcon}>💼</div>
                    <div style={styles.emptyStateTitle}>No jobs posted yet</div>
                    <div style={styles.emptyStateSubtitle}>Create your first job posting to start attracting talent</div>
                    <button
                      onClick={() => setShowJobModal(true)}
                      style={styles.emptyStateButton}
                    >
                      Create First Job
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div style={styles.tabContent}>
              <div style={styles.tabHeader}>
                <div style={styles.tabHeaderLeft}>
                  <h3 style={styles.tabTitle}>Events ({events.length})</h3>
                  <p style={styles.tabSubtitle}>Organize and manage your events</p>
                </div>
                <button
                  onClick={() => setShowEventModal(true)}
                  style={styles.createButton}
                >
                  🎉 Create New Event
                </button>
              </div>

              <div style={styles.cardsGrid}>
                {events.map(event => (
                  <div key={event.id} style={styles.itemCard}>
                    <div style={styles.itemCardHeader}>
                      <div>
                        <h4 style={styles.itemTitle}>{event.title}</h4>
                        <p style={styles.itemLocation}>{event.location}</p>
                      </div>
                      <div style={{
                        ...styles.statusBadge,
                        ...styles[getStatusBadgeClass(event.status)]
                      }}>
                        {event.status}
                      </div>
                    </div>
                    
                    <p style={styles.itemDescription}>{event.description}</p>
                    
                    <div style={styles.itemMeta}>
                      <span>Date: {new Date(event.event_date).toLocaleDateString()}</span>
                      {event.max_participants && <span>Max: {event.max_participants} participants</span>}
                      <span>Created: {new Date(event.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div style={styles.itemActions}>
                      <button
                        onClick={() => handleEditEvent(event)}
                        style={styles.editButton}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        style={styles.deleteButton}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {events.length === 0 && (
                  <div style={styles.emptyStateCard}>
                    <div style={styles.emptyStateIcon}>🎯</div>
                    <div style={styles.emptyStateTitle}>No events created yet</div>
                    <div style={styles.emptyStateSubtitle}>Create your first event to start building community</div>
                    <button
                      onClick={() => setShowEventModal(true)}
                      style={styles.emptyStateButton}
                    >
                      Create First Event
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div style={styles.tabContent}>
              <div style={styles.applicationTabs}>
                {/* Job Applications Section */}
                <div style={styles.applicationSection}>
                  <div style={styles.applicationSectionHeader}>
                    <h3 style={styles.sectionTitle}>Job Applications</h3>
                    <select
                      value={selectedJobId || ''}
                      onChange={(e) => {
                        const jobId = e.target.value ? parseInt(e.target.value) : null;
                        setSelectedJobId(jobId);
                        if (jobId) {
                          fetchJobApplications(jobId);
                        } else {
                          setJobApplications([]);
                        }
                      }}
                      style={styles.applicationSelect}
                    >
                      <option value="">Select a job to view applications</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedJobId && (
                    <div style={styles.applicationsContainer}>
                      <div style={styles.applicationsHeader}>
                        <h4 style={styles.applicationsTitle}>
                          Applications for: {jobs.find(j => j.id === selectedJobId)?.title}
                        </h4>
                        <button
                          onClick={() => downloadJobAcceptedStudentsPdf(
                            selectedJobId, 
                            jobs.find(j => j.id === selectedJobId)?.title || 'Job'
                          )}
                          disabled={loading}
                          style={styles.downloadButton}
                        >
                          {loading ? '⏳ Generating...' : '📄 Download PDF'}
                        </button>
                      </div>

                      <div style={styles.applicationsGrid}>
                        {jobApplications.map(application => (
                          <div key={application.id} style={styles.applicationCard}>
                            <div style={styles.applicationHeader}>
                              <div style={styles.studentInfo}>
                                <div style={styles.studentAvatar}>
                                  {application.student_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={styles.studentName}>{application.student_name}</div>
                                  <div style={styles.studentEmail}>{application.student_email}</div>
                                  <div style={styles.studentCollege}>{application.college_name || 'N/A'}</div>
                                </div>
                              </div>
                              <div style={{
                                ...styles.statusBadge,
                                ...styles[getStatusBadgeClass(application.status)]
                              }}>
                                {application.status}
                              </div>
                            </div>
                            
                            {application.cover_letter && (
                              <div style={styles.coverLetter}>
                                <strong>Cover Letter:</strong>
                                <p>{application.cover_letter}</p>
                              </div>
                            )}
                            
                            <div style={styles.applicationMeta}>
                              Applied: {new Date(application.applied_at).toLocaleDateString()}
                            </div>
                            
                            {application.status === 'pending' && (
                              <div style={styles.applicationActions}>
                                <button
                                  onClick={() => updateApplicationStatus(application.id, 'accepted', 'job')}
                                  style={styles.acceptButton}
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(application.id, 'rejected', 'job')}
                                  style={styles.rejectButton}
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {jobApplications.length === 0 && (
                          <div style={styles.emptyApplications}>
                            <div style={styles.emptyStateIcon}>📭</div>
                            <div style={styles.emptyStateText}>No applications yet</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Applications Section */}
                <div style={styles.applicationSection}>
                  <div style={styles.applicationSectionHeader}>
                    <h3 style={styles.sectionTitle}>Event Registrations</h3>
                    <select
                      value={selectedEventId || ''}
                      onChange={(e) => {
                        const eventId = e.target.value ? parseInt(e.target.value) : null;
                        setSelectedEventId(eventId);
                        if (eventId) {
                          fetchEventApplications(eventId);
                        } else {
                          setEventApplications([]);
                        }
                      }}
                      style={styles.applicationSelect}
                    >
                      <option value="">Select an event to view registrations</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEventId && (
                    <div style={styles.applicationsContainer}>
                      <div style={styles.applicationsHeader}>
                        <h4 style={styles.applicationsTitle}>
                          Registrations for: {events.find(e => e.id === selectedEventId)?.title}
                        </h4>
                        <button
                          onClick={() => downloadEventAcceptedStudentsPdf(
                            selectedEventId, 
                            events.find(e => e.id === selectedEventId)?.title || 'Event'
                          )}
                          disabled={loading}
                          style={styles.downloadButton}
                        >
                          {loading ? '⏳ Generating...' : '📄 Download PDF'}
                        </button>
                      </div>

                      <div style={styles.applicationsGrid}>
                        {eventApplications.map(application => (
                          <div key={application.id} style={styles.applicationCard}>
                            <div style={styles.applicationHeader}>
                              <div style={styles.studentInfo}>
                                <div style={styles.studentAvatar}>
                                  {application.student_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div style={styles.studentName}>{application.student_name}</div>
                                  <div style={styles.studentEmail}>{application.student_email}</div>
                                  <div style={styles.studentCollege}>{application.college_name || 'N/A'}</div>
                                </div>
                              </div>
                              <div style={{
                                ...styles.statusBadge,
                                ...styles[getStatusBadgeClass(application.status)]
                              }}>
                                {application.status}
                              </div>
                            </div>
                            
                            {application.message && (
                              <div style={styles.coverLetter}>
                                <strong>Message:</strong>
                                <p>{application.message}</p>
                              </div>
                            )}
                            
                            <div style={styles.applicationMeta}>
                              Registered: {new Date(application.applied_at).toLocaleDateString()}
                            </div>
                            
                            {application.status === 'pending' && (
                              <div style={styles.applicationActions}>
                                <button
                                  onClick={() => updateApplicationStatus(application.id, 'accepted', 'event')}
                                  style={styles.acceptButton}
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={() => updateApplicationStatus(application.id, 'rejected', 'event')}
                                  style={styles.rejectButton}
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {eventApplications.length === 0 && (
                          <div style={styles.emptyApplications}>
                            <div style={styles.emptyStateIcon}>📭</div>
                            <div style={styles.emptyStateText}>No registrations yet</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job Modal */}
      {showJobModal && (
        <div style={styles.modalOverlay} onClick={() => setShowJobModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingJob ? 'Edit Job' : 'Create New Job'}
              </h3>
              <button 
                onClick={() => setShowJobModal(false)}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleJobSubmit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Job Title</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                  style={styles.formInput}
                  placeholder="Enter job title"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <textarea
                  required
                  rows={4}
                  value={jobForm.description}
                  onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                  style={styles.formTextarea}
                  placeholder="Describe the job role and responsibilities"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Requirements</label>
                <textarea
                  rows={3}
                  value={jobForm.requirements}
                  onChange={(e) => setJobForm({...jobForm, requirements: e.target.value})}
                  style={styles.formTextarea}
                  placeholder="List job requirements and qualifications"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                    style={styles.formInput}
                    placeholder="Job location"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Salary Range</label>
                  <input
                    type="text"
                    placeholder="e.g., ₹15,000 - ₹25,000"
                    value={jobForm.salary_range}
                    onChange={(e) => setJobForm({...jobForm, salary_range: e.target.value})}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Job Type</label>
                  <select
                    value={jobForm.job_type}
                    onChange={(e) => setJobForm({...jobForm, job_type: e.target.value})}
                    style={styles.formSelect}
                  >
                    <option value="full-time">Full Time</option>
                    <option value="part-time">Part Time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Status</label>
                  <select
                    value={jobForm.status}
                    onChange={(e) => setJobForm({...jobForm, status: e.target.value})}
                    style={styles.formSelect}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowJobModal(false);
                    setEditingJob(null);
                    resetJobForm();
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                >
                  {editingJob ? 'Update Job' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEventModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h3>
              <button 
                onClick={() => setShowEventModal(false)}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEventSubmit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Event Title</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                  style={styles.formInput}
                  placeholder="Enter event title"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description</label>
                <textarea
                  required
                  rows={4}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                  style={styles.formTextarea}
                  placeholder="Describe the event details and agenda"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Event Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({...eventForm, event_date: e.target.value})}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Location</label>
                  <input
                    type="text"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    style={styles.formInput}
                    placeholder="Event location"
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Max Participants</label>
                  <input
                    type="number"
                    min="1"
                    value={eventForm.max_participants}
                    onChange={(e) => setEventForm({...eventForm, max_participants: e.target.value})}
                    style={styles.formInput}
                    placeholder="Maximum number of participants"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Registration Deadline</label>
                  <input
                    type="date"
                    value={eventForm.registration_deadline}
                    onChange={(e) => setEventForm({...eventForm, registration_deadline: e.target.value})}
                    style={styles.formInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Status</label>
                <select
                  value={eventForm.status}
                  onChange={(e) => setEventForm({...eventForm, status: e.target.value})}
                  style={styles.formSelect}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                    resetEventForm();
                  }}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
const ownerDashboardCSS = `
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
    40%, 43% { transform: translateY(-5px); }
    70% { transform: translateY(-2px); }
    90% { transform: translateY(-1px); }
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
    marginBottom: '2px',
  },

  organizationName: {
    fontSize: '0.75rem',
    opacity: 0.7,
    fontStyle: 'italic',
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

  statCardPrimary: { borderLeft: '4px solid #667eea' },
  statCardSuccess: { borderLeft: '4px solid #10b981' },
  statCardWarning: { borderLeft: '4px solid #f59e0b' },
  statCardInfo: { borderLeft: '4px solid #06b6d4' },

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

  statSubLabel: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: '2px',
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

  quickActionSubtext: {
    fontSize: '0.875rem',
    opacity: 0.9,
  },

  recentSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },

  recentColumn: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },

  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },

  recentItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },

  recentItemContent: {
    flex: 1,
  },

  recentItemTitle: {
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: '4px',
  },

  recentItemMeta: {
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

  statusActive: { backgroundColor: '#d1fae5', color: '#065f46' },
  statusInactive: { backgroundColor: '#f3f4f6', color: '#374151' },
  statusClosed: { backgroundColor: '#fee2e2', color: '#dc2626' },
  statusPending: { backgroundColor: '#fef3c7', color: '#d97706' },
  statusAccepted: { backgroundColor: '#d1fae5', color: '#065f46' },
  statusRejected: { backgroundColor: '#fee2e2', color: '#dc2626' },

  emptyState: {
    textAlign: 'center',
    padding: '2rem',
    color: '#64748b',
  },

  emptyStateIcon: {
    fontSize: '3rem',
    marginBottom: '0.5rem',
    opacity: 0.5,
  },

  emptyStateText: {
    fontSize: '0.875rem',
  },

  tabContent: {
    animation: 'fadeInUp 0.6s ease-out',
  },

  tabHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },

  tabHeaderLeft: {
    flex: 1,
  },

  tabTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 0.5rem 0',
  },

  tabSubtitle: {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0,
  },

  createButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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

  itemCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
  },

  itemCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },

  itemTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 0.25rem 0',
  },

  itemLocation: {
    fontSize: '0.875rem',
    color: '#667eea',
    fontWeight: '500',
    margin: 0,
  },

  itemDescription: {
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: 1.6,
    marginBottom: '1rem',
  },

  itemMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '1rem',
    paddingTop: '1rem',
    borderTop: '1px solid #f1f5f9',
  },

  itemActions: {
    display: 'flex',
    gap: '8px',
  },

  editButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  deleteButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  emptyStateCard: {
    gridColumn: '1 / -1',
    backgroundColor: 'white',
    padding: '4rem 2rem',
    borderRadius: '12px',
    textAlign: 'center',
    border: '2px dashed #e2e8f0',
  },

  emptyStateTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '0.5rem',
  },

  emptyStateSubtitle: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '2rem',
  },

  emptyStateButton: {
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

  applicationTabs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },

  applicationSection: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },

  applicationSectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },

  applicationSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.875rem',
    minWidth: '250px',
    backgroundColor: 'white',
  },

  applicationsContainer: {
    padding: '2rem',
  },

  applicationsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },

  applicationsTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
  },

  downloadButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  applicationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1rem',
  },

  applicationCard: {
    padding: '1.5rem',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
  },

  applicationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },

  studentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },

  studentAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: '600',
  },

  studentName: {
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '2px',
  },

  studentEmail: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '2px',
  },

  studentCollege: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },

  coverLetter: {
    marginBottom: '1rem',
    padding: '1rem',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },

  applicationMeta: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '1rem',
  },

  applicationActions: {
    display: 'flex',
    gap: '8px',
  },

  acceptButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  rejectButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  emptyApplications: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '3rem',
    color: '#64748b',
  },

  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '2rem',
  },

  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    animation: 'fadeInUp 0.3s ease-out',
  },

  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '2rem 2rem 1rem 2rem',
    borderBottom: '1px solid #e2e8f0',
  },

  modalTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: 0,
  },

  modalCloseButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },

  modalForm: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  formLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#374151',
  },

  formInput: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    outline: 'none',
  },

  formTextarea: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    resize: 'vertical',
    minHeight: '80px',
  },

  formSelect: {
    padding: '12px',
    borderRadius: '8px',
    border: '2px solid #e5e7eb',
    fontSize: '0.875rem',
    transition: 'all 0.3s ease',
    outline: 'none',
    backgroundColor: 'white',
    cursor: 'pointer',
  },

  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },

  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    paddingTop: '1rem',
    borderTop: '1px solid #e2e8f0',
  },

  cancelButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  submitButton: {
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

export default OwnerDashboard;
