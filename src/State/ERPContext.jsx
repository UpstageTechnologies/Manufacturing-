/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AUTH_CHANGE_EVENT,
  canAccessJournalCategory,
  canAccessPath,
  getCurrentUser,
  recordOwnerActivity,
} from './auth';

const LEGACY_STORAGE_KEY = 'manufacture-erp-data';
const storageKey = (companyId) => `${LEGACY_STORAGE_KEY}-${companyId}`;
const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const initialData = {
  income: [
    { id: 1, title: 'Product Sales', amount: 52000, date: '2026-06-12' },
    { id: 2, title: 'Consulting', amount: 18900, date: '2026-06-09' },
    { id: 3, title: 'Rental Income', amount: 12500, date: '2026-06-06' },
  ],
  expense: [
    { id: 1, title: 'Raw Materials', amount: 38500, date: '2026-06-12' },
    { id: 2, title: 'Logistics', amount: 15200, date: '2026-06-10' },
    { id: 3, title: 'Marketing', amount: 11400, date: '2026-06-08' },
  ],
  inventory: [
    { id: 1, item: 'Steel Rods', qty: 120, price: 890, category: 'Raw Materials' },
    { id: 2, item: 'Cement Bags', qty: 75, price: 340, category: 'Raw Materials' },
    { id: 3, item: 'Electrical Wires', qty: 210, price: 180, category: 'Products' },
    { id: 4, item: 'Paint Buckets', qty: 18, price: 620, category: 'Products' },
  ],
  manufacturingStages: [
    { id: 1, stageName: 'Raw Material Purchase', description: 'Purchase of softwood timber. Timber enters the processing cycle.', workerType: 'Procurement Team', quantity: 5000, unit: 'KG', status: 'Completed', image: '' },
    { id: 2, stageName: 'Cutting & Debarking', description: 'Timber is cut to required size and bark is removed.', workerType: 'Cutting Section', quantity: 4200, unit: 'KG', status: 'Completed', image: '' },
    { id: 3, stageName: 'Peeling', description: 'Timber is processed using peeling machine. Output: Veneer sheets.', workerType: 'Peeling Operator', quantity: 3900, unit: 'KG', status: 'Completed', image: '' },
    { id: 4, stageName: 'Chopping / Match Splint Cutting', description: 'Veneer sheets are chopped into required size. Output: Wet match splints.', workerType: 'Cutting Team', quantity: 2800, unit: 'KG', status: 'In Progress', image: '' },
    { id: 5, stageName: 'Yard Drying', description: 'Wet splints are spread and dried in the yard.', workerType: 'Drying Crew', quantity: 2700, unit: 'KG', status: 'Pending', image: '' },
    { id: 6, stageName: 'Collection & Movement', description: 'Dried splints are collected and moved to sorting or storage.', workerType: 'Logistics Team', quantity: 950, unit: 'Bags', status: 'Pending', image: '' },
    { id: 7, stageName: 'Sorting & Levelling', description: 'Dried splints are separated and levelled.', workerType: 'Quality Team', quantity: 975, unit: 'Bags', status: 'Pending', image: '' },
    { id: 8, stageName: 'Packing', description: 'Sorted splints are packed into bags.', workerType: 'Packing Unit', quantity: 1250, unit: 'Bags', status: 'Pending', image: '' },
    { id: 9, stageName: 'Storage / Dispatch', description: 'Packed material is stored or prepared for dispatch.', workerType: 'Warehouse Team', quantity: 1150, unit: 'Bags', status: 'Pending', image: '' },
  ],
  employees: [
    { id: 1, name: 'Ram', address: '32 nagercoil', phone: '+91 456 738 9432', salary: 5000, salaryPeriod: 'Monthly' },
    { id: 2, name: 'Theva', address: '12 main street', phone: '+91 245 900 7745', salary: 8500, salaryPeriod: 'Monthly' },
    { id: 3, name: 'Priya', address: '7 kanyakumari', phone: '+91 245 812 6630', salary: 8800, salaryPeriod: 'Monthly' },
  ],
  attendance: {},
  holidays: {},
  ledger: [],
  salary: [
    { id: 1, employee: 'Ram', amount: 5000, date: '2026-06-12', status: 'Paid' },
    { id: 2, employee: 'Theva', amount: 8500, date: '2026-06-06', status: 'Pending' },
    { id: 3, employee: 'Priya', amount: 8800, date: '2026-06-01', status: 'Paid' },
  ],
  salarySettings: {},
};

