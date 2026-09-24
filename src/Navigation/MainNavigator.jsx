import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '../Features/Dashboard';
import IncomePage from '../Features/Income';
import ExpensePage from '../Features/Expense';
import InventoryPage from '../Features/Inventory';
import SalaryPage from '../Features/Salary';
import AttendancePage from '../Features/Attendance';
import MainLayout from './MainLayout';

const withLayout = (Page) => <MainLayout><Page /></MainLayout>;

function MainNavigator() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/income" element={withLayout(IncomePage)} />
      <Route path="/expense" element={withLayout(ExpensePage)} />
      <Route path="/inventory" element={withLayout(InventoryPage)} />
      <Route path="/salary" element={withLayout(SalaryPage)} />
      <Route path="/attendance" element={withLayout(AttendancePage)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default MainNavigator;
