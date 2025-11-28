import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './theme/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { LandingPage } from './pages/LandingPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <LandingPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


