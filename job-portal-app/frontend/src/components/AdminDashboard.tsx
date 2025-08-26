import React, { useState, useEffect } from 'react';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

interface PendingStudent {
  id: number;
  name: string;
  email: string;
  date_of_birth: string;
  college_id: number;
  student_college_id: string;
  college_name: string;
  pdf_path: string;
  created_at: string;
}

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verifications' | 'analytics'>('dashboard');
  const [pendingStudents, setPendingStudents] = useState<PendingStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<PendingStudent | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/pending-students`);
      if (response.ok) {
        const data = await response.json();
        setPendingStudents(data);
      } else {
        setError('Failed to fetch pending students');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error fetching pending students:', error);
      setError('Failed to fetch pending students');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveStudent = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to approve this student?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/approve-student/${studentId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Student approved successfully!');
        fetchPendingStudents();
        setShowModal(false);
        setSelectedStudent(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to approve student');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error approving student:', error);
      setError('Failed to approve student');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectStudent = async (studentId: number) => {
    if (!window.confirm('Are you sure you want to reject this student? This action cannot be undone.')) return;
    
    try {
      setLoading(true);
  const response = await fetch(`${API_BASE_URL}/api/admin/reject-student/${studentId}`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Student rejected successfully!');
        fetchPendingStudents();
        setShowModal(false);
        setSelectedStudent(null);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject student');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Error rejecting student:', error);
      setError('Failed to reject student');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const openStudentModal = (student: PendingStudent) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  // Open PDF: request backend which returns either a signed URL ({ url }) or serves the PDF directly.
  const openPdf = async (pdfPath: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}${API_ENDPOINTS.getPdf}/${encodeURIComponent(pdfPath)}`);
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        setError(data?.error || 'Failed to open document');
        setTimeout(() => setError(''), 3000);
        return;
      }

      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        // Likely { url }
        const data = await resp.json();
        if (data && data.url) {
          window.open(data.url, '_blank');
          return;
        }
      }

      // Fallback: server returned PDF directly — open blob
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke after some time
      setTimeout(() => window.URL.revokeObjectURL(url), 60 * 1000);
    } catch (err) {
      console.error('Error opening PDF:', err);
      setError('Failed to open document');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getStats = () => {
    return {
      totalPending: pendingStudents.length,
      todayPending: pendingStudents.filter(s => 
        new Date(s.created_at).toDateString() === new Date().toDateString()
      ).length,
      thisWeekPending: pendingStudents.filter(s => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(s.created_at) >= weekAgo;
      }).length
    };
  };

  const stats = getStats();

  return (
    <div style={styles.container}>
      <style>{adminDashboardCSS}</style>
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🎓</span>
            <span style={styles.logoText}>Study A-Part</span>
          </div>
          <div style={styles.adminProfile}>
            <div style={styles.adminAvatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.adminInfo}>
              <div style={styles.adminName}>{user.name}</div>
              <div style={styles.adminRole}>System Administrator</div>
            </div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: '📊' },
            { key: 'verifications', label: 'Student Verifications', icon: '🔍' },
            { key: 'analytics', label: 'Analytics', icon: '📈' }
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
              {activeTab === 'dashboard' && 'Admin Dashboard'}
              {activeTab === 'verifications' && 'Student Verifications'}
              {activeTab === 'analytics' && 'System Analytics'}
            </h1>
            <p style={styles.headerSubtitle}>
              {activeTab === 'dashboard' && 'System overview and management tools'}
              {activeTab === 'verifications' && 'Review and approve student registrations'}
              {activeTab === 'analytics' && 'Platform usage statistics and insights'}
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

        {/* Content */}
        <div style={styles.content}>
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <div style={styles.dashboardContent}>
              {/* Stats Cards */}
              <div style={styles.statsGrid}>
                <div style={{...styles.statCard, ...styles.statCardPrimary}}>
                  <div style={styles.statIcon}>👥</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.totalPending}</div>
                    <div style={styles.statLabel}>Pending Verifications</div>
                    <div style={styles.statSubLabel}>Students awaiting approval</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardWarning}}>
                  <div style={styles.statIcon}>📅</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.todayPending}</div>
                    <div style={styles.statLabel}>Today's Registrations</div>
                    <div style={styles.statSubLabel}>New students today</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardInfo}}>
                  <div style={styles.statIcon}>📊</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>{stats.thisWeekPending}</div>
                    <div style={styles.statLabel}>This Week</div>
                    <div style={styles.statSubLabel}>Weekly registrations</div>
                  </div>
                </div>
                
                <div style={{...styles.statCard, ...styles.statCardSuccess}}>
                  <div style={styles.statIcon}>⚡</div>
                  <div style={styles.statContent}>
                    <div style={styles.statNumber}>
                      {stats.totalPending > 0 ? Math.round((stats.todayPending / stats.totalPending) * 100) : 0}%
                    </div>
                    <div style={styles.statLabel}>Activity Rate</div>
                    <div style={styles.statSubLabel}>Daily activity</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div style={styles.quickActionsSection}>
                <h3 style={styles.sectionTitle}>Quick Actions</h3>
                <div style={styles.quickActions}>
                  <button 
                    onClick={() => setActiveTab('verifications')}
                    style={{...styles.quickActionCard, ...styles.quickActionPrimary}}
                  >
                    <div style={styles.quickActionIcon}>🔍</div>
                    <div style={styles.quickActionText}>Review Students</div>
                    <div style={styles.quickActionCount}>{stats.totalPending} pending</div>
                  </button>
                  
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    style={{...styles.quickActionCard, ...styles.quickActionSecondary}}
                  >
                    <div style={styles.quickActionIcon}>📈</div>
                    <div style={styles.quickActionText}>View Analytics</div>
                    <div style={styles.quickActionCount}>System insights</div>
                  </button>
                  
                  <button 
                    onClick={() => fetchPendingStudents()}
                    style={{...styles.quickActionCard, ...styles.quickActionAccent}}
                  >
                    <div style={styles.quickActionIcon}>🔄</div>
                    <div style={styles.quickActionText}>Refresh Data</div>
                    <div style={styles.quickActionCount}>Update now</div>
                  </button>
                </div>
              </div>

              {/* Recent Registrations */}
              <div style={styles.recentSection}>
                <h3 style={styles.sectionTitle}>Recent Registrations</h3>
                <div style={styles.recentList}>
                  {pendingStudents.slice(0, 5).map(student => (
                    <div key={student.id} style={styles.recentItem}>
                      <div style={styles.studentCard}>
                        <div style={styles.studentAvatar}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={styles.studentInfo}>
                          <div style={styles.studentName}>{student.name}</div>
                          <div style={styles.studentEmail}>{student.email}</div>
                          <div style={styles.studentMeta}>
                            {student.college_name} • {new Date(student.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button
                          onClick={() => openStudentModal(student)}
                          style={styles.reviewButton}
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {pendingStudents.length === 0 && (
                    <div style={styles.emptyState}>
                      <div style={styles.emptyStateIcon}>✅</div>
                      <div style={styles.emptyStateTitle}>All caught up!</div>
                      <div style={styles.emptyStateSubtitle}>No pending verifications at the moment</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Verifications Tab */}
          {activeTab === 'verifications' && (
            <div style={styles.tabContent}>
              <div style={styles.verificationsHeader}>
                <div>
                  <h3 style={styles.tabTitle}>Student Verifications ({pendingStudents.length})</h3>
                  <p style={styles.tabSubtitle}>Review and approve student registrations</p>
                </div>
                <button
                  onClick={fetchPendingStudents}
                  disabled={loading}
                  style={styles.refreshButton}
                >
                  {loading ? '⏳ Loading...' : '🔄 Refresh'}
                </button>
              </div>

              {loading ? (
                <div style={styles.loadingState}>
                  <div style={styles.loadingSpinner}></div>
                  <p>Loading students...</p>
                </div>
              ) : (
                <div style={styles.verificationsGrid}>
                  {pendingStudents.map(student => (
                    <div key={student.id} style={styles.verificationCard}>
                      <div style={styles.verificationHeader}>
                        <div style={styles.studentInfoSection}>
                          <div style={styles.studentAvatar}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={styles.studentName}>{student.name}</div>
                            <div style={styles.studentEmail}>{student.email}</div>
                          </div>
                        </div>
                        <div style={styles.pendingBadge}>Pending</div>
                      </div>

                      <div style={styles.verificationDetails}>
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>Student ID:</span>
                          <span style={styles.detailValue}>{student.student_college_id}</span>
                        </div>
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>College:</span>
                          <span style={styles.detailValue}>{student.college_name}</span>
                        </div>
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>Date of Birth:</span>
                          <span style={styles.detailValue}>
                            {new Date(student.date_of_birth).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={styles.detailRow}>
                          <span style={styles.detailLabel}>Registered:</span>
                          <span style={styles.detailValue}>
                            {new Date(student.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div style={styles.verificationActions}>
                        <button
                          onClick={() => openStudentModal(student)}
                          style={styles.viewDetailsButton}
                        >
                          📄 View Details
                        </button>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => handleApproveStudent(student.id)}
                            style={styles.approveButton}
                            disabled={loading}
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleRejectStudent(student.id)}
                            style={styles.rejectButton}
                            disabled={loading}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {pendingStudents.length === 0 && !loading && (
                    <div style={styles.emptyVerifications}>
                      <div style={styles.emptyStateIcon}>✅</div>
                      <div style={styles.emptyStateTitle}>No pending verifications</div>
                      <div style={styles.emptyStateSubtitle}>All students have been processed</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div style={styles.tabContent}>
              <div style={styles.analyticsContent}>
                <div style={styles.comingSoon}>
                  <div style={styles.comingSoonIcon}>📊</div>
                  <div style={styles.comingSoonTitle}>Analytics Coming Soon</div>
                  <div style={styles.comingSoonSubtitle}>
                    Detailed analytics and reporting features will be available in the next update
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {showModal && selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Student Verification Details</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={styles.modalCloseButton}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.studentDetailSection}>
                <div style={styles.studentDetailHeader}>
                  <div style={styles.studentAvatar}>
                    {selectedStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 style={styles.modalStudentName}>{selectedStudent.name}</h4>
                    <p style={styles.modalStudentEmail}>{selectedStudent.email}</p>
                  </div>
                </div>

                <div style={styles.studentDetails}>
                  <div style={styles.detailGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Student ID</span>
                      <span style={styles.detailValue}>{selectedStudent.student_college_id}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>College</span>
                      <span style={styles.detailValue}>{selectedStudent.college_name}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Date of Birth</span>
                      <span style={styles.detailValue}>
                        {new Date(selectedStudent.date_of_birth).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Registration Date</span>
                      <span style={styles.detailValue}>
                        {new Date(selectedStudent.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div style={styles.documentSection}>
                    <h5 style={styles.documentTitle}>College ID Document</h5>
                    <button
                      onClick={() => openPdf(selectedStudent.pdf_path)}
                      style={styles.viewDocumentButton}
                    >
                      📄 View PDF Document
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.modalCancelButton}
              >
                Close
              </button>
              <button
                onClick={() => handleRejectStudent(selectedStudent.id)}
                style={styles.modalRejectButton}
                disabled={loading}
              >
                Reject Student
              </button>
              <button
                onClick={() => handleApproveStudent(selectedStudent.id)}
                style={styles.modalApproveButton}
                disabled={loading}
              >
                Approve Student
              </button>
            </div>
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
const adminDashboardCSS = `
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

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
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

  adminProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '1rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
  },

  adminAvatar: {
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

  adminInfo: {
    flex: 1,
  },

  adminName: {
    fontWeight: '600',
    fontSize: '1rem',
    marginBottom: '2px',
  },

  adminRole: {
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

  quickActionCount: {
    fontSize: '0.875rem',
    opacity: 0.9,
  },

  recentSection: {
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
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },

  studentCard: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: '1rem',
  },

  studentAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    fontWeight: '600',
  },

  studentInfo: {
    flex: 1,
  },

  studentName: {
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '4px',
  },

  studentEmail: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '2px',
  },

  studentMeta: {
    fontSize: '0.75rem',
    color: '#9ca3af',
  },

  reviewButton: {
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

  verificationsHeader: {
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

  refreshButton: {
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

  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem',
    color: '#64748b',
  },

  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },

  verificationsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '1.5rem',
  },

  verificationCard: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
  },

  verificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },

  studentInfoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },

  pendingBadge: {
    padding: '4px 8px',
    backgroundColor: '#fef3c7',
    color: '#d97706',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '500',
  },

  verificationDetails: {
    marginBottom: '1.5rem',
  },

  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid #f1f5f9',
  },

  detailLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    fontWeight: '500',
  },

  detailValue: {
    fontSize: '0.875rem',
    color: '#1a202c',
    fontWeight: '500',
  },

  verificationActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },

  viewDetailsButton: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: 'white',
    color: '#374151',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  actionButtons: {
    display: 'flex',
    gap: '0.5rem',
  },

  approveButton: {
    flex: 1,
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

  rejectButton: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  emptyVerifications: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '4rem',
    color: '#64748b',
  },

  analyticsContent: {
    backgroundColor: 'white',
    padding: '4rem 2rem',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },

  comingSoon: {
    color: '#64748b',
  },

  comingSoonIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
    opacity: 0.5,
  },

  comingSoonTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#374151',
  },

  comingSoonSubtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    maxWidth: '500px',
    margin: '0 auto',
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

  modalContent: {
    padding: '2rem',
  },

  studentDetailSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  studentDetailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #e2e8f0',
  },

  modalStudentName: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 0.25rem 0',
  },

  modalStudentEmail: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0,
  },

  studentDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },

  detailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },

  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },

  documentSection: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },

  documentTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1a202c',
    margin: '0 0 0.75rem 0',
  },

  viewDocumentButton: {
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

  modalActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    padding: '2rem',
    borderTop: '1px solid #e2e8f0',
  },

  modalCancelButton: {
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

  modalRejectButton: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  modalApproveButton: {
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
};

export default AdminDashboard;
