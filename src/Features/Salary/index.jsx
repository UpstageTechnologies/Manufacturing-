import { useMemo, useState } from 'react';
import { FiBarChart2, FiBookOpen, FiCheckCircle, FiFileText } from 'react-icons/fi';
import { formatCurrency, formatDate, useERP } from '../../State/ERPContext';
import './Salary.css';

function SalaryPage() {
  const today = new Date().toISOString().split('T')[0];
  const { employees, salary, attendance, ledger, addSalary, addLedgerEntry } = useERP();
  const [form, setForm] = useState({ employee: employees[0]?.name || '', date: today });
  const [ledgerForm, setLedgerForm] = useState({ employee: employees[0]?.name || '', type: 'Advance', amount: '', date: today });
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportEmployee, setReportEmployee] = useState(employees[0]?.name || '');

  const selectedEmployee = useMemo(() => employees.find((employee) => employee.name === form.employee) || employees[0], [employees, form.employee]);
  const reportSelectedEmployee = useMemo(() => employees.find((employee) => employee.name === reportEmployee) || employees[0], [employees, reportEmployee]);
  const getSalaryPeriodDays = (employee) => {
    if (!employee) return 30;
    const periodMap = {
      'Per Day': 1,
      '7 Days / Weekly': 7,
      '15 Days / Bi-weekly': 15,
      Monthly: 30,
    };
    return periodMap[employee.salaryPeriod] || 30;
  };

  const getPresentDays = (employee) => {
    if (!employee) return 0;

    const attendanceEntries = Object.values(attendance || {});
    return attendanceEntries.reduce((total, dayRecords) => {
      const status = dayRecords?.[employee.id];
      if (status === 'Present' || status === 'Late') {
        return total + 1;
      }
      return total;
    }, 0);
  };

  const calculatedSalary = useMemo(() => {
    if (!selectedEmployee) return 0;
    const perDaySalary = Number(selectedEmployee.salary || 0) / getSalaryPeriodDays(selectedEmployee);
    return perDaySalary * getPresentDays(selectedEmployee);
  }, [selectedEmployee, attendance]);
  const reportCalculatedSalary = useMemo(() => {
    if (!reportSelectedEmployee) return 0;
    const perDaySalary = Number(reportSelectedEmployee.salary || 0) / getSalaryPeriodDays(reportSelectedEmployee);
    return perDaySalary * getPresentDays(reportSelectedEmployee);
  }, [reportSelectedEmployee, attendance]);

  const totalLedgerAmount = useMemo(() => {
    if (!selectedEmployee) return 0;
    return ledger
      .filter((entry) => entry.employee === selectedEmployee.name)
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  }, [selectedEmployee, ledger]);
  const reportTotalLedgerAmount = useMemo(() => {
    if (!reportSelectedEmployee) return 0;
    return ledger
      .filter((entry) => entry.employee === reportSelectedEmployee.name)
      .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  }, [reportSelectedEmployee, ledger]);
  const balanceSalary = Math.max(calculatedSalary - totalLedgerAmount, 0);
  const reportBalanceSalary = Math.max(reportCalculatedSalary - reportTotalLedgerAmount, 0);

  const handleEmployeeChange = (event) => {
    const employee = employees.find((item) => item.name === event.target.value);
    setForm({ ...form, employee: event.target.value });
    setLedgerForm((prev) => ({ ...prev, employee: event.target.value }));
    setReportEmployee(employee?.name || event.target.value);
  };

  const handleSalarySubmit = (event) => {
    event.preventDefault();
    if (!form.employee || !selectedEmployee || calculatedSalary <= 0) return;

    addSalary({
      employee: selectedEmployee.name,
      amount: Number(calculatedSalary.toFixed(2)),
      date: form.date,
      status: 'Paid',
    });
  };

  const handleLedgerSubmit = (event) => {
    event.preventDefault();
    if (!ledgerForm.employee || Number(ledgerForm.amount) <= 0) return;

    addLedgerEntry({
      employee: ledgerForm.employee,
      type: ledgerForm.type,
      amount: Number(ledgerForm.amount),
      date: ledgerForm.date,
    });

    setLedgerForm({ employee: form.employee, type: 'Advance', amount: '', date: today });
    setIsLedgerOpen(false);
  };

  const openLedgerModal = (employeeName = form.employee) => {
    setLedgerForm({ employee: employeeName, type: 'Advance', amount: '', date: today });
    setIsLedgerOpen(true);
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Payroll</p>
          <h1 className="page-title">Salary</h1>
        </div>
      </div>

      <form className="content-panel form-panel" onSubmit={handleSalarySubmit}>
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
            <label>Calculated Salary</label>
            <input type="number" min="0" value={calculatedSalary.toFixed(2)} readOnly />
          </div>
          <div className="field-group">
            <label>Date</label>
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </div>
        </div>

        <div className="salary-summary">
          <div className="salary-summary-card">
            <span>Per day salary</span>
            <strong>{selectedEmployee ? formatCurrency(Number(selectedEmployee.salary || 0) / getSalaryPeriodDays(selectedEmployee)) : formatCurrency(0)}</strong>
          </div>
          <div className="salary-summary-card">
            <span>Present days</span>
            <strong>{getPresentDays(selectedEmployee)}</strong>
          </div>
          <div className="salary-summary-card">
            <span>Total ledger</span>
            <strong>{formatCurrency(totalLedgerAmount)}</strong>
          </div>
          <div className="salary-summary-card highlight">
            <span>Balance salary</span>
            <strong>{formatCurrency(balanceSalary)}</strong>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {salary.map((item) => (
              <tr key={`${item.employee}-${item.date}-${item.id}`}>
                <td>{item.employee}</td>
                <td>{formatCurrency(item.amount)}</td>
                <td>{formatDate(item.date)}</td>
                <td>
                  <span className={`salary-status ${item.status === 'Paid' ? 'paid' : 'pending'}`}>{item.status}</span>
                </td>
                <td>
                  <div className="table-actions compact">
                    <button type="button" className="table-action icon-action" aria-label={`Ledger for ${item.employee}`} onClick={() => openLedgerModal(item.employee)}>
                      <FiBookOpen />
                    </button>
                    <button type="button" className="table-action icon-action" aria-label={`Report for ${item.employee}`} onClick={() => { setReportEmployee(item.employee); setIsReportOpen(true); }}>
                      <FiBarChart2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isLedgerOpen && (
        <div className="modal-overlay" onClick={() => setIsLedgerOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Ledger Entry</h3>
              <button type="button" className="modal-close" onClick={() => setIsLedgerOpen(false)}>×</button>
            </div>

            <form className="modal-form" onSubmit={handleLedgerSubmit}>
              <div className="field-group">
                <label>Employee</label>
                <select value={ledgerForm.employee} onChange={(event) => setLedgerForm({ ...ledgerForm, employee: event.target.value })}>
                  {employees.map((employee) => (
                    <option key={employee.name} value={employee.name}>{employee.name}</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Type</label>
                <select value={ledgerForm.type} onChange={(event) => setLedgerForm({ ...ledgerForm, type: event.target.value })}>
                  <option value="Advance">Advance</option>
                  <option value="Pattu">Patru</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field-group">
                <label>Amount</label>
                <input type="number" min="0" value={ledgerForm.amount} onChange={(event) => setLedgerForm({ ...ledgerForm, amount: event.target.value })} placeholder="Enter amount" />
              </div>

              <div className="field-group">
                <label>Date</label>
                <input type="date" value={ledgerForm.date} onChange={(event) => setLedgerForm({ ...ledgerForm, date: event.target.value })} />
              </div>

              <button type="submit" className="primary-button full-width">Save Ledger</button>
            </form>
          </div>
        </div>
      )}

      {isReportOpen && (
        <div className="modal-overlay" onClick={() => setIsReportOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Salary Report</h3>
              <button type="button" className="modal-close" onClick={() => setIsReportOpen(false)}>×</button>
            </div>

            <div className="modal-form report-panel">
              <div className="report-stat-row">
                <span>Employee</span>
                <strong>{reportEmployee}</strong>
              </div>
              <div className="report-stat-row">
                <span>Calculated Salary</span>
                <strong>{formatCurrency(reportCalculatedSalary)}</strong>
              </div>
              <div className="report-stat-row">
                <span>Ledger Total</span>
                <strong>{formatCurrency(reportTotalLedgerAmount)}</strong>
              </div>
              <div className="report-stat-row balance-row">
                <span>Balance Salary</span>
                <strong>{formatCurrency(reportBalanceSalary)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalaryPage;
