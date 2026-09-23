import { FiBell, FiChevronDown, FiCreditCard, FiDollarSign, FiPackage, FiTrendingUp, FiUsers } from 'react-icons/fi';
import './Dashboard.css';

const summaryCards = [
  { label: 'Income', value: '₹ 1,24,500', change: '+12.4%', icon: FiTrendingUp, tone: 'emerald' },
  { label: 'Expense', value: '₹ 68,200', change: '-8.2%', icon: FiCreditCard, tone: 'red' },
  { label: 'Salary', value: '₹ 92,000', change: '+5.1%', icon: FiDollarSign, tone: 'blue' },
  { label: 'Employees', value: '148', change: '+18 new', icon: FiUsers, tone: 'purple' },
];

const incomeRows = [
  { name: 'Sales Invoice', amount: '₹ 25,000', date: '12 Jun 2026' },
  { name: 'Consulting', amount: '₹ 18,750', date: '11 Jun 2026' },
  { name: 'Rental Income', amount: '₹ 12,400', date: '09 Jun 2026' },
];

const expenseRows = [
  { name: 'Raw Materials', amount: '₹ 16,300', date: '13 Jun 2026' },
  { name: 'Transport', amount: '₹ 8,950', date: '12 Jun 2026' },
  { name: 'Marketing', amount: '₹ 6,540', date: '10 Jun 2026' },
];

function DashboardPage() {
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="page-shell dashboard-page">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>Manufacture</strong>
            <small>ERP</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button type="button" className="nav-item active">
            <FiTrendingUp />
            <span>Dashboard</span>
          </button>
          <button type="button" className="nav-item">
            <FiDollarSign />
            <span>Income</span>
          </button>
          <button type="button" className="nav-item">
            <FiCreditCard />
            <span>Expense</span>
          </button>
          <button type="button" className="nav-item">
            <FiPackage />
            <span>Inventory</span>
          </button>
          <button type="button" className="nav-item">
            <FiUsers />
            <span>Salary</span>
          </button>
          <button type="button" className="nav-item">
            <FiUsers />
            <span>Attendance</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="sidebar-link">Settings</button>
          <button type="button" className="sidebar-link logout">Logout</button>
        </div>
      </aside>

      <div className="content-area">
        <header className="topbar">
          <div>
            <p className="eyebrow">Operations</p>
            <h1 className="page-title">Business Dashboard</h1>
          </div>

          <div className="topbar-actions">
            <button type="button" className="icon-button" aria-label="Notifications">
              <FiBell />
            </button>
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
                <button type="button" className="text-button">View all</button>
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
                <button type="button" className="text-button">View all</button>
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
                <span className="tag present">Present 82%</span>
              </div>
              <div className="attendance-metrics">
                <div>
                  <strong>148</strong>
                  <span>Total</span>
                </div>
                <div>
                  <strong>116</strong>
                  <span>Present</span>
                </div>
                <div>
                  <strong>21</strong>
                  <span>Late</span>
                </div>
                <div>
                  <strong>11</strong>
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
