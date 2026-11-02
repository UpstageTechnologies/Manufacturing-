import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { formatCurrency, useERP } from '../../State/ERPContext';
import './Salary.css';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

function getAttendanceSummary(employeeId, date, attendance) {
  if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(date || '')) {
    return { workingDays: 0, overtimeHours: 0 };
  }

  const [year, month] = date.split('-').map(Number);
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
  return Object.entries(attendance || {}).reduce((summary, [attendanceDate, dayRecords]) => {
    if (!attendanceDate.startsWith(monthPrefix)) return summary;
    const record = dayRecords?.[employeeId];
    const status = typeof record === 'string' ? record : record?.status;
    if (status === 'Present' || status === 'Late') summary.workingDays += 1;
    const hours = typeof record === 'object'
      ? Number(record.overtimeHours ?? record.otHours ?? record.overtime ?? record.ot ?? 0)
      : 0;
    if (Number.isFinite(hours) && hours > 0) summary.overtimeHours += hours;
    return summary;
  }, { workingDays: 0, overtimeHours: 0 });
}

function getEmployeeLedger(employee, ledger) {
  if (!employee) return [];
  return ledger.filter((entry) => (
    (entry.employeeId != null && String(entry.employeeId) === String(employee.id))
    || entry.employee === employee.name
  ));
}

function getLedgerAmounts(employee, ledger) {
  const entries = getEmployeeLedger(employee, ledger);
  return {
    advanceAmount: entries
      .filter((entry) => !entry.type || entry.type === 'Advance')
      .reduce((total, entry) => total + (Number(entry.amount) || 0), 0),
    returnAmount: entries
      .filter((entry) => ['Deduction', 'Pattu', 'Other', 'Return'].includes(entry.type))
      .reduce((total, entry) => total + (Number(entry.amount) || 0), 0),
  };
}

function getDailySalary(employee) {
  return (Number(employee?.salary) || 0) / getSalaryPeriodDays(employee);
}

function getRowValues(row, employee) {
  const dailySalary = Number.isFinite(Number(row.salaryPerDay))
    ? Number(row.salaryPerDay)
    : getDailySalary(employee);
  const workingDays = Math.max(0, Number(row.workingDays) || 0);
  const overtimeHours = Math.max(0, Number(row.overtimeHours) || 0);
  const basicSalary = workingDays * dailySalary;
  const overtimeSalary = overtimeHours * (dailySalary / 8);
  const totalSalary = basicSalary + overtimeSalary;
  const advanceAmount = Math.max(0, Number(row.advanceAmount) || 0);
  const returnAmount = Math.max(0, Number(row.returnAmount) || 0);

  return {
    dailySalary,
    workingDays,
    overtimeHours,
    basicSalary,
    overtimeSalary,
    totalSalary,
    advanceAmount,
    returnAmount,
    remainingPayable: totalSalary - advanceAmount - returnAmount,
  };
}

