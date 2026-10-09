/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { recordOwnerActivity } from './auth';

const STORAGE_KEY = 'manufacture-erp-data';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  ledger: [],
  salary: [
    { id: 1, employee: 'Ram', amount: 5000, date: '2026-06-12', status: 'Paid' },
    { id: 2, employee: 'Theva', amount: 8500, date: '2026-06-06', status: 'Pending' },
    { id: 3, employee: 'Priya', amount: 8800, date: '2026-06-01', status: 'Paid' },
  ],
};

function readStoredData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return initialData;

    const storedData = JSON.parse(stored);
    const employeeNames = new Map();
    const employees = (storedData.employees || initialData.employees).map((employee) => {
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
      ...initialData,
      ...storedData,
      employees,
      salary: (storedData.salary || initialData.salary).map(renameHistoryEmployee),
      ledger: (storedData.ledger || initialData.ledger).map(renameHistoryEmployee),
    };
  } catch {
    return initialData;
  }
}

const ERPContext = createContext(null);

export function ERPProvider({ children }) {
  const [data, setData] = useState(readStoredData);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const value = useMemo(() => ({
    ...data,
    addIncome: (record) => { const id = Date.now(); setData((prev) => ({ ...prev, income: [{ ...record, id }, ...prev.income] })); recordOwnerActivity('Added income record', 'Income', id); },
    deleteIncome: (id) => { setData((prev) => ({ ...prev, income: prev.income.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted income record', 'Income', id); },
    addExpense: (record) => { const id = Date.now(); setData((prev) => ({ ...prev, expense: [{ ...record, id }, ...prev.expense] })); recordOwnerActivity('Added expense record', 'Expense', id); },
    deleteExpense: (id) => { setData((prev) => ({ ...prev, expense: prev.expense.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted expense record', 'Expense', id); },
    addInventory: (record) => { const id = Date.now(); setData((prev) => ({ ...prev, inventory: [{ ...record, id }, ...prev.inventory] })); recordOwnerActivity('Added inventory item', 'Inventory', id); },
    updateInventory: (id, record) => { setData((prev) => ({ ...prev, inventory: prev.inventory.map((item) => item.id === id ? { ...item, ...record } : item) })); recordOwnerActivity('Updated inventory item', 'Inventory', id); },
    deleteInventory: (id) => { setData((prev) => ({ ...prev, inventory: prev.inventory.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted inventory item', 'Inventory', id); },
    addManufacturingStage: (record) => { const id = Date.now(); setData((prev) => ({ ...prev, manufacturingStages: [...prev.manufacturingStages, { ...record, id }] })); recordOwnerActivity('Added manufacturing stage', 'Inventory', id); },
    updateManufacturingStage: (id, record) => { setData((prev) => ({ ...prev, manufacturingStages: prev.manufacturingStages.map((item) => item.id === id ? { ...item, ...record } : item) })); recordOwnerActivity('Updated manufacturing stage', 'Inventory', id); },
    deleteManufacturingStage: (id) => { setData((prev) => ({ ...prev, manufacturingStages: prev.manufacturingStages.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted manufacturing stage', 'Inventory', id); },
    addEmployee: (record) => { const id = Date.now(); setData((prev) => ({ ...prev, employees: [{ ...record, id }, ...prev.employees] })); recordOwnerActivity('Added employee', 'Attendance', id); },
    updateEmployee: (id, record) => { setData((prev) => ({ ...prev, employees: prev.employees.map((item) => item.id === id ? { ...item, ...record } : item) })); recordOwnerActivity('Updated employee', 'Attendance', id); },
    deleteEmployee: (id) => { setData((prev) => ({ ...prev, employees: prev.employees.filter((item) => item.id !== id) })); recordOwnerActivity('Deleted employee', 'Attendance', id); },
    saveAttendance: (date, records) => {
      if (date !== getLocalDateString()) return;
      setData((prev) => ({
        ...prev,
        attendance: {
          ...(prev.attendance || {}),
          [date]: { ...(prev.attendance?.[date] || {}), ...records },
        },
      }));
      recordOwnerActivity('Updated attendance', 'Attendance', date);
    },
    addLedgerEntry: (record) => { const id = Date.now(); setData((prev) => ({ ...prev, ledger: [{ ...record, id }, ...prev.ledger] })); recordOwnerActivity('Added salary ledger entry', 'Salary', id); },
    addSalary: (record) => { const id = Date.now(); setData((prev) => ({ ...prev, salary: [{ ...record, id }, ...prev.salary] })); recordOwnerActivity('Updated salary information', 'Salary', id); },
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