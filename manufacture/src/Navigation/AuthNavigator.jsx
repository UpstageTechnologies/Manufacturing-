import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../Features/Login';
import RegisterPage from '../Features/Register';

function AuthNavigator() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AuthNavigator;
