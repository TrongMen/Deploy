import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import ZaloLogin from './screens/login';
import ZaloRegistration from './screens/register';
import OtpVerification from './screens/otpVerification';
import ForgotPassword from './screens/ForgotPassword';
import ZaloPCLayout from './layoutChat/ZaloPCLayout';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null); // ban đầu là null, chờ kiểm tra
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    setLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    setIsLoggedIn(false);
  };

  const handleRegisterSuccess = () => {
    console.log('Đăng ký thành công (cần qua bước OTP), chuyển về trang đăng nhập.');
  };

  if (loading) return <div>Loading...</div>; // tránh nhảy lung tung trong khi chưa xác minh xong

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/app" replace />
              ) : (
                <ZaloLogin onLoginSuccess={handleLoginSuccess} />
              )
            }
          />

          <Route
            path="/register"
            element={
              isLoggedIn ? (
                <Navigate to="/app" replace />
              ) : (
                <ZaloRegistration onRegisterSuccess={handleRegisterSuccess} />
              )
            }
          />

          <Route path="/otp-verification" element={<OtpVerification />} />

          <Route
            path="/forgot-password"
            element={
              isLoggedIn ? (
                <Navigate to="/app" replace />
              ) : (
                <ForgotPassword />
              )
            }
          />

          <Route
            path="/app"
            element={
              isLoggedIn ? (
                <ZaloPCLayout onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          <Route
            path="*"
            element={<Navigate to={isLoggedIn ? "/app" : "/login"} replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
