import { FaRupeeSign } from 'react-icons/fa';
import { FiCreditCard, FiPackage, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { useERP, formatCurrency, formatDate } from '../../State/ERPContext';
import { getCurrentUser, ROLES } from '../../State/auth';
import './Dashboard.css';

function DashboardPage() {
  const user = getCurrentUser();
  const { income, expense, employees, salary, attendance, inventory } = useERP();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todayAttendance = attendance?.[todayKey] || {};
  const attendanceCounts = employees.reduce((counts, employee) => {
    const status = todayAttendance[employee.id];
    return status in counts ? { ...counts, [status]: counts[status] + 1 } : counts;
  }, { Present: 0, Late: 0, Absent: 0 });
  const pendingSalaryCount = salary.filter((record) => record.status !== 'Paid').length;
  const isCEO = user?.role === ROLES.CEO;
  const isManager = user?.role === ROLES.MANAGER;

  const ceoCards = [
    { label: 'Income', value: formatCurrency(income.reduce((total, item) => total + Number(item.amount), 0)), icon: FiTrendingUp, tone: 'emerald' },
    { label: 'Expense', value: formatCurrency(expense.reduce((total, item) => total + Number(item.amount), 0)), icon: FiCreditCard, tone: 'red' },
    { label: 'Salary', value: formatCurrency(salary.reduce((total, item) => total + Number(item.amount), 0)), icon: FaRupeeSign, tone: 'blue' },
    { label: 'Employees', value: employees.length, icon: FiUsers, tone: 'purple' },
  ];
  const managerCards = [
    { label: 'Inventory items', value: inventory.length, icon: FiPackage, tone: 'emerald' },
    { label: 'Present today', value: attendanceCounts.Present, icon: FiUsers, tone: 'blue' },
    { label: 'Absent today', value: attendanceCounts.Absent, icon: FiUsers, tone: 'red' },
    { label: 'Pending salary payments', value: pendingSalaryCount, icon: FiCreditCard, tone: 'purple' },
  ];
  const accountantCards = [
    { label: 'Income records', value: income.length, icon: FiTrendingUp, tone: 'emerald' },
    { label: 'Expense records', value: expense.length, icon: FiCreditCard, tone: 'red' },
    { label: 'Pending salary payments', value: pendingSalaryCount, icon: FaRupeeSign, tone: 'blue' },
    { label: 'Employees', value: employees.length, icon: FiUsers, tone: 'purple' },
  ];
  const summaryCards = isCEO ? ceoCards : isManager ? managerCards : accountantCards;
  const formattedDate = today.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">{user?.role} workspace</p>
          <h1 className="page-title">Business Dashboard</h1>
        </div>
        <div className="topbar-actions">
          <div className="profile-pill">
            <div className="mini-avatar">{(user?.name || user?.role || 'U').slice(0, 2).toUpperCase()}</div>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
        </div>
      </header>

      <section className="welcome-panel">
        <div>
          <p className="eyebrow muted">Welcome back</p>
          <h2>Hello, {user?.role === ROLES.CEO ? 'Admin' : user?.role || 'Admin'}</h2>
          <p className="subtitle">{formattedDate}</p>
        </div>
      </section>

      <section className="summary-grid">
        {summaryCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={`summary-card ${tone}`}>
            <div className="summary-header">
              <div className="summary-icon"><Icon /></div>
              <span className="trend">Live</span>
            </div>
            <p className="summary-label">{label}</p>
            <h3>{value}</h3>
          </div>
        ))}
      </section>

      {isCEO && (
        <section className="data-grid">
          <div className="panel-card">
            <div className="panel-header"><h3>Recent Income</h3></div>
            <table>
              <thead><tr><th>Source</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {income.slice(0, 3).map((item) => (
                  <tr key={item.id}><td>{item.title}</td><td>{formatCurrency(item.amount)}</td><td>{formatDate(item.date)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="panel-card">
            <div className="panel-header"><h3>Recent Expense</h3></div>
            <table>
              <thead><tr><th>Source</th><th>Amount</th><th>Date</th></tr></thead>
              <tbody>
                {expense.slice(0, 3).map((item) => (
                  <tr key={item.id}><td>{item.title}</td><td>{formatCurrency(item.amount)}</td><td>{formatDate(item.date)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!isCEO && (
        <section className="attendance-section">
          <div className="panel-card attendance-card">
            <div className="panel-header">
              <h3>{isManager ? 'Today’s attendance' : 'Workforce overview'}</h3>
              <span className="tag present">Present {employees.length ? Math.round((attendanceCounts.Present / employees.length) * 100) : 0}%</span>
            </div>
            <div className="attendance-metrics">
              <div><strong>{employees.length}</strong><span>Employees</span></div>
              <div><strong>{attendanceCounts.Present}</strong><span>Present</span></div>
              <div><strong>{attendanceCounts.Late}</strong><span>Late</span></div>
              <div><strong>{attendanceCounts.Absent}</strong><span>Absent</span></div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export default DashboardPage;
