/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'manufacture-erp-data';

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
    { id: 1, name: 'Alicia Smith', address: '32 Oak Avenue', phone: '+1 245 678 9023', salary: 35000, status: 'Present' },
    { id: 2, name: 'Samuel Lee', address: '12 Maple Road', phone: '+1 245 900 7745', salary: 42500, status: 'Late' },
    { id: 3, name: 'Ritika Shah', address: '7 Pine Lane', phone: '+1 245 812 6630', salary: 28800, status: 'Absent' },
  ],
  salary: [
    { id: 1, employee: 'Alicia Smith', amount: 35000, date: '2026-06-12', status: 'Paid' },
    { id: 2, employee: 'Samuel Lee', amount: 42500, date: '2026-06-06', status: 'Pending' },
    { id: 3, employee: 'Ritika Shah', amount: 28800, date: '2026-06-01', status: 'Paid' },
  ],
};

function readStoredData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...initialData, ...JSON.parse(stored) } : initialData;
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
    addIncome: (record) => setData((prev) => ({ ...prev, income: [{ ...record, id: Date.now() }, ...prev.income] })),
    deleteIncome: (id) => setData((prev) => ({ ...prev, income: prev.income.filter((item) => item.id !== id) })),
    addExpense: (record) => setData((prev) => ({ ...prev, expense: [{ ...record, id: Date.now() }, ...prev.expense] })),
    deleteExpense: (id) => setData((prev) => ({ ...prev, expense: prev.expense.filter((item) => item.id !== id) })),
    addInventory: (record) => setData((prev) => ({ ...prev, inventory: [{ ...record, id: Date.now() }, ...prev.inventory] })),
    updateInventory: (id, record) => setData((prev) => ({ ...prev, inventory: prev.inventory.map((item) => item.id === id ? { ...item, ...record } : item) })),
    deleteInventory: (id) => setData((prev) => ({ ...prev, inventory: prev.inventory.filter((item) => item.id !== id) })),
    addManufacturingStage: (record) => setData((prev) => ({ ...prev, manufacturingStages: [...prev.manufacturingStages, { ...record, id: Date.now() }] })),
    updateManufacturingStage: (id, record) => setData((prev) => ({ ...prev, manufacturingStages: prev.manufacturingStages.map((item) => item.id === id ? { ...item, ...record } : item) })),
    deleteManufacturingStage: (id) => setData((prev) => ({ ...prev, manufacturingStages: prev.manufacturingStages.filter((item) => item.id !== id) })),
    addEmployee: (record) => setData((prev) => ({ ...prev, employees: [{ ...record, id: Date.now() }, ...prev.employees] })),
    updateEmployee: (id, record) => setData((prev) => ({ ...prev, employees: prev.employees.map((item) => item.id === id ? { ...item, ...record } : item) })),
    deleteEmployee: (id) => setData((prev) => ({ ...prev, employees: prev.employees.filter((item) => item.id !== id) })),
    addSalary: (record) => setData((prev) => ({ ...prev, salary: [{ ...record, id: Date.now() }, ...prev.salary] })),
  }), [data]);

  return <ERPContext.Provider value={value}>{children}</ERPContext.Provider>;
}

export function useERP() {
  const context = useContext(ERPContext);
  if (!context) throw new Error('useERP must be used inside ERPProvider');
  return context;
}

export const formatCurrency = (amount) => `₹ ${Number(amount).toLocaleString('en-IN')}`;
export const formatDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });