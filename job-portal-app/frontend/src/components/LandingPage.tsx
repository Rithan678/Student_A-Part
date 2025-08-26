import React, { useState, useEffect } from 'react';

interface LandingPageProps {
  onNavigateToAuth: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  const features = [
    { icon: "bi-book-half", label: "Study First", gradientClass: "feature-icon-study" },
    { icon: "bi-briefcase", label: "Work Smart", gradientClass: "feature-icon-work" },
    { icon: "bi-stars", label: "Grow Together", gradientClass: "feature-icon-growth" }
  ];

  const stats = [
    { number: "95%", label: "Pass Rate" },
    { number: "20hrs", label: "Avg. Weekly Work" },
    { number: "₹12K", label: "Avg. Monthly Earnings" }
  ];

  const demoCredentials = [
    { role: "Student", email: "student@test.com", password: "password123" },
    { role: "Owner", email: "owner@test.com", password: "password123" },
    { role: "Admin", email: "admin@jobportal.com", password: "admin123" }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <h4 style={styles.loadingText}>Loading Study A-Part...</h4>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.landingContainer}>
      {/* Add global styles */}
      <style>{globalCSS}</style>
      
      {/* Navigation */}
      <nav style={styles.landingNav}>
        <div style={styles.navBrand}>
          <i className="bi bi-mortarboard-fill" style={styles.navIcon}></i>
          <span>Study A-Part</span>
        </div>
        <div style={styles.navLinks}>
          <a href="#about" style={styles.navLink}>About</a>
          <a href="#how-it-works" style={styles.navLink}>How It Works</a>
          <button onClick={onNavigateToAuth} style={styles.signInBtn}>Sign in</button>
          <button onClick={onNavigateToAuth} style={styles.getDemoBtn}>Get started</button>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <div style={styles.heroSection}>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>
              Study
              <span style={styles.textGradient}>A-Part</span>
              <span style={styles.subtitle}>Where Learning Meets Earning</span>
            </h1>
            
            <p style={styles.heroDescription}>
              Your all-in-one platform for blending academic success with rewarding part-time work. 
              Study smart, work flexible, succeed together.
            </p>

            <div style={styles.heroHighlights}>
              <div style={styles.highlightItem}>
                <i className="bi bi-book-half" style={styles.highlightIcon}></i>
                <span>Prioritize Studies</span>
              </div>
              <div style={styles.highlightItem}>
                <i className="bi bi-briefcase" style={styles.highlightIcon}></i>
                <span>Work Part-Time</span>
              </div>
              <div style={styles.highlightItem}>
                <i className="bi bi-arrow-left-right" style={styles.highlightIcon}></i>
                <span>Perfect Balance</span>
              </div>
            </div>

            <button onClick={onNavigateToAuth} style={styles.ctaButton}>
              Find Your Perfect Job
              <i className="bi bi-arrow-right" style={styles.arrowIcon}></i>
            </button>
          </div>

          {/* Hero Visuals */}
          <div style={styles.heroVisuals}>
            <div style={{...styles.featureCard, ...styles.weeklyBlend}}>
              <h3 style={styles.cardTitle}>Your Perfect Week</h3>
              <div style={styles.blendCalendar}>
                <div style={{...styles.timeBlock, ...styles.studyTimeBlock}}>
                  <i className="bi bi-book text-primary" style={{...styles.timeBlockIcon, ...styles.studyIcon}}></i>
                  <div style={styles.blockContent}>
                    <span style={styles.blockTitle}>Core Study Hours</span>
                    <small style={styles.blockSubtitle}>Mon-Fri: 9:00 - 14:00</small>
                    <div style={{...styles.tag, ...styles.studyTag}}>Academic Focus</div>
                  </div>
                </div>
                <div style={{...styles.timeBlock, ...styles.workTimeBlock}}>
                  <i className="bi bi-briefcase text-success" style={{...styles.timeBlockIcon, ...styles.workIcon}}></i>
                  <div style={styles.blockContent}>
                    <span style={styles.blockTitle}>Flexible Work Slots</span>
                    <small style={styles.blockSubtitle}>Choose: 15-20 hrs/week</small>
                    <div style={{...styles.tag, ...styles.workTag}}>Income Growth</div>
                  </div>
                </div>
                <div style={{...styles.timeBlock, ...styles.balanceTimeBlock}}>
                  <i className="bi bi-stars text-warning" style={{...styles.timeBlockIcon, ...styles.balanceIcon}}></i>
                  <div style={styles.blockContent}>
                    <span style={styles.blockTitle}>Study & Work Balance</span>
                    <small style={styles.blockSubtitle}>Your Success Formula</small>
                    <div style={styles.progressRings}>
                      <div style={{...styles.ring, ...styles.studyRing}}>
                        60%<small style={styles.ringSmall}>Study</small>
                      </div>
                      <div style={{...styles.ring, ...styles.workRing}}>
                        40%<small style={styles.ringSmall}>Work</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{...styles.featureCard, ...styles.successMetrics}}>
              <h3 style={styles.cardTitle}>Success Blueprint</h3>
              <div style={styles.metricsGrid}>
                <div style={styles.metric}>
                  <i className="bi bi-mortarboard-fill" style={styles.metricIcon}></i>
                  <span style={styles.metricValue}>3.8</span>
                  <small style={styles.metricLabel}>Avg. GPA</small>
                </div>
                <div style={styles.metric}>
                  <i className="bi bi-wallet2" style={styles.metricIcon}></i>
                  <span style={styles.metricValue}>₹12K</span>
                  <small style={styles.metricLabel}>Monthly</small>
                </div>
                <div style={styles.metric}>
                  <i className="bi bi-graph-up-arrow" style={styles.metricIcon}></i>
                  <span style={styles.metricValue}>90%</span>
                  <small style={styles.metricLabel}>Success Rate</small>
                </div>
              </div>
            </div>

            <div style={styles.stickyNote}>
              <p style={styles.stickyText}>
                "Study A-Part helped me maintain a 3.8 GPA while earning for my expenses!"
              </p>
              <div style={styles.studentQuote}>
                <i className="bi bi-person-circle" style={styles.quoteIcon}></i>
                <small>- Rahul M, Engineering Student</small>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div style={styles.featuresSection}>
          <div style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <div style={styles.featureItem} key={index}>
                <div style={{...styles.featureIcon, ...getFeatureIconStyle(feature.gradientClass)}}>
                  <i className={`bi ${feature.icon} text-white`}></i>
                </div>
                <small style={styles.featureLabel}>{feature.label}</small>
              </div>
            ))}
          </div>

          <div style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <div style={styles.statItem} key={index}>
                <div style={styles.statNumber}>{stat.number}</div>
                <small style={styles.statLabel}>{stat.label}</small>
              </div>
            ))}
          </div>

          <div style={styles.demoSection}>
            <details style={styles.demoDetails}>
              <summary style={styles.demoSummary}>
                <i className="bi bi-info-circle" style={styles.infoIcon}></i>
                Quick Demo Access
              </summary>
              <div style={styles.demoContent}>
                {demoCredentials.map((cred, index) => (
                  <div key={index} style={styles.demoCredItem}>
                    <strong>{cred.role}:</strong> {cred.email} / {cred.password}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>

        {/* Integration Section */}
        <div style={styles.integrationSection}>
          <h3 style={styles.integrationTitle}>Popular Integrations</h3>
          <div style={styles.integrationIcons}>
            <i className="bi bi-google text-danger h1" style={styles.integrationIcon}></i>
            <i className="bi bi-microsoft text-primary h1" style={styles.integrationIcon}></i>
            <i className="bi bi-calendar-check text-success h1" style={styles.integrationIcon}></i>
          </div>
        </div>
      </main>
    </div>
  );
};

// Helper function for feature icon styles
const getFeatureIconStyle = (gradientClass: string) => {
  switch (gradientClass) {
    case 'feature-icon-study':
      return { background: 'linear-gradient(45deg, #4f46e5, #7c3aed)' };
    case 'feature-icon-work':
      return { background: 'linear-gradient(45deg, #f59e0b, #d97706)' };
    case 'feature-icon-growth':
      return { background: 'linear-gradient(45deg, #10b981, #059669)' };
    default:
      return { background: 'linear-gradient(45deg, #4f46e5, #7c3aed)' };
  }
};

// Global CSS for animations and Bootstrap icons
const globalCSS = `
  @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css');
  
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  }
`;

// Styles object
const styles: { [key: string]: React.CSSProperties } = {
  landingContainer: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#ffffff',
    position: 'relative',
    overflowX: 'hidden',
    padding: 0,
    margin: 0,
  },

  loadingScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed, #f59e0b)',
    backgroundSize: '300% 300%',
    animation: 'gradientShift 3s ease infinite',
  },

  loadingContent: {
    textAlign: 'center',
    color: 'white',
  },

  spinner: {
    width: '3rem',
    height: '3rem',
    border: '0.25rem solid rgba(255,255,255,0.3)',
    borderTop: '0.25rem solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1rem',
  },

  loadingText: {
    fontSize: '1.5rem',
    fontWeight: '500',
    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    margin: 0,
  },

  landingNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem 2rem',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    zIndex: 1000,
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
  },

  navBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1a1a1a',
  },

  navIcon: {
    color: '#4f46e5',
  },

  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
  },

  navLink: {
    textDecoration: 'none',
    color: '#4b5563',
    fontWeight: '500',
    transition: 'color 0.2s',
  },

  signInBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    background: 'white',
    color: '#4b5563',
    cursor: 'pointer',
    textDecoration: 'none',
  },

  getDemoBtn: {
    padding: '0.5rem 1rem',
    background: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    textDecoration: 'none',
  },

  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4rem',
    maxWidth: '1200px',
    margin: '8rem auto 4rem',
    padding: '0 2rem',
  },

  heroContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '2rem',
  },

  heroTitle: {
    fontSize: '5rem',
    fontWeight: '800',
    lineHeight: 1.1,
    color: '#1a1a1a',
    marginBottom: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  textGradient: {
    background: 'linear-gradient(90deg, #4f46e5 0%, #00a870 50%, #f59e0b 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontSize: '6rem',
    fontWeight: '900',
    margin: '-0.5rem 0',
  },

  subtitle: {
    fontSize: '1.5rem',
    color: '#6b7280',
    fontWeight: '500',
    marginTop: '0.5rem',
  },

  heroDescription: {
    fontSize: '1.25rem',
    color: '#4b5563',
    lineHeight: 1.6,
    maxWidth: '600px',
    margin: '2rem auto',
    textAlign: 'center',
  },

  heroHighlights: {
    display: 'flex',
    gap: '2rem',
    marginBottom: '2rem',
  },

  highlightItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#4b5563',
  },

  highlightIcon: {
    color: '#00a870',
    fontSize: '1.25rem',
  },

  ctaButton: {
    background: 'linear-gradient(90deg, #4f46e5 0%, #f59e0b 100%)',
    color: 'white',
    fontWeight: '600',
    fontSize: '18px',
    padding: '16px 40px',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(79,70,229,0.25)',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
  },

  arrowIcon: {
    marginLeft: '0.5rem',
  },

  heroVisuals: {
    position: 'relative',
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: 'repeat(6, 1fr)',
  },

  featureCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '2rem',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    gridColumn: 'span 3',
  },

  weeklyBlend: {
    gridColumn: '2 / span 4',
  },

  successMetrics: {
    gridColumn: '4 / span 3',
    marginTop: '2rem',
  },

  cardTitle: {
    margin: '0 0 1.5rem 0',
    color: '#1a1a1a',
    fontSize: '1.25rem',
    fontWeight: '600',
  },

  blendCalendar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    marginTop: '1.5rem',
  },

  timeBlock: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    padding: '1.5rem',
    borderRadius: '12px',
    background: '#f8fafc',
    transition: 'transform 0.2s',
  },

  studyTimeBlock: {
    borderLeft: '4px solid #4f46e5',
  },

  workTimeBlock: {
    borderLeft: '4px solid #00a870',
  },

  balanceTimeBlock: {
    borderLeft: '4px solid #f59e0b',
  },

  timeBlockIcon: {
    fontSize: '1.5rem',
    padding: '0.5rem',
    borderRadius: '8px',
  },

  studyIcon: {
    background: 'rgba(79, 70, 229, 0.1)',
    color: '#4f46e5',
  },

  workIcon: {
    background: 'rgba(0, 168, 112, 0.1)',
    color: '#00a870',
  },

  balanceIcon: {
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#f59e0b',
  },

  blockContent: {
    flex: 1,
  },

  blockTitle: {
    fontWeight: '500',
    display: 'block',
    margin: 0,
  },

  blockSubtitle: {
    color: '#6b7280',
    display: 'block',
    marginTop: '0.25rem',
  },

  tag: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    marginTop: '0.5rem',
  },

  studyTag: {
    background: 'rgba(79, 70, 229, 0.1)',
    color: '#4f46e5',
  },

  workTag: {
    background: 'rgba(0, 168, 112, 0.1)',
    color: '#00a870',
  },

  progressRings: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.5rem',
  },

  ring: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    fontSize: '0.875rem',
    lineHeight: 1,
  },

  studyRing: {
    background: 'rgba(79, 70, 229, 0.1)',
    color: '#4f46e5',
  },

  workRing: {
    background: 'rgba(0, 168, 112, 0.1)',
    color: '#00a870',
  },

  ringSmall: {
    fontSize: '0.625rem',
    fontWeight: 'normal',
    opacity: 0.7,
  },

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1rem',
    textAlign: 'center',
  },

  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },

  metricIcon: {
    fontSize: '2rem',
  },

  metricValue: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#00a870',
  },

  metricLabel: {
    color: '#6b7280',
    fontSize: '0.75rem',
  },

  stickyNote: {
    position: 'absolute',
    top: '-2rem',
    left: '1rem',
    background: '#fef3c7',
    padding: '1rem',
    borderRadius: '8px',
    transform: 'rotate(-5deg)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    width: '200px',
  },

  stickyText: {
    fontSize: '0.875rem',
    color: '#92400e',
    margin: '0 0 0.5rem 0',
  },

  studentQuote: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  quoteIcon: {
    fontSize: '1rem',
    color: '#92400e',
  },

  featuresSection: {
    textAlign: 'center',
    padding: '4rem 2rem',
  },

  featuresContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    marginBottom: '2rem',
  },

  featureItem: {
    textAlign: 'center',
  },

  featureIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 0.5rem',
    fontSize: '1.5rem',
  },

  featureLabel: {
    color: '#64748b',
    fontSize: '0.875rem',
  },

  statsContainer: {
    margin: '2rem 0',
    padding: '2rem 0',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'center',
    gap: '2rem',
    textAlign: 'center',
  },

  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
  },

  statNumber: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
    color: '#4f46e5',
  },

  statLabel: {
    color: '#64748b',
    fontSize: '0.875rem',
  },

  demoSection: {
    marginTop: '2rem',
  },

  demoDetails: {
    color: '#64748b',
    fontSize: '14px',
  },

  demoSummary: {
    cursor: 'pointer',
    padding: '8px',
    listStyle: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  infoIcon: {
    marginRight: '0.25rem',
  },

  demoContent: {
    marginTop: '8px',
    padding: '8px',
    background: '#f8fafc',
    borderRadius: '8px',
    fontSize: '12px',
  },

  demoCredItem: {
    marginBottom: '4px',
  },

  integrationSection: {
    textAlign: 'center',
    padding: '4rem 2rem',
    background: '#f9fafb',
    marginTop: '4rem',
  },

  integrationTitle: {
    color: '#4b5563',
    fontWeight: '600',
    marginBottom: '2rem',
  },

  integrationIcons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '3rem',
    marginTop: '2rem',
    alignItems: 'center',
  },

  integrationIcon: {
    opacity: 0.7,
    transition: 'opacity 0.2s',
    fontSize: '3rem',
  },
};

export default LandingPage;