function SalaryPage() {
  const {
    employees = [],
    attendance = {},
    ledger = [],
    salary = [],
    addSalary,
    updateSalary,
  } = useERP();
  const [newLine, setNewLine] = useState(null);
  const [draftRows, setDraftRows] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const employeeById = (id) => employees.find((employee) => String(employee.id) === String(id));
  const rows = salary.map((record) => {
    const employee = employeeById(record.employeeId)
      || employees.find((item) => item.name === record.employee);
    const date = record.date || getLocalDateString();
    return {
      ...record,
      ...getAttendanceSummary(employee?.id, date, attendance),
      ...getLedgerAmounts(employee, ledger),
      ...record,
      workingDays: record.workingDays ?? getAttendanceSummary(employee?.id, date, attendance).workingDays,
      overtimeHours: record.overtimeHours ?? getAttendanceSummary(employee?.id, date, attendance).overtimeHours,
      salaryPerDay: record.salaryPerDay ?? getDailySalary(employee),
      advanceAmount: record.advanceAmount ?? getLedgerAmounts(employee, ledger).advanceAmount,
      returnAmount: record.returnAmount ?? getLedgerAmounts(employee, ledger).returnAmount,
      isNew: false,
    };
  });
  employees.forEach((employee) => {
    const hasSalaryRow = salary.some((record) => (
      String(record.employeeId) === String(employee.id) || record.employee === employee.name
    ));
    if (!hasSalaryRow) {
      rows.push({
        id: `employee-${employee.id}`,
        employeeId: employee.id,
        employee: employee.name,
        date: getLocalDateString(),
        ...getAttendanceSummary(employee.id, getLocalDateString(), attendance),
        ...getLedgerAmounts(employee, ledger),
        isNew: true,
      });
    }
  });
  if (newLine) rows.push({ ...newLine, isNew: true, isBlankLine: true });
  const rowsWithDrafts = rows.map((row) => ({
    ...row,
    ...(!row.isBlankLine ? draftRows[row.id] : {}),
  }));

  const persistRow = (row, patch) => {
    const employee = employeeById(patch.employeeId ?? row.employeeId);
    if (!employee) {
      if (row.isBlankLine) {
        setNewLine((current) => ({ ...current, ...patch }));
        setError('');
        setMessage('');
      } else {
        setError('Choose an employee before saving this salary line.');
        setMessage('');
      }
      return;
    }

    const date = patch.date ?? row.date ?? getLocalDateString();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError('Choose a valid date for this salary line.');
      setMessage('');
      return;
    }
    const employeeChanged = patch.employeeId != null
      && String(patch.employeeId) !== String(row.employeeId);
    const attendanceSummary = employeeChanged || patch.date
      ? getAttendanceSummary(employee.id, date, attendance)
      : {};
    const ledgerAmounts = employeeChanged ? getLedgerAmounts(employee, ledger) : {};
    const dailySalary = getDailySalary(employee);
    const updated = {
      ...row,
      ...attendanceSummary,
      ...ledgerAmounts,
      ...patch,
      employeeId: employee.id,
      employee: employee.name,
      date,
      salaryPerDay: dailySalary,
      status: row.status || 'Pending',
      isNew: undefined,
      isBlankLine: undefined,
    };
    const values = getRowValues(updated, employee);
    const record = {
      ...updated,
      ...values,
      amount: values.totalSalary,
      paymentType: 'Salary',
    };
    delete record.isNew;
    delete record.isBlankLine;

    try {
      if (row.isBlankLine) {
        addSalary(record);
        setNewLine(null);
      } else if (String(row.id).startsWith('employee-')) {
        addSalary(record);
      } else {
        updateSalary(row.id, record);
      }
      setDraftRows((previous) => {
        const next = { ...previous };
        delete next[row.id];
        return next;
      });
      setError('');
      setMessage(`Salary register updated for ${employee.name}.`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this salary line.');
      setMessage('');
    }
  };

  const handleNewLineChange = (field, value) => {
    setNewLine((current) => ({ ...current, [field]: value }));
  };

  const renderRow = (row) => {
    const employee = employeeById(row.employeeId)
      || employees.find((item) => item.name === row.employee);
    const values = getRowValues(row, employee);
    const label = employee?.name || 'salary line';
    const onChange = (field, value) => {
      if (row.isBlankLine) {
        handleNewLineChange(field, value);
      } else {
        const selectedEmployee = employeeById(row.employeeId)
          || employees.find((item) => item.name === row.employee);
        const dateAttendance = field === 'date' && selectedEmployee
          ? getAttendanceSummary(selectedEmployee.id, value, attendance)
          : {};
        setDraftRows((previous) => ({
          ...previous,
          [row.id]: { ...previous[row.id], ...dateAttendance, [field]: value },
        }));
      }
    };
    const saveDraft = () => {
      if (row.isBlankLine) return;
      persistRow(row, {});
    };

    return (
      <tr key={row.isBlankLine ? 'new-line' : row.id}>
        <td>
          <input
            aria-label={`Date for ${label}`}
            type="date"
            value={row.date || getLocalDateString()}
            onChange={(event) => onChange('date', event.target.value)}
            onBlur={saveDraft}
          />
        </td>
        <td>
          <select
            aria-label={`Employee for ${label}`}
            value={employee?.id ?? ''}
            onChange={(event) => {
              const nextEmployee = employeeById(event.target.value);
              if (!nextEmployee) {
                if (row.isBlankLine) handleNewLineChange('employeeId', '');
                return;
              }
              if (row.isBlankLine) {
                const date = row.date || getLocalDateString();
                const attendanceSummary = getAttendanceSummary(nextEmployee.id, date, attendance);
                const ledgerAmounts = getLedgerAmounts(nextEmployee, ledger);
                const initialRecord = {
                  ...row,
                  employeeId: nextEmployee.id,
                  employee: nextEmployee.name,
                  date,
                  ...attendanceSummary,
                  ...ledgerAmounts,
                  salaryPerDay: getDailySalary(nextEmployee),
                };
                const initialValues = getRowValues(initialRecord, nextEmployee);
                const record = {
                  ...initialRecord,
                  ...initialValues,
                  amount: initialValues.totalSalary,
                  paymentType: 'Salary',
                  status: 'Pending',
                };
                try {
                  addSalary(record);
                  setNewLine(null);
                  setError('');
                  setMessage(`Salary register updated for ${nextEmployee.name}.`);
                } catch (saveError) {
                  setError(saveError.message || 'Unable to save this salary line.');
                  setMessage('');
                }
              } else {
                onChange('employeeId', event.target.value);
              }
            }}
          >
            <option value="">Select employee</option>
            {employees.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </td>
        <td>
          <input
            aria-label={`Working days for ${label}`}
            type="number"
            min="0"
            step="0.5"
            value={row.workingDays ?? values.workingDays}
            onChange={(event) => onChange('workingDays', event.target.value)}
            onBlur={saveDraft}
          />
        </td>
        <td>
          <input
            aria-label={`Overtime hours for ${label}`}
            type="number"
            min="0"
            step="0.25"
            value={row.overtimeHours ?? 0}
            onChange={(event) => onChange('overtimeHours', event.target.value)}
            onBlur={saveDraft}
          />
        </td>
        <td className="salary-calculated-cell">{formatCurrency(values.basicSalary)}</td>
        <td className="salary-calculated-cell">{formatCurrency(values.overtimeSalary)}</td>
        <td className="salary-calculated-cell salary-total-cell">
          {formatCurrency(values.totalSalary)}
          <span className="salary-remaining-inline">Payable {formatCurrency(values.remainingPayable)}</span>
        </td>
        <td>
          <input
            aria-label={`Salary advance for ${label}`}
            type="number"
            min="0"
            step="0.01"
            value={row.advanceAmount ?? values.advanceAmount}
            onChange={(event) => onChange('advanceAmount', event.target.value)}
            onBlur={saveDraft}
          />
        </td>
        <td>
          <input
            aria-label={`Salary return for ${label}`}
            type="number"
            min="0"
            step="0.01"
            value={row.returnAmount ?? 0}
            onChange={(event) => onChange('returnAmount', event.target.value)}
            onBlur={saveDraft}
          />
        </td>
      </tr>
    );
  };

  const totals = rowsWithDrafts.reduce((summary, row) => {
    const employee = employeeById(row.employeeId)
      || employees.find((item) => item.name === row.employee);
    const values = getRowValues(row, employee);
    summary.basicSalary += values.basicSalary;
    summary.overtimeSalary += values.overtimeSalary;
    summary.totalSalary += values.totalSalary;
    summary.advanceAmount += values.advanceAmount;
    summary.returnAmount += values.returnAmount;
    summary.remainingPayable += values.remainingPayable;
    return summary;
  }, {
    basicSalary: 0,
    overtimeSalary: 0,
    totalSalary: 0,
    advanceAmount: 0,
    returnAmount: 0,
    remainingPayable: 0,
  });

  return (
    <div className="feature-page salary-page">
      <div className="feature-header">
        <div>
          <p className="eyebrow">Payroll</p>
          <h1 className="page-title">Salary Register</h1>
        </div>
      </div>

      {error && <p className="salary-feedback error" role="alert">{error}</p>}
      {message && <p className="salary-feedback success" role="status">{message}</p>}

      <section className="content-panel salary-table-panel" aria-label="Salary register">
        <div className="salary-register-heading">
          <div>
            <h3>Employee Payroll Register</h3>
            <p className="salary-table-caption">Attendance and employee salary details are used to calculate each row.</p>
          </div>
        </div>
        <div className="salary-table-scroll">
          <table className="salary-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee Name</th>
                <th>No. of Days</th>
                <th>O.T. (Overtime)</th>
                <th>Salary</th>
                <th>O.T. Salary</th>
                <th>Total Salary</th>
                <th>Salary Advance</th>
                <th>Salary Return</th>
              </tr>
            </thead>
            <tbody>
              {rowsWithDrafts.map(renderRow)}
              {rows.length === 0 && (
                <tr><td className="salary-empty-state" colSpan="9">No employees available. Add employees from Attendance to start the register.</td></tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <th colSpan="4">Register totals</th>
                  <td>{formatCurrency(totals.basicSalary)}</td>
                  <td>{formatCurrency(totals.overtimeSalary)}</td>
                  <td>{formatCurrency(totals.totalSalary)}</td>
                  <td>{formatCurrency(totals.advanceAmount)}</td>
                  <td>{formatCurrency(totals.returnAmount)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <div className="salary-register-footer">
          <button
            type="button"
            className="secondary-button salary-add-line-button"
            onClick={() => {
              if (newLine) {
                setNewLine(null);
                return;
              }
              setNewLine({ date: getLocalDateString(), employeeId: '', workingDays: '', overtimeHours: '0', advanceAmount: '0', returnAmount: '0' });
              setError('');
              setMessage('');
            }}
            disabled={!newLine && employees.length === 0}
          >
            <FiPlus aria-hidden="true" /> {newLine ? 'Cancel New Line' : 'Add New Line'}
          </button>
          <p className="salary-payable-summary">
            Remaining payable <strong>{formatCurrency(totals.remainingPayable)}</strong>
          </p>
        </div>
      </section>
    </div>
  );
}

export default SalaryPage;
