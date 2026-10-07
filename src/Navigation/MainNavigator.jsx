import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '../Features/Dashboard';
import IncomePage from '../Features/Income';
import ExpensePage from '../Features/Expense';
import InventoryPage from '../Features/Inventory';
import SalaryPage from '../Features/Salary';
import AttendancePage from '../Features/Attendance';
import AccountManagementPage from '../Features/AccountManagement';
import MainLayout from './MainLayout';
import { canAccessPath, getCurrentUser } from '../State/auth';

const withLayout = (Page) => <MainLayout><Page /></MainLayout>;
const protectedPage = (path, Page) => (
  canAccessPath(getCurrentUser()?.role, path)
    ? withLayout(Page)
    : <Navigate to="/dashboard" replace />
);

function MainNavigator() {
  return (
    <Routes>
      <Route path="/dashboard" element={protectedPage('/dashboard', DashboardPage)} />
      <Route path="/income" element={protectedPage('/income', IncomePage)} />
      <Route path="/expense" element={protectedPage('/expense', ExpensePage)} />
      <Route path="/inventory" element={protectedPage('/inventory', InventoryPage)} />
      <Route path="/salary" element={protectedPage('/salary', SalaryPage)} />
      <Route path="/attendance" element={protectedPage('/attendance', AttendancePage)} />
      <Route path="/account-management" element={protectedPage('/account-management', AccountManagementPage)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default MainNavigator;
