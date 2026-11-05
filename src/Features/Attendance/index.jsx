import { useState } from 'react';
import {
  FiCheckCircle,
  FiClock,
  FiEdit2,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiXCircle,
} from 'react-icons/fi';
import { useERP } from '../../State/ERPContext';
import './Attendance.css';

const selectableAttendanceStatuses = ['Present', 'Late', 'Absent'];
const standardWorkingHours = 8;
const salaryPeriods = ['Per Day', '7 Days / Weekly', '15 Days / Bi-weekly', 'Monthly'];

const getDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (date) => new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date(`${date}T00:00:00`));

function getAttendanceValues(record) {
  const savedStatus = typeof record === 'string' ? record : record?.status || '';
  const status = savedStatus === 'Not Marked' ? '' : savedStatus;
  if (status === 'Absent' || status === 'Leave') {
    return { status, inTime: '', outTime: '', workingHours: 0, overtimeHours: 0 };
  }

  const inTime = record?.inTime || '';
  const outTime = record?.outTime || '';
  let workingHours = 0;
  if (/^\d{2}:\d{2}$/.test(inTime) && /^\d{2}:\d{2}$/.test(outTime)) {
    const [inHour, inMinute] = inTime.split(':').map(Number);
    const [outHour, outMinute] = outTime.split(':').map(Number);
    const startMinutes = inHour * 60 + inMinute;
    let endMinutes = outHour * 60 + outMinute;
    if (endMinutes < startMinutes) endMinutes += 24 * 60;
    workingHours = Math.round(((endMinutes - startMinutes) / 60) * 100) / 100;
  }
  return {
    status,
    inTime,
    outTime,
    workingHours,
    overtimeHours: Math.max(0, Math.round((workingHours - standardWorkingHours) * 100) / 100),
  };
}

function AttendancePage() {
  const {
    employees = [],
    attendance = {},
    attendanceLoading = false,
    attendanceError = '',
    addEmployee,
    updateEmployee,
    deleteEmployee,
    saveAttendance,
  } = useERP();
  const [selectedDate, setSelectedDate] = useState(getDateString);
  const [isDateSelected, setIsDateSelected] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [draftRows, setDraftRows] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [isEmployeeFormOpen, setIsEmployeeFormOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    address: '',
    phone: '',
    salary: '',
    salaryPeriod: 'Monthly',
  });

  const dayRecords = attendance?.[selectedDate] || {};
  const rows = employees.map((employee) => {
    const saved = getAttendanceValues(dayRecords[employee.id]);
    return {
      ...employee,
      ...saved,
      employeeId: employee.id,
      employeeName: employee.name,
      mobileNumber: employee.phone || '',
      remarks: typeof dayRecords[employee.id] === 'object'
        ? dayRecords[employee.id]?.remarks || ''
        : '',
      halfDay: typeof dayRecords[employee.id] === 'object'
        ? Boolean(dayRecords[employee.id]?.halfDay)
        : false,
      lateByMinutes: typeof dayRecords[employee.id] === 'object'
        ? dayRecords[employee.id]?.lateByMinutes ?? ''
        : '',
      id: String(employee.id),
    };
  });

  const visibleRows = rows
    .map((row) => ({ ...row, ...(draftRows[row.id] || {}) }))
    .filter((row) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || [
        row.employeeId,
        row.employeeName,
        row.mobileNumber,
      ].some((value) => String(value || '').toLowerCase().includes(query));
      const matchesStatus = !statusFilter
        || (statusFilter === 'Unmarked' ? !row.status : row.status === statusFilter);
      return matchesSearch && matchesStatus;
    });

  const today = getDateString();
  const dateCards = [...new Set([
    today,
    ...Object.keys(attendance || {}).filter((date) => (
      date < today && /^\d{4}-\d{2}-\d{2}$/.test(date)
    )),
    ...(selectedDate < today ? [selectedDate] : []),
  ])].sort((first, second) => first === today ? -1 : second === today ? 1 : second.localeCompare(first));
  const getDateCounts = (date) => employees.reduce((result, employee) => {
    const status = getAttendanceValues(attendance?.[date]?.[employee.id]).status;
    if (status === 'Present' || status === 'Absent' || status === 'Late') result[status] += 1;
    return result;
  }, { Present: 0, Absent: 0, Late: 0 });

  const changeDate = (date) => {
    if (!date) return;
    if (date !== selectedDate) setDraftRows({});
    setSelectedDate(date);
    setIsDateSelected(true);
    setSearchQuery('');
    setStatusFilter('');
    setFeedback({ type: '', text: '' });
  };

  const saveAllAttendance = async () => {
    if (attendanceLoading || attendanceError) {
      setFeedback({
        type: 'error',
        text: attendanceError || 'Attendance is still loading. Please wait before saving.',
      });
      return;
    }

    const changedRows = rows
      .filter((row) => Boolean(draftRows[row.id]))
      .map((row) => ({ ...row, ...draftRows[row.id] }));
    const records = {};
    for (const row of changedRows) {
      if (!row.status) {
        setFeedback({ type: 'error', text: `Choose an attendance status for ${row.employeeName} before saving.` });
        return;
      }
      const values = getAttendanceValues(row);
      records[row.employeeId] = {
        status: values.status,
        inTime: values.inTime,
        outTime: values.outTime,
        workingHours: values.workingHours,
        overtimeHours: values.overtimeHours,
        remarks: row.remarks || '',
        halfDay: Boolean(row.halfDay),
        lateByMinutes: row.lateByMinutes === '' ? '' : Number(row.lateByMinutes),
      };
    }
    if (Object.keys(records).length === 0) return;

    setIsSaving(true);
    try {
      await saveAttendance(selectedDate, records);
      setDraftRows((previous) => {
        const next = { ...previous };
        changedRows.forEach((row) => delete next[row.id]);
        return next;
      });
      setFeedback({
        type: 'success',
        text: `Attendance saved for ${changedRows.length} employee${changedRows.length === 1 ? '' : 's'}.`,
      });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to save attendance.' });
    } finally {
      setIsSaving(false);
    }
  };

  const updateRow = (row, field, value) => {
    setFeedback({ type: '', text: '' });
    setDraftRows((current) => ({
      ...current,
      [row.id]: { ...current[row.id], [field]: value },
    }));
  };

  const updateStatus = (row, status) => {
    setFeedback({ type: '', text: '' });
    setDraftRows((current) => ({
      ...current,
      [row.id]: {
        ...current[row.id],
        status,
        ...(status === 'Absent' ? { inTime: '', outTime: '', lateByMinutes: '', halfDay: false } : {}),
      },
    }));
  };

  const openEmployeeForm = (employee = null) => {
    setEditingEmployee(employee);
    setIsEmployeeFormOpen(true);
    setEmployeeForm(employee ? {
      name: employee.name || '',
      address: employee.address || '',
      phone: employee.phone || '',
      salary: employee.salary ?? '',
      salaryPeriod: employee.salaryPeriod || 'Monthly',
    } : {
      name: '',
      address: '',
      phone: '',
      salary: '',
      salaryPeriod: 'Monthly',
    });
  };

  const saveEmployee = (event) => {
    event.preventDefault();
    if (!employeeForm.name.trim() || !employeeForm.phone.trim() || !employeeForm.salary) return;
    const employee = {
      ...employeeForm,
      name: employeeForm.name.trim(),
      phone: employeeForm.phone.trim(),
      salary: Number(employeeForm.salary),
      address: employeeForm.address || 'Not provided',
    };
    try {
      if (editingEmployee) updateEmployee(editingEmployee.id, employee);
      else addEmployee(employee);
      setIsEmployeeFormOpen(false);
      setEditingEmployee(null);
      setFeedback({ type: 'success', text: 'Employee details saved.' });
    } catch (error) {
      setFeedback({ type: 'error', text: error.message || 'Unable to save employee details.' });
    }
  };

  return (
    <div className="feature-page attendance-page">
      <div className="feature-header attendance-register-header">
        <div>
          <p className="eyebrow">Workforce</p>
          <h1 className="page-title">{isDateSelected ? `Attendance · ${formatDate(selectedDate)}` : 'Attendance'}</h1>
          <p className="attendance-register-subtitle">
            {isDateSelected ? 'Employee attendance register' : 'Select a date to view or update attendance'}
          </p>
        </div>
        <div className="attendance-register-controls">
          {!isDateSelected && (
            <label>
              <span>Choose date</span>
              <input
                className="attendance-date-input"
                type="date"
                aria-label="Choose attendance date"
                max={today}
                value={selectedDate}
                onChange={(event) => changeDate(event.target.value)}
              />
            </label>
          )}
          <button type="button" className="secondary-button attendance-add-employee" onClick={() => openEmployeeForm()}>
            <FiPlus /> Add Employee
          </button>
        </div>
      </div>

      {(attendanceLoading || attendanceError) && (
        <p className={`attendance-feedback ${attendanceError ? 'error' : ''}`} role={attendanceError ? 'alert' : 'status'}>
          {attendanceError || 'Loading saved attendance…'}
        </p>
      )}

      {!isDateSelected ? (
        <section className="attendance-date-grid" aria-label="Attendance by date">
          {dateCards.map((date) => {
            const dateCounts = getDateCounts(date);
            return (
              <button
                type="button"
                key={date}
                className={`attendance-date-card${date === today ? ' today' : ''}`}
                onClick={() => changeDate(date)}
              >
                <span className="attendance-date-card-heading">
                  <strong>{formatDate(date)}</strong>
                  {date === today && <span className="attendance-today-badge">Today</span>}
                </span>
                <span className="attendance-date-total">
                  <FiUsers aria-hidden="true" /> Total Employees <strong>{employees.length}</strong>
                </span>
                <span className="attendance-date-counts">
                  <span className="present"><FiCheckCircle aria-hidden="true" /> Present <strong>{dateCounts.Present}</strong></span>
                  <span className="absent"><FiXCircle aria-hidden="true" /> Absent <strong>{dateCounts.Absent}</strong></span>
                  <span className="late"><FiClock aria-hidden="true" /> Late <strong>{dateCounts.Late}</strong></span>
                </span>
              </button>
            );
          })}
        </section>
      ) : (

      <section className="content-panel attendance-panel attendance-register-panel" aria-label="Employee attendance register">
        <div className="attendance-register-toolbar">
          <div>
            <button type="button" className="attendance-back-button" onClick={() => setIsDateSelected(false)}>
              All dates
            </button>
            <h3>Daily Register</h3>
            <p>{employees.length} employees · existing saved timings only</p>
          </div>
          <div className="attendance-table-tools">
            <label className="attendance-search">
              <FiSearch aria-hidden="true" />
              <input
                type="search"
                aria-label="Search employees"
                placeholder="Search ID, name or mobile"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            <label className="attendance-filter-select">
              <span className="sr-only">Filter attendance status</span>
              <select aria-label="Filter attendance status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">All statuses</option>
                <option value="Unmarked">Unmarked</option>
                {selectableAttendanceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
          </div>
        </div>
        <div className="attendance-table-scroll">
          <table className="erp-table attendance-table attendance-register-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Mobile Number</th>
                <th>Attendance Status</th>
                <th>In Time</th>
                <th>Out Time</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const employee = employees.find((item) => String(item.id) === String(row.employeeId));
                const setCell = (field, value) => updateRow(row, field, value);
                return (
                  <tr key={row.id}>
                    <td className="attendance-id-cell">{employee?.id ?? '—'}</td>
                    <td className="attendance-name-cell">
                      <span>{row.employeeName}</span>
                      <span className="attendance-employee-actions">
                        <button type="button" aria-label={`Edit ${row.employeeName}`} title="Edit employee" onClick={() => openEmployeeForm(employee)}><FiEdit2 /></button>
                        <button type="button" aria-label={`Delete ${row.employeeName}`} title="Delete employee" onClick={() => deleteEmployee(employee.id)}><FiTrash2 /></button>
                      </span>
                    </td>
                    <td>{row.mobileNumber || '—'}</td>
                    <td>
                      <div className="attendance-status-controls" role="group" aria-label={`Attendance status for ${row.employeeName}`}>
                        {selectableAttendanceStatuses.map((status) => {
                          const StatusIcon = status === 'Present' ? FiCheckCircle : status === 'Late' ? FiClock : FiXCircle;
                          return (
                            <button
                              type="button"
                              key={status}
                              className={`attendance-status-option ${status.toLowerCase()}${row.status === status ? ' selected' : ''}`}
                              aria-label={`${status} for ${row.employeeName}`}
                              aria-pressed={row.status === status}
                              disabled={attendanceLoading || Boolean(attendanceError) || isSaving}
                              onClick={() => updateStatus(row, status)}
                            >
                              <StatusIcon aria-hidden="true" /><span>{status}</span>
                            </button>
                          );
                        })}
                        <label className="attendance-half-day">
                          <input
                            type="checkbox"
                            aria-label={`Half day for ${row.employeeName}`}
                            checked={Boolean(row.halfDay)}
                            disabled={row.status === 'Absent'}
                            onChange={(event) => setCell('halfDay', event.target.checked)}
                          />
                          <span>Half day</span>
                        </label>
                      </div>
                    </td>
                    <td className="attendance-time-cell">
                      {row.status !== 'Absent' && (
                        <>
                          {row.status === 'Late' && (
                            <label className="attendance-late-adjustment">
                              <span>Late by</span>
                              <input
                                type="number"
                                min="0"
                                aria-label={`Late by minutes for ${row.employeeName}`}
                                placeholder="min"
                                value={row.lateByMinutes ?? ''}
                                onChange={(event) => setCell('lateByMinutes', event.target.value)}
                              />
                              <span>min</span>
                            </label>
                          )}
                          <input
                            type="time"
                            aria-label={`In time for ${row.employeeName}`}
                            value={row.inTime || ''}
                            onChange={(event) => setCell('inTime', event.target.value)}
                          />
                        </>
                      )}
                    </td>
                    <td className="attendance-time-cell">
                      {row.status !== 'Absent' && (
                        <input
                          type="time"
                          aria-label={`Out time for ${row.employeeName}`}
                          value={row.outTime || ''}
                          onChange={(event) => setCell('outTime', event.target.value)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
              {visibleRows.length === 0 && (
                <tr><td className="attendance-empty-state" colSpan="6">No employees match the selected filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {feedback.text && (
          <p className={`attendance-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
            {feedback.text}
          </p>
        )}
        <div className="attendance-register-footer">
          <button
            type="button"
            className="secondary-button attendance-add-line-button"
            onClick={saveAllAttendance}
            disabled={attendanceLoading || Boolean(attendanceError)
              || Object.keys(draftRows).length === 0 || isSaving}
          >
            {isSaving ? 'Saving…' : 'Save Attendance'}
          </button>
        </div>
      </section>
      )}

      {isEmployeeFormOpen && (
        <div className="modal-overlay" onClick={() => setIsEmployeeFormOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h3>
              <button type="button" className="modal-close" aria-label="Close employee form" onClick={() => setIsEmployeeFormOpen(false)}>×</button>
            </div>
            <form className="modal-form" onSubmit={saveEmployee}>
              <div className="field-group">
                <label htmlFor="attendance-employee-name">Employee Name</label>
                <input id="attendance-employee-name" type="text" value={employeeForm.name} onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))} required />
              </div>
              <div className="field-group">
                <label htmlFor="attendance-employee-phone">Mobile Number</label>
                <input id="attendance-employee-phone" type="tel" value={employeeForm.phone} onChange={(event) => setEmployeeForm((current) => ({ ...current, phone: event.target.value }))} required />
              </div>
              <div className="field-group">
                <label htmlFor="attendance-employee-address">Address</label>
                <input id="attendance-employee-address" type="text" value={employeeForm.address} onChange={(event) => setEmployeeForm((current) => ({ ...current, address: event.target.value }))} />
              </div>
              <div className="field-group">
                <label htmlFor="attendance-employee-salary">Salary</label>
                <input id="attendance-employee-salary" type="number" min="0" value={employeeForm.salary} onChange={(event) => setEmployeeForm((current) => ({ ...current, salary: event.target.value }))} required />
              </div>
              <div className="field-group">
                <label htmlFor="attendance-employee-period">Salary Payment Period</label>
                <select id="attendance-employee-period" value={employeeForm.salaryPeriod} onChange={(event) => setEmployeeForm((current) => ({ ...current, salaryPeriod: event.target.value }))}>
                  {salaryPeriods.map((period) => <option key={period} value={period}>{period}</option>)}
                </select>
              </div>
              <button type="submit" className="primary-button full-width">Save Employee</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendancePage;
