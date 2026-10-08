import { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../State/auth';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const appPaths = new Set(['/login', '/register', '/dashboard', '/income', '/expense', '/inventory', '/salary', '/attendance', '/account-management']);

function RootNavigator() {
  const location = useLocation();
  const [isExitOpen, setIsExitOpen] = useState(false);
  const exitGuardAdded = useRef(false);
  const skipExitHandling = useRef(false);
  const skipBeforeUnload = useRef(false);
  const isAuthRoute = ['/login', '/register'].includes(location.pathname);
  const isAuthenticated = Boolean(getCurrentUser());

  useEffect(() => {
    const handleBackNavigation = (event) => {
      if (skipExitHandling.current) {
        skipExitHandling.current = false;
        if (appPaths.has(window.location.pathname)) {
          skipBeforeUnload.current = false;
        } else {
          window.location.assign(window.location.href);
        }
        return;
      }

      if (event.state?.__appExitGuard === 'app-entry') setIsExitOpen(true);
    };

    const handleBeforeUnload = (event) => {
      if (skipBeforeUnload.current) {
        skipBeforeUnload.current = false;
        return;
      }
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('popstate', handleBackNavigation);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handleBackNavigation);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (['/', '/login', '/register'].includes(location.pathname) || exitGuardAdded.current) return;

    window.history.replaceState(
      { ...window.history.state, __appExitGuard: 'app-entry' },
      '',
      window.location.href,
    );
    window.history.pushState(
      { ...window.history.state, __appExitGuard: 'exit-guard' },
      '',
      window.location.href,
    );
    exitGuardAdded.current = true;
  }, [location.pathname]);

  const handleExitCancel = () => {
    setIsExitOpen(false);
    if (window.history.state?.__appExitGuard !== 'exit-guard') {
      window.history.pushState(
        { ...window.history.state, __appExitGuard: 'exit-guard' },
        '',
        window.location.href,
      );
    }
  };

  const handleExitConfirm = () => {
    setIsExitOpen(false);
    skipExitHandling.current = true;
    skipBeforeUnload.current = true;
    window.history.back();
  };

  if (location.pathname === '/') {
    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
  }

  if (!isAuthRoute && !isAuthenticated) return <Navigate to="/login" replace />;
  if (isAuthRoute && isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <>
      {isAuthRoute ? <AuthNavigator /> : <MainNavigator />}
      {isExitOpen && (
        <div className="modal-overlay" onClick={handleExitCancel}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Exit</h3>
              <button type="button" className="modal-close" onClick={handleExitCancel}>×</button>
            </div>

            <div className="modal-form">
              <p>Do you really want to exit?</p>
              <div className="form-actions">
                <button type="button" className="primary-button" onClick={handleExitConfirm}>Yes</button>
                <button type="button" className="secondary-button" onClick={handleExitCancel}>No</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RootNavigator;
