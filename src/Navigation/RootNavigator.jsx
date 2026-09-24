import { Navigate, useLocation } from 'react-router-dom';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

function RootNavigator() {
  const location = useLocation();
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);
  const isAuthenticated = localStorage.getItem('manufacture-erp-authenticated') === 'true';

  if (location.pathname === '/') {
    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
  }

  if (!isAuthRoute && !isAuthenticated) return <Navigate to="/login" replace />;
  if (isAuthRoute && isAuthenticated && location.pathname === '/login') return <Navigate to="/dashboard" replace />;

  return isAuthRoute ? <AuthNavigator /> : <MainNavigator />;
}

export default RootNavigator;
