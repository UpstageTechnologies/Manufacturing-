import { useState } from 'react';
import { FiEdit2, FiSave } from 'react-icons/fi';
import { formatCurrency, useERP } from '../../State/ERPContext';
import './Salary.css';

const salaryTypes = ['Per Day', 'Weekly', 'Monthly'];

function getDefaultSettings(employee, attendanceCount, ledger) {
  const period = employee.salaryPeriod || 'Monthly';
  const salaryType = period === 'Per Day'
    ? 'Per Day'
    : period.includes('Weekly')
      ? 'Weekly'
      : period.includes('Bi-weekly')
        ? 'Per Day'
        : 'Monthly';
  const previousEntries = ledger.filter((entry) => entry.employee === employee.name);

  return {
    salaryType,
    amount: (Number(employee.salary) || 0) / (period.includes('Bi-weekly') ? 15 : 1),
    units: salaryType === 'Per Day' ? attendanceCount : 1,
    attendanceBased: salaryType === 'Per Day',
    advance: previousEntries
      .filter((entry) => !entry.type || entry.type === 'Advance')
      .reduce((total, entry) => total + (Number(entry.amount) || 0), 0),
    deduction: previousEntries
      .filter((entry) => ['Deduction', 'Pattu', 'Other'].includes(entry.type))
      .reduce((total, entry) => total + (Number(entry.amount) || 0), 0),
  };
}

function getAttendanceCount(employeeId, attendance) {
  return Object.values(attendance || {}).reduce((count, dayRecords) => {
    const status = dayRecords?.[employeeId];
    return count + (status === 'Present' || status === 'Late' ? 1 : 0);
  }, 0);
}

