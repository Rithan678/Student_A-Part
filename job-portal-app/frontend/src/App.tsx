import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import StudentDashboard from './components/StudentDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

interface User {
  id: number;
  name: string;
  email: string;
  userType: 'student' | 'owner' | 'admin';
  organization_name?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    setShowAuth(false);
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
  };

  // Show appropriate dashboard if user is logged in
  if (user) {
    switch (user.userType) {
      case 'student':
        return <StudentDashboard user={user} onLogout={handleLogout} />;
      case 'owner':
        return <OwnerDashboard user={user} onLogout={handleLogout} />;
      case 'admin':
        return <AdminDashboard user={user} onLogout={handleLogout} />;
      default:
        return <LandingPage onNavigateToAuth={handleGetStarted} />;
    }
  }

  // Show auth page if user clicked get started
  if (showAuth) {
    return <AuthPage onLogin={handleLogin} onBack={handleBackToLanding} />;
  }

  // Show landing page by default
  return <LandingPage onNavigateToAuth={handleGetStarted} />;
}

export default App;

