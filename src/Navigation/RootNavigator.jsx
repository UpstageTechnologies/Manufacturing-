import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

function RootNavigator() {
  const location = useLocation();
  const [isExitOpen, setIsExitOpen] = useState(false);
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);
  const isAuthenticated = localStorage.getItem('manufacture-erp-authenticated') === 'true';

  useEffect(() => {
    const handleBackNavigation = (event) => {
      event.preventDefault();
      setIsExitOpen(true);
      window.history.pushState(null, '', window.location.href);
    };

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handleBackNavigation);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handleBackNavigation);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [location.pathname]);

  const handleExitConfirm = () => {
    setIsExitOpen(false);
    window.history.back();
  };

  if (location.pathname === '/') {
    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
  }

  if (!isAuthRoute && !isAuthenticated) return <Navigate to="/login" replace />;
  if (isAuthRoute && isAuthenticated && location.pathname === '/login') return <Navigate to="/dashboard" replace />;

  return (
    <>
      {isAuthRoute ? <AuthNavigator /> : <MainNavigator />}
      {isExitOpen && (
        <div className="modal-overlay" onClick={() => setIsExitOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Exit</h3>
              <button type="button" className="modal-close" onClick={() => setIsExitOpen(false)}>×</button>
            </div>

            <div className="modal-form">
              <p>Do you want to exit?</p>
              <div className="form-actions">
                <button type="button" className="primary-button" onClick={handleExitConfirm}>Yes</button>
                <button type="button" className="secondary-button" onClick={() => setIsExitOpen(false)}>No</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RootNavigator;
