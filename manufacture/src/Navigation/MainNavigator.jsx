import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardPage from '../Features/Dashboard';
import IncomePage from '../Features/Income';
import ExpensePage from '../Features/Expense';
import InventoryPage from '../Features/Inventory';
import SalaryPage from '../Features/Salary';
import AttendancePage from '../Features/Attendance';

function MainNavigator() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/income" element={<IncomePage />} />
      <Route path="/expense" element={<ExpensePage />} />
      <Route path="/inventory" element={<InventoryPage />} />
      <Route path="/salary" element={<SalaryPage />} />
      <Route path="/attendance" element={<AttendancePage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default MainNavigator;
