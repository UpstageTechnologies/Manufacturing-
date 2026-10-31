import { useState } from 'react';
import { FiEdit2, FiSave } from 'react-icons/fi';
import { formatCurrency, formatDate, useERP } from '../../State/ERPContext';
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
    amount: (Number(employee.salary) || 0) / getSalaryPeriodDays(employee),
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

function getPaymentType(settings = {}) {
  const advance = Number(settings.advance) || 0;
  const deduction = Number(settings.deduction) || 0;

  if (advance > 0 && deduction === 0) return 'Advance';
  if (deduction > 0 && advance === 0) return 'Others';
  if (advance > 0 && deduction > 0) return 'Others';
  return 'Salary';
}

function getMonthDayCount(month) {
  if (!/^\d{4}-\d{2}$/.test(month || '')) return 30;
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

function getPeriodUnits(period, customUnits, month) {
  if (period === 'Per Day') return 1;
  if (period === 'Weekly') return 7;
  if (period === 'Bi-weekly') return 14;
  if (period === 'Custom Period') return Number(customUnits) || 0;
  return getMonthDayCount(month);
}

function getPeriodEndDate(period, month, fallbackDate) {
  if (period !== 'Monthly' || !/^\d{4}-\d{2}$/.test(month || '')) return fallbackDate;
  return `${month}-${String(getMonthDayCount(month)).padStart(2, '0')}`;
}

function getSalaryPeriodDays(employee) {
  return {
    'Per Day': 1,
    '7 Days / Weekly': 7,
    Weekly: 7,
    '15 Days / Bi-weekly': 15,
    'Bi-weekly': 15,
    Monthly: 30,
  }[employee?.salaryPeriod] || 30;
}

function getDailyRate(employee, settings, savedSettings, record, useCurrentSettings = false) {
  if (useCurrentSettings && Number.isFinite(Number(settings?.amount))) return Number(settings.amount);
  if (Number.isFinite(Number(savedSettings?.amount))) return Number(savedSettings.amount);
  if (Number.isFinite(Number(record?.salaryPerDay))) return Number(record.salaryPerDay);

  return (Number(employee?.salary) || 0) / getSalaryPeriodDays(employee);
}

function SalaryPage() {
  const {
    employees,
    attendance,
    ledger = [],
    salary = [],
    salarySettings = {},
    saveSalarySettings,
    addSalary,
  } = useERP();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Monthly');
  const [selectedCustomDays, setSelectedCustomDays] = useState('30');
  const [selectedMonth, setSelectedMonth] = useState(getLocalDateString().slice(0, 7));
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    paymentType: 'Salary',
    salaryPerDay: '',
    attendanceBased: false,
    attendancePeriod: '',
    paymentPeriod: 'Monthly',
    customPeriodDays: '',
    advanceAmount: '0',
    deductionAmount: '0',
    workDetails: '',
    date: getLocalDateString(),
  });

  const startEditing = (employee) => {
    const settings = getSettings(employee, ledger, salarySettings[employee.id]);
    const savedSalaryRecord = salary.find((record) => (
      record.employeeId === employee.id || record.employee === employee.name
    ));
    const savedDailyRate = salarySettings[employee.id]
      ? settings.amount
      : savedSalaryRecord?.salaryPerDay ?? settings.amount;
    setEditingId(employee.id);
    setDraft({
      ...settings,
      amount: String(savedDailyRate ?? 0),
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

    if (!Number.isFinite(settings.amount) || settings.amount <= 0
      || !Number.isInteger(settings.units) || settings.units < 1
      || !Number.isFinite(settings.advance) || settings.advance < 0
      || !Number.isFinite(settings.deduction) || settings.deduction < 0
      || !settings.periodEndDate) {
      setError('Enter a positive daily salary, valid payment period, and period end date.');
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

  const handleAddSalary = (event) => {
    event.preventDefault();
    const employee = employees.find((item) => String(item.id) === newRecord.employeeId);
    const dailyRate = Number(newRecord.salaryPerDay);
    const attendanceDays = Number(newRecord.attendancePeriod);
    const advanceAmount = Number(newRecord.advanceAmount);
    const deductionAmount = Number(newRecord.deductionAmount);
    const recordMonth = newRecord.date.slice(0, 7);
    const units = getPeriodUnits(newRecord.paymentPeriod, newRecord.customPeriodDays, recordMonth);
    const calculatedAmount = dailyRate * (newRecord.attendanceBased ? attendanceDays : units);
    const parsedDate = new Date(`${newRecord.date}T00:00:00`);

    if (!employee || !/^\d{4}-\d{2}-\d{2}$/.test(newRecord.date)
      || Number.isNaN(parsedDate.getTime()) || getLocalDateString(parsedDate) !== newRecord.date
      || !Number.isFinite(dailyRate) || dailyRate <= 0
      || !Number.isInteger(attendanceDays) || attendanceDays < 0
      || !Number.isFinite(advanceAmount) || advanceAmount < 0
      || !Number.isFinite(deductionAmount) || deductionAmount < 0
      || !Number.isInteger(units) || units < 1) {
      setError('Choose an employee and date, and enter a positive daily salary, valid attendance days, and payment period.');
      setMessage('');
      return;
    }

    const transactionAmount = newRecord.paymentType === 'Advance'
      ? advanceAmount
      : newRecord.paymentType === 'Others'
        ? deductionAmount
        : calculatedAmount;
    if (transactionAmount <= 0) {
      setError('Enter an amount greater than zero for this salary record type.');
      setMessage('');
      return;
    }

    try {
      addSalary({
        employee: employee.name,
        employeeId: employee.id,
        paymentType: newRecord.paymentType,
        salaryPerDay: dailyRate,
        attendanceBased: newRecord.attendanceBased,
        attendancePeriod: attendanceDays,
        units,
        paymentPeriod: newRecord.paymentPeriod,
        periodEndDate: newRecord.date,
        advanceAmount,
        deductionAmount,
        workDetails: newRecord.workDetails.trim(),
        date: newRecord.date,
        amount: transactionAmount,
        status: newRecord.paymentType === 'Salary' ? 'Paid' : 'Pending',
      });
      setNewRecord((previous) => ({
        ...previous,
        employeeId: '',
        salaryPerDay: '',
        attendancePeriod: '',
        advanceAmount: '0',
        deductionAmount: '0',
        workDetails: '',
        date: getLocalDateString(),
      }));
      setShowAddForm(false);
      setError('');
      setMessage(`Salary record saved for ${employee.name}.`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save salary record.');
      setMessage('');
    }
  };

  const salaryRows = salary.map((record, index) => {
    const employee = employees.find((item) => item.id === record.employeeId || item.name === record.employee);
    const previousRecord = salary.slice(0, index).some((item) => (
      (record.employeeId != null && item.employeeId === record.employeeId)
      || (record.employee && item.employee === record.employee)
    ));
    return { key: record.id, employee, record, showEdit: !previousRecord };
  });
  employees.forEach((employee) => {
    const hasSalaryRecord = salary.some((record) => (
      record.employeeId === employee.id || record.employee === employee.name
    ));
    if (!hasSalaryRecord) {
      salaryRows.push({ key: `employee-${employee.id}`, employee, record: null, showEdit: true });
    }
  });

  const filteredRows = salaryRows.filter(({ employee, record }) => {
    if (!searchQuery.trim()) return true;
    const settings = employee
      ? getSettings(employee, ledger, salarySettings[employee.id])
      : {};
    const text = [
      employee?.name || record?.employee,
      record?.paymentType || getPaymentType(settings),
      record?.date ? formatDate(record.date) : '',
      record?.date || record?.periodEndDate || settings.periodEndDate || '',
      record?.workDetails || '',
      record?.paymentPeriod || employee?.salaryPeriod || '',
      String(record?.amount || ''),
      String(record?.salaryPerDay || ''),
    ].join(' ').toLowerCase();
    return text.includes(searchQuery.trim().toLowerCase());
  });

  const uniqueFilteredEmployees = [...new Map(
    filteredRows
      .filter((row) => row.employee)
      .map((row) => [row.employee.id, row.employee]),
  ).values()];
  const selectedPeriodTotal = uniqueFilteredEmployees.reduce((total, employee) => {
    const settings = getSettings(employee, ledger, salarySettings[employee.id]);
    const employeeRecord = salary.find((record) => (
      record.employeeId === employee.id || record.employee === employee.name
    ));
    const dailyRate = getDailyRate(employee, settings, salarySettings[employee.id], employeeRecord);
    const periodUnits = getPeriodUnits(selectedPeriod, selectedCustomDays, selectedMonth);
    const usesAttendance = employeeRecord?.attendanceBased ?? settings.attendanceBased;
    const periodEndDate = getPeriodEndDate(
      selectedPeriod,
      selectedMonth,
      employeeRecord?.periodEndDate || employeeRecord?.date || settings.periodEndDate,
    );
    const attendanceCount = getPeriodAttendanceCount(
      employee.id,
      attendance,
      periodUnits,
      periodEndDate,
    );
    return total + dailyRate * (usesAttendance ? attendanceCount : periodUnits);
  }, 0);
  const newRecordPeriodUnits = getPeriodUnits(
    newRecord.paymentPeriod,
    newRecord.customPeriodDays,
    newRecord.date.slice(0, 7),
  );
  const newRecordPeriodAmount = (Number(newRecord.salaryPerDay) || 0)
    * (newRecord.attendanceBased ? Number(newRecord.attendancePeriod) || 0 : newRecordPeriodUnits);

  return (
    <div className="feature-page salary-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Payroll</p>
          <h1 className="page-title">Salary</h1>
        </div>

        <div className="salary-header-actions">
          <button
            type="button"
            className="primary-button salary-action-button"
            onClick={() => {
              setShowAddForm((previous) => !previous);
              setError('');
              setMessage('');
            }}
          >
            Add Salary
          </button>
          <label className="salary-search" htmlFor="salary-search">
            <span className="sr-only">Search salary records</span>
            <input
              id="salary-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search employee, date, type"
            />
          </label>
        </div>
      </div>

      {error && <p className="salary-feedback error" role="alert">{error}</p>}
      {message && <p className="salary-feedback success" role="status">{message}</p>}

      {showAddForm && (
        <form className="content-panel salary-form-panel" onSubmit={handleAddSalary}>
          <div className="panel-header">
            <h3>Add Salary Record</h3>
          </div>
          <div className="salary-form-grid">
            <label>
              <span>Employee Name</span>
              <select
                required
                value={newRecord.employeeId}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, employeeId: event.target.value }))}
              >
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>{employee.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Salary Type</span>
              <select
                value={newRecord.paymentType}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, paymentType: event.target.value }))}
              >
                <option>Salary</option>
                <option>Advance</option>
                <option>Others</option>
              </select>
            </label>
            <label>
              <span>Salary Per Day (₹)</span>
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={newRecord.salaryPerDay}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, salaryPerDay: event.target.value }))}
              />
            </label>
            <label>
              <span>{newRecord.paymentPeriod} Salary</span>
              <output className="salary-calculated-amount">{formatCurrency(newRecordPeriodAmount)}</output>
            </label>
            <label>
              <span>Attendance Period (days)</span>
              <input
                required
                type="number"
                min="0"
                step="1"
                value={newRecord.attendancePeriod}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, attendancePeriod: event.target.value }))}
              />
            </label>
            <label className="salary-form-checkbox">
              <span>Calculate from attendance</span>
              <input
                type="checkbox"
                checked={newRecord.attendanceBased}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, attendanceBased: event.target.checked }))}
              />
            </label>
            <label>
              <span>Payment Period</span>
              <select
                value={newRecord.paymentPeriod}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, paymentPeriod: event.target.value }))}
              >
                <option>Per Day</option>
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
                <option>Custom Period</option>
              </select>
            </label>
            {newRecord.paymentPeriod === 'Custom Period' && (
              <label>
                <span>Custom Period (days)</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={newRecord.customPeriodDays}
                  onChange={(event) => setNewRecord((previous) => ({ ...previous, customPeriodDays: event.target.value }))}
                />
              </label>
            )}
            <label>
              <span>Advance Amount (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newRecord.advanceAmount}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, advanceAmount: event.target.value }))}
              />
            </label>
            <label>
              <span>Deduction Amount (₹)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newRecord.deductionAmount}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, deductionAmount: event.target.value }))}
              />
            </label>
            <label>
              <span>Work Details</span>
              <input
                type="text"
                value={newRecord.workDetails}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, workDetails: event.target.value }))}
                placeholder="Salary Cycle or Attendance-based Salary"
              />
            </label>
            <label>
              <span>Date</span>
              <input
                required
                type="date"
                value={newRecord.date}
                onChange={(event) => setNewRecord((previous) => ({ ...previous, date: event.target.value }))}
              />
            </label>
          </div>
          <div className="salary-form-actions">
            <button type="submit" className="primary-button salary-action-button">Save Salary</button>
            <button type="button" className="secondary-button salary-action-button" onClick={() => setShowAddForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="content-panel salary-table-panel">
        <div className="panel-header">
          <div>
            <h3>Employee Salaries</h3>
            <p className="salary-table-caption">Compact payroll overview for employee salary periods and payment activity.</p>
          </div>
          <div className="salary-period-summary">
            <label>
              <span>Salary Period</span>
              <select value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)}>
                <option>Per Day</option>
                <option>Weekly</option>
                <option>Bi-weekly</option>
                <option>Monthly</option>
                <option>Custom Period</option>
              </select>
            </label>
            {selectedPeriod === 'Monthly' && (
              <label>
                <span>Month</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                />
              </label>
            )}
            {selectedPeriod === 'Custom Period' && (
              <label>
                <span>Days</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={selectedCustomDays}
                  onChange={(event) => setSelectedCustomDays(event.target.value)}
                />
              </label>
            )}
            <div className="salary-period-total">
              <small>{selectedPeriod} salary total</small>
              <strong>{formatCurrency(selectedPeriodTotal)}</strong>
            </div>
          </div>
        </div>

        <div className="salary-table-scroll">
          <table className="erp-table salary-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Type</th>
                <th>Salary Per Day</th>
                <th>Salary Amount ({selectedPeriod})</th>
                <th>Attendance Period</th>
                <th>Payment Period</th>
                <th>Remaining Days</th>
                <th>Advance / Deduction</th>
                <th>Work Details</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ key, employee, record, showEdit }) => {
                const settings = employee
                  ? getSettings(employee, ledger, salarySettings[employee.id])
                  : {};
                const isEditing = Boolean(employee && editingId === employee.id);
                const current = isEditing ? draft : settings;
                const periodUnits = Number(isEditing ? current.units : (record?.units ?? settings.units)) || 0;
                const periodEndDate = isEditing
                  ? current.periodEndDate
                  : record?.periodEndDate || record?.date || settings.periodEndDate;
                const attendanceCount = getPeriodAttendanceCount(
                  employee?.id,
                  attendance,
                  periodUnits,
                  periodEndDate,
                );
                const displayedAttendance = !isEditing && record?.attendancePeriod != null
                  ? record.attendancePeriod
                  : attendanceCount;
                const periodStartDate = periodEndDate ? new Date(`${periodEndDate}T00:00:00`) : null;
                const periodStart = periodStartDate && periodUnits > 0
                  ? getLocalDateString(new Date(periodStartDate.setDate(periodStartDate.getDate() - periodUnits + 1)))
                  : '';
                const remainingDays = Math.max(periodUnits - displayedAttendance, 0);
                const paymentType = record ? (record.paymentType || 'Salary') : getPaymentType(current);
                const salaryPerDay = getDailyRate(
                  employee,
                  current,
                  employee && salarySettings[employee.id],
                  record,
                  isEditing,
                );
                const rowPeriodUnits = getPeriodUnits(selectedPeriod, selectedCustomDays, selectedMonth);
                const rowPeriodEndDate = getPeriodEndDate(
                  selectedPeriod,
                  selectedMonth,
                  record?.periodEndDate || record?.date || current.periodEndDate,
                );
                const rowAttendanceCount = getPeriodAttendanceCount(
                  employee?.id,
                  attendance,
                  rowPeriodUnits,
                  rowPeriodEndDate,
                );
                const rowUsesAttendance = record?.attendanceBased ?? current.attendanceBased;
                const periodSalaryAmount = salaryPerDay
                  * (rowUsesAttendance ? rowAttendanceCount : rowPeriodUnits);
                const advanceAmount = Number(record
                  ? record.advanceAmount ?? (showEdit ? current.advance : 0)
                  : current.advance) || 0;
                const deductionAmount = Number(record
                  ? record.deductionAmount ?? (showEdit ? current.deduction : 0)
                  : current.deduction) || 0;
                const workDetails = record?.workDetails
                  || (current.attendanceBased ? 'Attendance-based Salary' : 'Salary Cycle');

                return (
                  <tr key={key}>
                    <td>
                      <div className="salary-name-wrap">
                        <span>{employee?.name || record?.employee || 'Employee unavailable'}</span>
                        {employee && showEdit && (
                          isEditing ? (
                            <button
                              type="button"
                              className="salary-save-button"
                              aria-label={`Save salary settings for ${employee.name}`}
                              title="Save salary settings"
                              onClick={() => handleSave(employee)}
                            >
                              <FiSave aria-hidden="true" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="salary-row-action"
                              aria-label={`Edit salary settings for ${employee.name}`}
                              title="Edit salary settings"
                              onClick={() => startEditing(employee)}
                            >
                              <FiEdit2 aria-hidden="true" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                    <td className="salary-type-cell">{paymentType}</td>
                    <td className="salary-amount-cell">
                      {isEditing ? (
                        <label className="salary-amount-field">
                          <span>₹</span>
                          <input
                            aria-label={`Daily salary for ${employee.name}`}
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={draft.amount}
                            onChange={(event) => updateDraft('amount', event.target.value)}
                          />
                        </label>
                      ) : (
                        formatCurrency(salaryPerDay)
                      )}
                    </td>
                    <td className="salary-amount-cell">
                      {formatCurrency(periodSalaryAmount)}
                    </td>
                    <td className="salary-compact-cell">{displayedAttendance}</td>
                    <td className="salary-period-cell">
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
                            <span>End</span>
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
                            Attendance
                          </label>
                        </div>
                      ) : (
                        <div className="salary-value-stack">
                          <strong>{periodUnits} day(s)</strong>
                          <span>
                            {periodStart && periodEndDate
                              ? `${formatDate(periodStart)} – ${formatDate(periodEndDate)}`
                              : periodEndDate
                                ? `Ends ${formatDate(periodEndDate)}`
                                : 'Set period'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="salary-compact-cell">{remainingDays}</td>
                    <td className="salary-amount-cell">
                      {isEditing ? (
                        <div className="salary-field-stack">
                          <label className="salary-amount-field">
                            <span>Advance</span>
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
                            <span>Deduct</span>
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
                          <span>Advance {formatCurrency(advanceAmount)}</span>
                          <span>Deduct {formatCurrency(deductionAmount)}</span>
                        </div>
                      )}
                    </td>
                    <td className="salary-description-cell">{workDetails}</td>
                    <td className="salary-date-cell">
                      {record?.date || periodEndDate ? formatDate(record?.date || periodEndDate) : '—'}
                    </td>
                  </tr>
                );
              })}

              {!filteredRows.length && (
                <tr>
                  <td className="salary-empty-state" colSpan="10">No salary records match your search.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalaryPage;
