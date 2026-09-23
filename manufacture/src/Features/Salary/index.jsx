import { FiCheckCircle, FiPlus } from 'react-icons/fi';
import './Salary.css';

const employees = [
  { name: 'Alice Morgan', salary: '₹ 35,000' },
  { name: 'James Lee', salary: '₹ 42,500' },
  { name: 'Priya Nair', salary: '₹ 28,800' },
];

const salaryHistory = [
  { employee: 'Alice Morgan', amount: '₹ 35,000', date: '12 Jun 2026', status: 'Paid' },
  { employee: 'James Lee', amount: '₹ 42,500', date: '05 Jun 2026', status: 'Pending' },
  { employee: 'Priya Nair', amount: '₹ 28,800', date: '01 Jun 2026', status: 'Paid' },
];

function SalaryPage() {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Payroll</p>
          <h1 className="page-title">Salary</h1>
        </div>
        <button type="button" className="primary-button">
          <FiPlus /> Pay Salary
        </button>
      </div>

      <div className="content-panel form-panel">
        <div className="field-grid">
          <div className="field-group">
            <label>Employee</label>
            <select defaultValue="Alice Morgan">
              {employees.map((employee) => (
                <option key={employee.name} value={employee.name}>{employee.name}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Salary Amount</label>
            <input type="text" defaultValue="₹ 35,000" />
          </div>
          <div className="field-group">
            <label>Date</label>
            <input type="date" defaultValue={today} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="primary-button">
            <FiCheckCircle /> Save
          </button>
        </div>
      </div>

      <div className="content-panel">
        <div className="panel-header">
          <h3>Salary History</h3>
        </div>

        <table className="erp-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Salary</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {salaryHistory.map((item) => (
              <tr key={`${item.employee}-${item.date}`}>
                <td>{item.employee}</td>
                <td>{item.amount}</td>
                <td>{item.date}</td>
                <td>
                  <span className={`salary-status ${item.status === 'Paid' ? 'paid' : 'pending'}`}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SalaryPage;
