import { useState } from 'react';
import { FiChevronDown, FiCreditCard, FiMenu, FiPackage, FiTrendingUp, FiUsers, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate, useERP } from '../../State/ERPContext';
import './Dashboard.css';
import { FaRupeeSign } from 'react-icons/fa';

function DashboardPage() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { income, expense, employees, salary } = useERP();
  const summaryCards = [
    { label: 'Income', value: formatCurrency(income.reduce((total, item) => total + Number(item.amount), 0)), change: 'Live', icon: FiTrendingUp, tone: 'emerald' },
    { label: 'Expense', value: formatCurrency(expense.reduce((total, item) => total + Number(item.amount), 0)), change: 'Live', icon: FiCreditCard, tone: 'red' },
    { label: 'Salary', value: formatCurrency(salary.reduce((total, item) => total + Number(item.amount), 0)), change: 'Live', icon: FaRupeeSign, tone: 'blue' },
    { label: 'Employees', value: employees.length, change: 'Live', icon: FiUsers, tone: 'purple' },
  ];
  const incomeRows = income.slice(0, 3).map((item) => ({ name: item.title, amount: formatCurrency(item.amount), date: formatDate(item.date) }));
  const expenseRows = expense.slice(0, 3).map((item) => ({ name: item.title, amount: formatCurrency(item.amount), date: formatDate(item.date) }));
  const attendanceCounts = employees.reduce((counts, employee) => ({ ...counts, [employee.status]: counts[employee.status] + 1 }), { Present: 0, Late: 0, Absent: 0 });
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="page-shell dashboard-page">
      <div className="mobile-nav-header">
        <button type="button" className="sidebar-brand mobile-brand-button" onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}>
          <div className="brand-mark">M</div>
          <div>
            <strong>Manufacture</strong>
            <small>ERP</small>
          </div>
        </button>
        <button type="button" className="mobile-menu-button" aria-expanded={isMenuOpen} aria-controls="dashboard-navigation" aria-label={isMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setIsMenuOpen((open) => !open)}>
          {isMenuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
      <aside className={`sidebar${isMenuOpen ? ' menu-open' : ''}`}>
        <button type="button" className="sidebar-brand" onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}>
          <div className="brand-mark">M</div>
          <div>
            <strong>Manufacture</strong>
            <small>ERP</small>
          </div>
        </button>

        <nav id="dashboard-navigation" className="sidebar-nav">
          <button type="button" className="nav-item active" onClick={() => { setIsMenuOpen(false); navigate('/dashboard'); }}>
            <FiTrendingUp />
            <span>Dashboard</span>
          </button>
          <button type="button" className="nav-item" onClick={() => { setIsMenuOpen(false); navigate('/income'); }}>
            <FaRupeeSign />
            <span>Income</span>
          </button>
          <button type="button" className="nav-item" onClick={() => { setIsMenuOpen(false); navigate('/expense'); }}>
            <FiCreditCard />
            <span>Expense</span>
          </button>
          <button type="button" className="nav-item" onClick={() => { setIsMenuOpen(false); navigate('/inventory'); }}>
            <FiPackage />
            <span>Inventory</span>
          </button>
          <button type="button" className="nav-item" onClick={() => { setIsMenuOpen(false); navigate('/salary'); }}>
            <FiUsers />
            <span>Salary</span>
          </button>
          <button type="button" className="nav-item" onClick={() => { setIsMenuOpen(false); navigate('/attendance'); }}>
            <FiUsers />
            <span>Attendance</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-link">Settings</button>
          <button type="button" className="sidebar-link logout" onClick={() => { localStorage.removeItem('manufacture-erp-authenticated'); navigate('/login'); }}>Logout</button>
        </div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h1 className="page-title">Business Dashboard</h1>
          </div>

          <div className="topbar-actions">
            <div className="profile-pill">
              <div className="mini-avatar">AK</div>
              <div>
                <strong>Alisha Khan</strong>
                <small>Admin</small>
              </div>
              <FiChevronDown />
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <section className="welcome-panel">
            <div>
              <p className="eyebrow muted">Welcome back</p>
              <h2>Good morning, Alisha</h2>
              <p className="subtitle">{formattedDate}</p>
            </div>
            <button type="button" className="primary-button">Generate report</button>
          </section>

          <section className="summary-grid">
            {summaryCards.map(({ label, value, change, icon: Icon, tone }) => (
              <div key={label} className={`summary-card ${tone}`}>
                <div className="summary-header">
                  <div className="summary-icon">
                    <Icon />
                  </div>
                  <span className="trend">{change}</span>
                </div>
                <p className="summary-label">{label}</p>
                <h3>{value}</h3>
              </div>
            ))}
          </section>

          <section className="data-grid">
            <div className="panel-card">
              <div className="panel-header">
                <h3>Recent Income</h3>
                <button type="button" className="text-button" onClick={() => navigate('/income')}>View all</button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.amount}</td>
                      <td>{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel-card">
              <div className="panel-header">
                <h3>Recent Expense</h3>
                <button type="button" className="text-button" onClick={() => navigate('/expense')}>View all</button>
              </div>

              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.amount}</td>
                      <td>{row.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="attendance-section">
            <div className="panel-card attendance-card">
              <div className="panel-header">
                <h3>Attendance Summary</h3>
                <span className="tag present">Present {employees.length ? Math.round((attendanceCounts.Present / employees.length) * 100) : 0}%</span>
              </div>
              <div className="attendance-metrics">
                <div>
                  <strong>{employees.length}</strong>
                  <span>Total</span>
                </div>
                <div>
                  <strong>{attendanceCounts.Present}</strong>
                  <span>Present</span>
                </div>
                <div>
                  <strong>{attendanceCounts.Late}</strong>
                  <span>Late</span>
                </div>
                <div>
                  <strong>{attendanceCounts.Absent}</strong>
                  <span>Absent</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default DashboardPage;
