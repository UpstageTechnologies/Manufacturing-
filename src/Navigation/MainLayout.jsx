import { useState } from 'react';
import { FaRupeeSign } from 'react-icons/fa';
import { FiCreditCard, FiMenu, FiPackage, FiTrendingUp, FiUsers, FiX, FiUserPlus } from 'react-icons/fi';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import '../Features/Dashboard/Dashboard.css';
import { LuWalletCards } from 'react-icons/lu';
import { canAccessPath, getCurrentUser, logoutUser } from '../State/auth';

function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const user = getCurrentUser();
  const links = [
    { path: '/dashboard', label: 'Dashboard', icon: FiTrendingUp },
    { path: '/income', label: 'Income', icon: FaRupeeSign },
    { path: '/expense', label: 'Expense', icon: FiCreditCard },
    { path: '/inventory', label: 'Inventory', icon: FiPackage },
    { path: '/salary', label: 'Salary', icon: LuWalletCards },
    { path: '/attendance', label: 'Attendance', icon: FiUsers },
    { path: '/account-management', label: 'Owner Management', icon: FiUserPlus },
  ].filter(({ path }) => canAccessPath(user?.role, path));

  return (
    <div className={`page-shell dashboard-page${location.pathname === '/inventory' ? ' inventory-shell' : ''}`}>
      <div className="mobile-nav-header">
        <button type="button" className="sidebar-brand mobile-brand-button" onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}>
          <div className="brand-mark">M</div>
          <div>
            <strong>Manufacture</strong>
            <small>ERP</small>
          </div>
        </button>
        <button type="button" className="mobile-menu-button" aria-expanded={isMenuOpen} aria-controls="main-navigation" aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setIsMenuOpen((open) => !open)}>
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
      <aside className={`sidebar${isMenuOpen ? ' menu-open' : ''}`}>
        <button type="button" className="sidebar-brand" onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}><div className="brand-mark">M</div><div><strong>Manufacture</strong><small>ERP</small></div></button>
        <nav id="main-navigation" className="sidebar-nav">
          {links.map(({ path, label, icon: Icon }) => <NavLink key={path} to={path} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}><Icon /><span>{label}</span></NavLink>)}
        </nav>
        <div className="sidebar-footer"><span className="sidebar-link">{user?.role}</span><button type="button" className="sidebar-link logout" onClick={() => { logoutUser(); navigate('/login', { replace: true }); }}>Logout</button></div>
      </aside>
      <div className="content-area"><main className="dashboard-main">{children}</main></div>
    </div>
  );
}

export default MainLayout;