function SalaryPage() {
  const { employees, attendance, ledger = [], salarySettings = {}, saveSalarySettings } = useERP();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const getSettings = (employee, attendanceCount) => ({
    ...getDefaultSettings(employee, attendanceCount, ledger),
    ...salarySettings[employee.id],
  });

  const startEditing = (employee, attendanceCount) => {
    setEditingId(employee.id);
    setDraft(getSettings(employee, attendanceCount));
    setError('');
    setMessage('');
  };

  const handleSave = (employee) => {
    const settings = {
      ...draft,
      amount: Number(draft.amount),
      units: Number(draft.units),
      advance: Number(draft.advance),
      deduction: Number(draft.deduction),
    };

    if (!salaryTypes.includes(settings.salaryType)
      || !Number.isFinite(settings.amount) || settings.amount < 0
      || !Number.isInteger(settings.units) || settings.units < 0
      || !Number.isFinite(settings.advance) || settings.advance < 0
      || !Number.isFinite(settings.deduction) || settings.deduction < 0) {
      setError('Enter valid non-negative amounts and payment units before saving.');
      setMessage('');
      return;
    }

    try {
      saveSalarySettings(employee.id, settings);
      setEditingId(null);
      setDraft(null);
      setError('');
      setMessage(`Salary settings saved for ${employee.name}.`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save salary settings.');
      setMessage('');
    }
  };

  const updateDraft = (field, value) => setDraft((previous) => ({ ...previous, [field]: value }));

  return (
    <div className="feature-page salary-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Payroll</p>
          <h1 className="page-title">Salary</h1>
        </div>
      </div>

      {error && <p className="salary-feedback error" role="alert">{error}</p>}
      {message && <p className="salary-feedback success" role="status">{message}</p>}

      <div className="content-panel salary-table-panel">
        <div className="panel-header">
          <div>
            <h3>Employee Salaries</h3>
            <p className="salary-table-caption">Per-day pay uses attendance by default. Weekly and monthly pay use the entered number of weeks or months.</p>
          </div>
        </div>
        <div className="salary-table-scroll">
          <table className="erp-table salary-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Attendance Count</th>
                <th>Salary Type</th>
                <th>Salary Amount</th>
                <th>Advance / Deduction</th>
                <th>Final Payable Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const attendanceCount = getAttendanceCount(employee.id, attendance);
                const settings = getSettings(employee, attendanceCount);
                const isEditing = editingId === employee.id;
                const current = isEditing ? draft : settings;
                const units = current.attendanceBased ? attendanceCount : Number(current.units) || 0;
                const earned = (Number(current.amount) || 0) * units;
                const payable = earned - (Number(current.advance) || 0) - (Number(current.deduction) || 0);
                const unitLabel = current.salaryType === 'Weekly'
                  ? 'week(s)'
                  : current.salaryType === 'Monthly'
                    ? 'month(s)'
                    : 'day(s)';

                return (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{attendanceCount}</td>
                    <td>
                      {isEditing ? (
                        <div className="salary-field-stack">
                          <select
                            aria-label={`Salary type for ${employee.name}`}
                            value={draft.salaryType}
                            onChange={(event) => {
                              const salaryType = event.target.value;
                              setDraft((previous) => ({
                                ...previous,
                                salaryType,
                                attendanceBased: salaryType === 'Per Day' && previous.attendanceBased,
                                units: salaryType === 'Per Day' ? attendanceCount : 1,
                              }));
                            }}
                          >
                            {salaryTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                          </select>
                          {draft.salaryType === 'Per Day' && (
                            <label className="salary-attendance-toggle">
                              <input
                                type="checkbox"
                                checked={Boolean(draft.attendanceBased)}
                                onChange={(event) => setDraft((previous) => ({
                                  ...previous,
                                  attendanceBased: event.target.checked,
                                  units: event.target.checked ? attendanceCount : previous.units,
                                }))}
                              />
                              Use attendance count
                            </label>
                          )}
                          {!draft.attendanceBased && (
                            <label className="salary-units-field">
                              <span>{draft.salaryType === 'Weekly' ? 'Weeks' : draft.salaryType === 'Monthly' ? 'Months' : 'Days'}</span>
                              <input
                                aria-label={`${unitLabel} for ${employee.name}`}
                                type="number"
                                min="0"
                                step="1"
                                value={draft.units}
                                onChange={(event) => updateDraft('units', event.target.value)}
                              />
                            </label>
                          )}
                        </div>
                      ) : (
                        <div className="salary-value-stack">
                          <strong>{settings.salaryType}</strong>
                          <span>{settings.attendanceBased ? `${attendanceCount} attendance day(s)` : `${settings.units} ${unitLabel}`}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <label className="salary-amount-field">
                          <span>₹</span>
                          <input
                            aria-label={`Salary amount for ${employee.name}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft.amount}
                            onChange={(event) => updateDraft('amount', event.target.value)}
                          />
                        </label>
                      ) : formatCurrency(settings.amount)}
                    </td>
                    <td>
                      {isEditing ? (
                        <div className="salary-field-stack">
                          <label className="salary-amount-field">
                            <span>Advance ₹</span>
                            <input
                              aria-label={`Advance for ${employee.name}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.advance}
                              onChange={(event) => updateDraft('advance', event.target.value)}
                            />
                          </label>
                          <label className="salary-amount-field">
                            <span>Deduction ₹</span>
                            <input
                              aria-label={`Other deductions for ${employee.name}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.deduction}
                              onChange={(event) => updateDraft('deduction', event.target.value)}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="salary-value-stack">
                          <span>Advance {formatCurrency(settings.advance)}</span>
                          <span>Deduction {formatCurrency(settings.deduction)}</span>
                        </div>
                      )}
                    </td>
                    <td className={payable < 0 ? 'salary-negative' : 'salary-payable'}>
                      <strong>{formatCurrency(payable)}</strong>
                      <span>Earned {formatCurrency(earned)}</span>
                    </td>
                    <td>
                      {isEditing ? (
                        <button
                          type="button"
                          className="primary-button salary-action-button"
                          onClick={() => handleSave(employee)}
                        >
                          <FiSave /> Save
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="secondary-button salary-action-button"
                          onClick={() => startEditing(employee, attendanceCount)}
                        >
                          <FiEdit2 /> Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!employees.length && (
                <tr><td className="salary-empty-state" colSpan="7">No employee records are available. Add employees from Attendance.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalaryPage;