const emptyData = {
  income: [],
  expense: [],
  inventory: [],
  manufacturingStages: [],
  employees: [],
  attendance: {},
  holidays: {},
  ledger: [],
  salary: [],
  salarySettings: {},
  journalEntries: [],
};

function readStoredData(companyId) {
  if (!companyId) return emptyData;
  try {
    const key = storageKey(companyId);
    let stored = localStorage.getItem(key);
    if (!stored && companyId === 'manufacture-demo-company') {
      stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) localStorage.setItem(key, stored);
    }
    if (!stored) return companyId === 'manufacture-demo-company' ? initialData : emptyData;

    const storedData = JSON.parse(stored);
    const companyDefaults = companyId === 'manufacture-demo-company' ? initialData : emptyData;
    const employeeNames = new Map();
    const employees = (storedData.employees || companyDefaults.employees).map((employee) => {
      const nameById = { 1: 'Ram', 2: 'Theva', 3: 'Priya' };
      const name = nameById[employee.id] || employee.name;
      if (employee.name !== name) employeeNames.set(employee.name.toLowerCase(), name);
      const normalizedEmployee = { ...employee, name };
      delete normalizedEmployee.status;
      return normalizedEmployee;
    });
    const renameHistoryEmployee = (record) => {
      const name = employeeNames.get(record.employee?.toLowerCase());
      return name ? { ...record, employee: name } : record;
    };
    return {
      ...(companyId === 'manufacture-demo-company' ? initialData : emptyData),
      ...storedData,
      employees,
      attendance: storedData.attendance && typeof storedData.attendance === 'object' ? storedData.attendance : {},
      holidays: storedData.holidays && typeof storedData.holidays === 'object' ? storedData.holidays : {},
      salary: (storedData.salary || companyDefaults.salary).map(renameHistoryEmployee),
      ledger: (storedData.ledger || companyDefaults.ledger).map(renameHistoryEmployee),
      salarySettings: storedData.salarySettings && typeof storedData.salarySettings === 'object'
        ? storedData.salarySettings
        : {},
      journalEntries: Array.isArray(storedData.journalEntries) ? storedData.journalEntries : [],
    };
  } catch (error) {
    console.error(`Unable to read saved data for company ${companyId}.`, error);
    throw error;
  }
}

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
  const [companyId, setCompanyId] = useState(() => getCurrentUser()?.companyId || '');
  const [data, setData] = useState(() => readStoredData(getCurrentUser()?.companyId));

  useEffect(() => {
    const refreshCompanyData = () => {
      const nextCompanyId = getCurrentUser()?.companyId || '';
      setCompanyId(nextCompanyId);
      setData(readStoredData(nextCompanyId));
    };
    window.addEventListener(AUTH_CHANGE_EVENT, refreshCompanyData);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, refreshCompanyData);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    localStorage.setItem(storageKey(companyId), JSON.stringify(data));
  }, [companyId, data]);

  const assertAccess = (path) => {
    if (!canAccessPath(getCurrentUser()?.role, path)) throw new Error('You do not have permission to change this information.');
  };

  const value = useMemo(() => ({
    ...data,
    addIncome: (record) => { assertAccess('/income'); const id = createId(); setData((prev) => ({ ...prev, income: [{ ...record, id }, ...prev.income] })); recordOwnerActivity('Added income record', 'Income', id); },
    deleteIncome: (id) => { assertAccess('/income'); setData((prev) => ({ ...prev, income: prev.income.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted income record', 'Income', id); },
    addExpense: (record) => { assertAccess('/expense'); const id = createId(); setData((prev) => ({ ...prev, expense: [{ ...record, id }, ...prev.expense] })); recordOwnerActivity('Added expense record', 'Expense', id); },
    deleteExpense: (id) => { assertAccess('/expense'); setData((prev) => ({ ...prev, expense: prev.expense.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted expense record', 'Expense', id); },
    addInventory: (record) => { assertAccess('/inventory'); const id = createId(); setData((prev) => ({ ...prev, inventory: [{ ...record, id }, ...prev.inventory] })); recordOwnerActivity('Added inventory item', 'Inventory', id); },
    updateInventory: (id, record) => { assertAccess('/inventory'); setData((prev) => ({ ...prev, inventory: prev.inventory.map((item) => item.id === id ? { ...item, ...record } : item) })); recordOwnerActivity('Updated inventory item', 'Inventory', id); },
    deleteInventory: (id) => { assertAccess('/inventory'); setData((prev) => ({ ...prev, inventory: prev.inventory.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted inventory item', 'Inventory', id); },
    addManufacturingStage: (record) => { assertAccess('/inventory'); const id = createId(); setData((prev) => ({ ...prev, manufacturingStages: [...prev.manufacturingStages, { ...record, id }] })); recordOwnerActivity('Added manufacturing stage', 'Inventory', id); },
    updateManufacturingStage: (id, record) => { assertAccess('/inventory'); setData((prev) => ({ ...prev, manufacturingStages: prev.manufacturingStages.map((item) => item.id === id ? { ...item, ...record } : item) })); recordOwnerActivity('Updated manufacturing stage', 'Inventory', id); },
    deleteManufacturingStage: (id) => { assertAccess('/inventory'); setData((prev) => ({ ...prev, manufacturingStages: prev.manufacturingStages.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted manufacturing stage', 'Inventory', id); },
    addEmployee: (record) => { assertAccess('/attendance'); const id = createId(); setData((prev) => ({ ...prev, employees: [{ ...record, id }, ...prev.employees] })); recordOwnerActivity('Added employee', 'Attendance', id); },
    updateEmployee: (id, record) => { assertAccess('/attendance'); setData((prev) => ({ ...prev, employees: prev.employees.map((item) => item.id === id ? { ...item, ...record } : item) })); recordOwnerActivity('Updated employee', 'Attendance', id); },
    deleteEmployee: (id) => { assertAccess('/attendance'); setData((prev) => ({ ...prev, employees: prev.employees.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted employee', 'Attendance', id); },
    saveAttendance: (date, records) => {
      assertAccess('/attendance');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !records || typeof records !== 'object') {
        throw new Error('Choose a valid attendance date and records before saving.');
      }
      setData((prev) => ({
        ...prev,
        attendance: {
          ...(prev.attendance || {}),
          [date]: { ...(prev.attendance?.[date] || {}), ...records },
        },
      }));
      recordOwnerActivity('Updated attendance', 'Attendance', date);
    },
    setCompanyHoliday: (date, isHoliday) => {
      assertAccess('/attendance');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Choose a valid holiday date.');
      setData((prev) => ({
        ...prev,
        holidays: { ...(prev.holidays || {}), [date]: Boolean(isHoliday) },
      }));
      recordOwnerActivity(isHoliday ? 'Marked company holiday' : 'Removed company holiday', 'Attendance', date);
    },
    addLedgerEntry: (record) => { assertAccess('/salary'); const id = createId(); setData((prev) => ({ ...prev, ledger: [{ ...record, id }, ...prev.ledger] })); recordOwnerActivity('Added salary ledger entry', 'Salary', id); },
    addSalary: (record) => { assertAccess('/salary'); const id = createId(); setData((prev) => ({ ...prev, salary: [{ ...record, id }, ...prev.salary] })); recordOwnerActivity('Updated salary information', 'Salary', id); },
    saveSalarySettings: (employeeId, settings) => {
      assertAccess('/salary');
      if (!data.employees.some((employee) => employee.id === employeeId)) {
        throw new Error('This employee record is no longer available.');
      }
      const values = [settings.amount, settings.units, settings.advance, settings.deduction];
      if (values.some((value) => !Number.isFinite(Number(value)) || Number(value) < 0)
        || !Number.isInteger(Number(settings.units)) || Number(settings.units) < 1
        || !/^\d{4}-\d{2}-\d{2}$/.test(settings.periodEndDate)) {
        throw new Error('Enter a valid daily salary, payment period, and period end date.');
      }
      const savedSettings = {
        amount: Number(settings.amount),
        units: Number(settings.units),
        attendanceBased: Boolean(settings.attendanceBased),
        periodEndDate: settings.periodEndDate,
        advance: Number(settings.advance),
        deduction: Number(settings.deduction),
      };
      setData((previous) => ({
        ...previous,
        salarySettings: {
          ...(previous.salarySettings || {}),
          [employeeId]: savedSettings,
        },
      }));
      recordOwnerActivity('Updated salary settings', 'Salary', employeeId);
    },
    saveJournalEntry: (record, existingId = null) => {
      const user = getCurrentUser();
      if (!canAccessPath(user?.role, '/journal-entry')
        || !canAccessJournalCategory(user?.role, record.category, record.expenseType)) {
        throw new Error('You do not have permission to save this journal entry.');
      }
      const oldEntry = existingId ? data.journalEntries.find((entry) => entry.id === existingId) : null;
      if (existingId && !oldEntry) throw new Error('This journal entry no longer exists.');
      if (oldEntry && !canAccessJournalCategory(user.role, oldEntry.category, oldEntry.expenseType)) {
        throw new Error('You do not have permission to edit this journal entry.');
      }
      if (!record.date || !record.title?.trim() || !record.category || !Number.isFinite(Number(record.amount)) || Number(record.amount) <= 0) {
        throw new Error('Enter a date, description, category, and amount greater than zero.');
      }
      if (record.category === 'Inventory' && (!record.inventoryItem?.trim()
        || !Number.isFinite(Number(record.quantity)) || Number(record.quantity) <= 0)) {
        throw new Error('Enter an inventory item and a quantity greater than zero.');
      }
      if (record.category === 'Expense' && record.expenseType === 'Salary' && !record.employee?.trim()) {
        throw new Error('Choose an employee for the salary payment.');
      }
      const id = existingId || createId();
      let linkedSalaryId;
      setData((previous) => {
        const old = previous.journalEntries.find((entry) => entry.id === id);
        const entries = old
          ? previous.journalEntries.map((entry) => entry.id === id ? { ...record, id, title: record.title.trim(), amount: Number(record.amount) } : entry)
          : [{ ...record, id, title: record.title.trim(), amount: Number(record.amount) }, ...previous.journalEntries];
        const withoutLinked = (items) => items.filter((item) => item.journalEntryId !== id);
        const next = {
          ...previous,
          journalEntries: entries,
          income: withoutLinked(previous.income),
          expense: withoutLinked(previous.expense),
          inventory: withoutLinked(previous.inventory),
          salary: withoutLinked(previous.salary),
        };
        const saved = entries.find((entry) => entry.id === id);
        if (saved.category === 'Income') {
          next.income = [{ id: old?.linkedIncomeId || createId(), journalEntryId: id, title: saved.title, amount: saved.amount, date: saved.date }, ...next.income];
        } else if (saved.category === 'Expense') {
          next.expense = [{
            id: old?.linkedExpenseId || createId(),
            journalEntryId: id,
            title: saved.title,
            type: saved.expenseType,
            amount: saved.amount,
            date: saved.date,
          }, ...next.expense];
          if (saved.expenseType === 'Salary') {
            linkedSalaryId = old?.linkedSalaryId || createId();
            next.salary = [{
              id: linkedSalaryId,
              journalEntryId: id,
              employee: saved.employee,
              amount: saved.amount,
              date: saved.date,
              status: 'Paid',
            }, ...next.salary];
          }
        } else {
          next.inventory = [{
            id: old?.linkedInventoryId || createId(),
            journalEntryId: id,
            item: saved.inventoryItem.trim(),
            qty: Number(saved.quantity),
            price: Number(saved.amount) / Number(saved.quantity),
            category: saved.inventoryCategory || 'Materials',
            date: saved.date,
          }, ...next.inventory];
        }
        const entryWithLinks = {
          ...saved,
          linkedIncomeId: saved.category === 'Income' ? next.income[0].id : undefined,
          linkedExpenseId: saved.category === 'Expense' ? next.expense[0].id : undefined,
          linkedSalaryId: saved.category === 'Expense' && saved.expenseType === 'Salary' ? linkedSalaryId : undefined,
          linkedInventoryId: saved.category === 'Inventory' ? next.inventory[0].id : undefined,
        };
        next.journalEntries = entries.map((entry) => entry.id === id ? entryWithLinks : entry);
        return next;
      });
      recordOwnerActivity(existingId ? 'Updated journal entry' : 'Added journal entry', 'Journal Entry', id);
      return id;
    },
    deleteJournalEntry: (id) => {
      const user = getCurrentUser();
      const entry = data.journalEntries.find((item) => item.id === id);
      if (!entry) throw new Error('This journal entry no longer exists.');
      if (!canAccessJournalCategory(user?.role, entry.category, entry.expenseType)) {
        throw new Error('You do not have permission to delete this journal entry.');
      }
      setData((previous) => {
        const withoutLinked = (items) => items.filter((item) => item.journalEntryId !== id);
        return {
          ...previous,
          journalEntries: previous.journalEntries.filter((item) => item.id !== id),
          income: withoutLinked(previous.income),
          expense: withoutLinked(previous.expense),
          inventory: withoutLinked(previous.inventory),
          salary: withoutLinked(previous.salary),
        };
      });
      recordOwnerActivity('Deleted journal entry', 'Journal Entry', id);
    },
  }), [data]);

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used inside ERPProvider');
  return context;
}

export function calculateEmployeePayroll(employee, attendance = {}, ledger = [], salary = []) {
  if (!employee) {
    return { presentDays: 0, earned: 0, advances: 0, deductions: 0, other: 0, paid: 0, balance: 0 };
  }

  const periodDays = {
    'Per Day': 1,
    '7 Days / Weekly': 7,
    '15 Days / Bi-weekly': 15,
    Monthly: 30,
  }[employee.salaryPeriod] || 30;
  const presentDays = Object.values(attendance || {}).reduce((total, dayRecords) => {
    const status = dayRecords?.[employee.id];
    return total + (status === 'Present' || status === 'Late' ? 1 : 0);
  }, 0);
  const earned = (Number(employee.salary || 0) / periodDays) * presentDays;
  const employeeLedger = (ledger || []).filter((entry) => entry.employee === employee.name);
  const advances = employeeLedger
    .filter((entry) => !entry.type || entry.type === 'Advance')
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const deductions = employeeLedger
    .filter((entry) => entry.type === 'Deduction' || entry.type === 'Pattu')
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const other = employeeLedger
    .filter((entry) => entry.type === 'Other')
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const salaryPaid = (salary || [])
    .filter((record) => record.employee === employee.name && record.status === 'Paid')
    .reduce((total, record) => total + Number(record.amount || 0), 0);
  const paid = advances + salaryPaid;

  return { presentDays, earned, advances, deductions, other, paid, balance: earned - paid - deductions };
}

export const formatCurrency = (amount) => `₹ ${Number(amount).toLocaleString('en-IN')}`;
export const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });