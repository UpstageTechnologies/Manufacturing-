import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

function RootNavigator() {
  const location = useLocation();
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);

  if (location.pathname === '/') {
    return <Navigate to="/login" replace />;
  }

  return isAuthRoute ? <AuthNavigator /> : <MainNavigator />;
}

export default RootNavigator;
