import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../Features/Login';

function AuthNavigator() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AuthNavigator;
