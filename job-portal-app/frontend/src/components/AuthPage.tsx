import React, { useState, useEffect } from 'react';
import API_BASE_URL, { API_ENDPOINTS } from '../config/api';

interface College {
  id: number;
  name: string;
  location?: string;
}

interface AuthPageProps {
  onLogin: (user: any) => void;
  onBack?: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState<'student' | 'owner' | 'admin'>('student');
  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    collegeId: '',
    studentCollegeId: '',
    organizationName: '',
    location: '',
    collegeIdPdf: null as File | null
  });

  useEffect(() => {
    fetchColleges();
    setTimeout(() => setIsLoaded(true), 300);
  }, []);

  const fetchColleges = async () => {
    try {
      setLoadingColleges(true);
      const response = await fetch(`${API_BASE_URL}/api/colleges`);
      if (response.ok) {
        const data = await response.json();
        setColleges(data);
      } else {
        console.error('Failed to fetch colleges');
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    } finally {
      setLoadingColleges(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, collegeIdPdf: file }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isLogin) {
        await handleLogin();
      } else {
        await handleSignup();
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.login}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        userType: userType
      }),
    });

    const data = await response.json();
    if (response.ok) {
      setSuccess('Login successful!');
      setTimeout(() => onLogin(data.user), 1000);
    } else {
      setError(data.error || 'Login failed');
    }
  };

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('password', formData.password);
    submitData.append('userType', userType);

    if (userType === 'student') {
      if (!formData.dateOfBirth || !formData.collegeId || !formData.studentCollegeId || !formData.collegeIdPdf) {
        setError('All student fields are required including college ID PDF');
        return;
      }
      
      submitData.append('dateOfBirth', formData.dateOfBirth);
      submitData.append('collegeId', formData.collegeId);
      submitData.append('studentCollegeId', formData.studentCollegeId);
      submitData.append('collegeIdPdf', formData.collegeIdPdf);
    } else if (userType === 'owner') {
      if (!formData.organizationName) {
        setError('Organization name is required for owners');
        return;
      }
      
      submitData.append('organizationName', formData.organizationName);
      if (formData.location) {
        submitData.append('location', formData.location);
      }
    }

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.signup}`, {
      method: 'POST',
      body: submitData,
    });

    const data = await response.json();
    if (response.ok) {
      setSuccess(data.message);
      if (userType === 'owner') {
        setTimeout(() => {
          setIsLogin(true);
          setError('');
          setSuccess('');
        }, 2000);
      }
    } else {
      setError(data.error || 'Signup failed');
    }
  };

  if (!isLoaded) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{authCSS}</style>
      
      {/* Background Elements */}
      <div style={styles.backgroundShape1}></div>
      <div style={styles.backgroundShape2}></div>
      <div style={styles.backgroundShape3}></div>

      {/* Back Button */}
      {onBack && (
        <button onClick={onBack} style={styles.backButton}>
          ← Back to Home
        </button>
      )}

      {/* Main Auth Card */}
      <div style={styles.authCard}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.brandIcon}>🎓</div>
          <h1 style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Join Study A-Part'}
          </h1>
          <p style={styles.subtitle}>
            {isLogin 
              ? 'Sign in to continue your journey' 
              : 'Create your account and start your success story'
            }
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* User Type Selection */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>I am a</label>
            <div style={styles.userTypeSelector}>
              {(['student', 'owner', 'admin'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  style={{
                    ...styles.userTypeButton,
                    ...(userType === type ? styles.userTypeButtonActive : {})
                  }}
                >
                  {type === 'student' && '🎓'} 
                  {type === 'owner' && '💼'} 
                  {type === 'admin' && '⚙️'} 
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter your password"
            />
          </div>

          {/* Signup Fields */}
          {!isLogin && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Enter your full name"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  style={styles.input}
                  placeholder="Confirm your password"
                />
              </div>

              {/* Student Fields */}
              {userType === 'student' && (
                <>
                  <div style={styles.row}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        required
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Student ID</label>
                      <input
                        type="text"
                        name="studentCollegeId"
                        required
                        value={formData.studentCollegeId}
                        onChange={handleInputChange}
                        style={styles.input}
                        placeholder="Your student ID"
                      />
                    </div>
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>College</label>
                    <select
                      name="collegeId"
                      required
                      value={formData.collegeId}
                      onChange={handleInputChange}
                      style={styles.select}
                      disabled={loadingColleges}
                    >
                      <option value="">
                        {loadingColleges ? 'Loading colleges...' : 'Select your college'}
                      </option>
                      {colleges.map(college => (
                        <option key={college.id} value={college.id}>
                          {college.name}
                          {college.location && ` - ${college.location}`}
                        </option>
                      ))}
                    </select>
                    {loadingColleges && (
                      <div style={styles.loadingIndicator}>Loading colleges...</div>
                    )}
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>College ID Document (PDF)</label>
                    <div style={styles.fileUpload}>
                      <input
                        type="file"
                        accept=".pdf"
                        required
                        onChange={handleFileChange}
                        style={styles.fileInput}
                        id="pdfUpload"
                      />
                      <label htmlFor="pdfUpload" style={styles.fileLabel}>
                        📎 {formData.collegeIdPdf ? formData.collegeIdPdf.name : 'Choose PDF file'}
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Owner Fields */}
              {userType === 'owner' && (
                <>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Organization Name</label>
                    <input
                      type="text"
                      name="organizationName"
                      required
                      value={formData.organizationName}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="Your company/organization name"
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Location (Optional)</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      style={styles.input}
                      placeholder="City, State"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Messages */}
          {error && (
            <div style={styles.errorMessage}>
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div style={styles.successMessage}>
              ✅ {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
          >
            {loading ? (
              <span style={styles.buttonLoader}>
                <span style={styles.spinner}></span>
                Processing...
              </span>
            ) : (
              <span>
                {isLogin ? '🚀 Sign In' : '✨ Create Account'}
              </span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
            }}
            style={styles.switchButton}
          >
            {isLogin 
              ? "Don't have an account? Sign up here" 
              : "Already have an account? Sign in here"
            }
          </button>
        </div>

        {/* Demo Credentials */}
        <div style={styles.demoSection}>
          <details style={styles.demoDetails}>
            <summary style={styles.demoSummary}>🔍 Demo Credentials</summary>
            <div style={styles.demoContent}>
              <div><strong>Admin:</strong> admin@jobportal.com / admin123</div>
              <div><strong>Test Student:</strong> student@test.com / password123</div>
              <div><strong>Test Owner:</strong> owner@test.com / password123</div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
};

// Enhanced styles with animations and gradients
const authCSS = `
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

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-10px) rotate(5deg); }
    66% { transform: translateY(-5px) rotate(-5deg); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },

  loadingText: {
    marginTop: '1rem',
    fontSize: '1.2rem',
    fontWeight: '500',
  },

  backgroundShape1: {
    position: 'absolute',
    top: '-100px',
    right: '-100px',
    width: '300px',
    height: '300px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%',
    animation: 'float 6s ease-in-out infinite',
  },

  backgroundShape2: {
    position: 'absolute',
    bottom: '-150px',
    left: '-150px',
    width: '400px',
    height: '400px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '50%',
    animation: 'float 8s ease-in-out infinite reverse',
  },

  backgroundShape3: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: '80px',
    height: '80px',
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '50%',
    animation: 'float 4s ease-in-out infinite',
  },

  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    zIndex: 10,
  },

  authCard: {
    background: 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    animation: 'fadeInUp 0.6s ease-out',
    position: 'relative',
    zIndex: 5,
  },

  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },

  brandIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
  },

  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a1a1a',
    margin: '0 0 8px 0',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },

  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
    lineHeight: 1.5,
  },

  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px',
  },

  input: {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: '#ffffff',
    outline: 'none',
  },

  select: {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none', // Remove default arrow
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '16px',
    paddingRight: '40px',
  },

  loadingIndicator: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '4px',
    fontStyle: 'italic',
  },

  userTypeSelector: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#f3f4f6',
    padding: '4px',
    borderRadius: '12px',
  },

  userTypeButton: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  },

  userTypeButtonActive: {
    backgroundColor: 'white',
    color: '#667eea',
    fontWeight: '600',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },

  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },

  fileUpload: {
    position: 'relative',
  },

  fileInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
    cursor: 'pointer',
  },

  fileLabel: {
    display: 'block',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '2px dashed #d1d5db',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    fontSize: '14px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },

  submitButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    padding: '16px 24px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px',
    boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
  },

  submitButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },

  buttonLoader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },

  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  errorMessage: {
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #fecaca',
  },

  successMessage: {
    padding: '12px 16px',
    backgroundColor: '#f0fdf4',
    color: '#16a34a',
    borderRadius: '8px',
    fontSize: '14px',
    border: '1px solid #bbf7d0',
  },

  footer: {
    textAlign: 'center',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
  },

  switchButton: {
    background: 'transparent',
    color: '#667eea',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  demoSection: {
    marginTop: '20px',
    textAlign: 'center',
  },

  demoDetails: {
    fontSize: '12px',
    color: '#6b7280',
  },

  demoSummary: {
    cursor: 'pointer',
    padding: '8px',
    fontWeight: '500',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    listStyle: 'none',
  },

  demoContent: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '6px',
    textAlign: 'left',
    lineHeight: 1.6,
  },
};

export default AuthPage;
