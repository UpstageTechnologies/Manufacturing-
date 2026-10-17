import { useState } from 'react';
import { FiEdit2, FiSave } from 'react-icons/fi';
import { formatCurrency, useERP } from '../../State/ERPContext';
import './Salary.css';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function getDefaultSettings(employee, ledger) {
  const previousEntries = ledger.filter((entry) => entry.employee === employee.name);
  const period = employee.salaryPeriod || '';
  const units = period.includes('7 Days') || period === 'Weekly'
    ? 7
    : period.includes('15 Days') || period.includes('Bi-weekly')
      ? 15
      : period === 'Per Day'
        ? 1
        : 0;

  return {
    amount: Number(employee.salary) || 0,
    units,
    attendanceBased: false,
    periodEndDate: getLocalDateString(),
    advance: previousEntries
      .filter((entry) => !entry.type || entry.type === 'Advance')
      .reduce((total, entry) => total + (Number(entry.amount) || 0), 0),
    deduction: previousEntries
      .filter((entry) => ['Deduction', 'Pattu', 'Other'].includes(entry.type))
      .reduce((total, entry) => total + (Number(entry.amount) || 0), 0),
  };
}

function getSettings(employee, ledger, savedSettings) {
  const defaults = getDefaultSettings(employee, ledger);
  if (!savedSettings) return defaults;

  const legacySettings = !savedSettings.periodEndDate;
  let units = Number(savedSettings.units) || 0;
  if (legacySettings && savedSettings.salaryType === 'Weekly') units *= 7;
  if (legacySettings && savedSettings.salaryType === 'Monthly') units = 0;

  return {
    ...defaults,
    ...savedSettings,
    units,
    attendanceBased: legacySettings
      ? savedSettings.salaryType === 'Per Day' && Boolean(savedSettings.attendanceBased)
      : Boolean(savedSettings.attendanceBased),
    periodEndDate: savedSettings.periodEndDate || getLocalDateString(),
  };
}

function getPeriodAttendanceCount(employeeId, attendance, periodDays, periodEndDate) {
  if (!Number.isInteger(Number(periodDays)) || Number(periodDays) < 1 || !periodEndDate) return 0;
  const endDate = new Date(`${periodEndDate}T00:00:00`);
  if (Number.isNaN(endDate.getTime())) return 0;

  let count = 0;
  for (let offset = 0; offset < Number(periodDays); offset += 1) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - offset);
    const dateString = getLocalDateString(date);
    const status = attendance?.[dateString]?.[employeeId];
    if (status === 'Present' || status === 'Late') count += 1;
  }
  return count;
}

function SalaryPage() {
  const { employees, attendance, ledger = [], salarySettings = {}, saveSalarySettings } = useERP();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const startEditing = (employee) => {
    const settings = getSettings(employee, ledger, salarySettings[employee.id]);
    setEditingId(employee.id);
    setDraft({
      ...settings,
      amount: String(settings.amount ?? 0),
      units: String(settings.units ?? 0),
      advance: String(settings.advance ?? 0),
      deduction: String(settings.deduction ?? 0),
    });
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

    if (!Number.isFinite(settings.amount) || settings.amount < 0
      || !Number.isInteger(settings.units) || settings.units < 1
      || !Number.isFinite(settings.advance) || settings.advance < 0
      || !Number.isFinite(settings.deduction) || settings.deduction < 0
      || !settings.periodEndDate) {
      setError('Enter a valid daily salary, payment period, and period end date.');
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
            <p className="salary-table-caption">Enter daily pay and the exact payment period. Attendance-based pay counts Present and Late records for this employee within the selected date range.</p>
          </div>
        </div>
        <div className="salary-table-scroll">
          <table className="erp-table salary-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Attendance in Period</th>
                <th>Payment Period</th>
                <th>Salary per Day</th>
                <th>Advance / Deduction</th>
                <th>Final Payable Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const settings = getSettings(employee, ledger, salarySettings[employee.id]);
                const isEditing = editingId === employee.id;
                const current = isEditing ? draft : settings;
                const attendanceCount = getPeriodAttendanceCount(
                  employee.id,
                  attendance,
                  Number(current.units),
                  current.periodEndDate,
                );
                const paidDays = current.attendanceBased ? attendanceCount : Number(current.units) || 0;
                const earned = (Number(current.amount) || 0) * paidDays;
                const payable = earned - (Number(current.advance) || 0) - (Number(current.deduction) || 0);
                const periodStartDate = current.periodEndDate ? new Date(`${current.periodEndDate}T00:00:00`) : null;
                const periodStart = periodStartDate && Number(current.units) > 0
                  ? getLocalDateString(new Date(periodStartDate.setDate(periodStartDate.getDate() - Number(current.units) + 1)))
                  : '';

                return (
                  <tr key={employee.id}>
                    <td>{employee.name}</td>
                    <td>{attendanceCount}</td>
                    <td>
                      {isEditing ? (
                        <div className="salary-field-stack">
                          <label className="salary-units-field">
                            <span>Days</span>
                            <input
                              aria-label={`Payment period in days for ${employee.name}`}
                              type="number"
                              min="1"
                              step="1"
                              value={draft.units}
                              onChange={(event) => updateDraft('units', event.target.value)}
                            />
                          </label>
                          <label className="salary-units-field">
                            <span>Period end</span>
                            <input
                              aria-label={`Payment period end date for ${employee.name}`}
                              type="date"
                              value={draft.periodEndDate}
                              onChange={(event) => updateDraft('periodEndDate', event.target.value)}
                            />
                          </label>
                          <label className="salary-attendance-toggle">
                            <input
                              type="checkbox"
                              checked={Boolean(draft.attendanceBased)}
                              onChange={(event) => updateDraft('attendanceBased', event.target.checked)}
                            />
                            Calculate from attendance
                          </label>
                        </div>
                      ) : (
                        <div className="salary-value-stack">
                          <strong>{settings.units} day(s)</strong>
                          <span>{periodStart && current.periodEndDate ? `${periodStart} to ${current.periodEndDate}` : 'Set payment period'}</span>
                          <span>{settings.attendanceBased ? 'Uses attendance' : 'Uses entered days'}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <label className="salary-amount-field">
                          <span>₹</span>
                          <input
                            aria-label={`Daily salary for ${employee.name}`}
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
                          onClick={() => startEditing(employee)}
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
