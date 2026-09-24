import { useState } from 'react';
import { FiCheckCircle, FiPlus } from 'react-icons/fi';
import { formatCurrency, formatDate, useERP } from '../../State/ERPContext';
import './Salary.css';

function SalaryPage() {
  const today = new Date().toISOString().split('T')[0];
  const { employees, salary, addSalary } = useERP();
  const [form, setForm] = useState({ employee: employees[0]?.name || '', amount: employees[0]?.salary || '', date: today });
  const selectedEmployee = employees.find((employee) => employee.name === form.employee);

  const handleEmployeeChange = (event) => {
    const employee = employees.find((item) => item.name === event.target.value);
    setForm({ ...form, employee: event.target.value, amount: employee?.salary || '' });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.employee || Number(form.amount) <= 0) return;
    addSalary({ employee: form.employee, amount: Number(form.amount), date: form.date, status: 'Paid' });
    setForm({ ...form, amount: selectedEmployee?.salary || form.amount });
  };

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

      <form className="content-panel form-panel" onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="field-group">
            <label>Employee</label>
            <select value={form.employee} onChange={handleEmployeeChange}>
              {employees.map((employee) => (
                <option key={employee.name} value={employee.name}>{employee.name}</option>
              ))}
            </select>
          </div>
          <div className="field-group">
            <label>Salary Amount</label>
            <input type="number" min="0" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} />
          </div>
          <div className="field-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-button">
            <FiCheckCircle /> Save
          </button>
        </div>
      </form>

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
            {salary.map((item) => (
              <tr key={`${item.employee}-${item.date}`}>
                <td>{item.employee}</td>
                <td>{formatCurrency(item.amount)}</td>
                <td>{formatDate(item.date)}</td>
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
