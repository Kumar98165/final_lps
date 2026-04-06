import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import LoginPage from './features/auth/LoginPage';
import AuthGuard from './features/auth/AuthGuard';
import AdminDashboardPage from './features/admin/dashboard/AdminDashboardPage';
import ManagerDashboardPage from './features/manager/ManagerDashboardPage';
import ManagerDemandPage from './features/manager/ManagerDemandPage';
import SupervisorDashboardPage from './features/supervisor/dashboard/SupervisorDashboardPage';
import UserAccountsPage from './features/admin/users/UserAccountsPage';
import DemandManagementPage from './features/admin/demand/DemandManagementPage';
import ModelRegisterPage from './features/admin/models/ModelRegisterPage';
import OrderInboxPage from './features/admin/orders/OrderInboxPage';
import AdminAuditPage from './features/admin/AdminAuditPage';
import ProductionLinesPage from './features/admin/lines/ProductionLinesPage';
import AssignmentPage from './features/admin/assignments/AssignmentPage';
import ProductionPlanningPage from './features/manager/ProductionPlanningPage';
import TeamManagementPage from './features/supervisor/TeamManagementPage';
import DEODashboardPage from './features/deo/DEODashboardPage';
import { UserRole } from './config/roles';
import {
  AUTH_LOGIN,
  ADMIN_HOME,
  SUPERVISOR_DASHBOARD,
  SUPERVISOR_MONITORING,
  SUPERVISOR_PROGRESS,
  SUPERVISOR_VERIFY,
  SUPERVISOR_REPORTS,
  SUPERVISOR_ALERTS,
  DEO_DASHBOARD,
  DEO_MODELS,
  DEO_ENTRY,
  DEO_REPORTS,
  DEO_VERIFY,
  DEO_NOTIFICATIONS,
  ADMIN_LINES,
  ADMIN_MODELS,
  ADMIN_ASSIGNMENTS,
  ADMIN_DEMAND,
  ADMIN_ORDERS,
  ADMIN_USERS,
  ADMIN_AUDIT
} from './config/routePaths';
import { getUser } from './lib/storage';

const RoleBasedRedirect = () => {
  const user = getUser();

  if (!user) {
    return <Navigate to={AUTH_LOGIN} replace />;
  }

  switch (user.role) {
    case UserRole.ADMIN:
      return <Navigate to={ADMIN_HOME} replace />;
    case UserRole.MANAGER:
      return <Navigate to="/manager/demand" replace />;
    case UserRole.SUPERVISOR:
      return <Navigate to={SUPERVISOR_DASHBOARD} replace />;
    case UserRole.DEO:
      return <Navigate to={DEO_DASHBOARD} replace />;
    default:
      return <Navigate to={AUTH_LOGIN} replace />;
  }
};

const queryClient = new QueryClient();

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path={AUTH_LOGIN} element={<LoginPage />} />

          {/* Protected Routes Area */}
          <Route element={<AuthGuard />}>
            <Route path="*" element={
              <div className="flex h-screen bg-ind-bg overflow-hidden">
                <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
                <div className="flex-1 flex flex-col min-w-0">
                  <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
                  <main className="flex-1 overflow-auto bg-ind-bg/30">
                    <Routes>
                      <Route path={ADMIN_HOME}>
                        {/* Shared Routes (Admin + Manager) */}
                        <Route element={<AuthGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]} />}>
                          <Route path={ADMIN_MODELS.replace('/admin/', '')} element={<ModelRegisterPage />} />
                          <Route path={ADMIN_DEMAND.replace('/admin/', '')} element={<DemandManagementPage />} />
                          <Route path={ADMIN_ORDERS.replace('/admin/', '')} element={<OrderInboxPage />} />
                          <Route path={ADMIN_USERS.replace('/admin/', '')} element={<UserAccountsPage />} />
                          <Route path={ADMIN_AUDIT.replace('/admin/', '')} element={<AdminAuditPage />} />
                          <Route path={ADMIN_LINES.replace('/admin/', '')} element={<ProductionLinesPage />} />
                          <Route path={ADMIN_ASSIGNMENTS.replace('/admin/', '')} element={<AssignmentPage />} />
                        </Route>

                        {/* Admin Only Dashboard */}
                        <Route element={<AuthGuard allowedRoles={[UserRole.ADMIN]} />}>
                          <Route index element={<AdminDashboardPage />} />
                        </Route>
                      </Route>

                      {/* Manager Routes */}
                      <Route element={<AuthGuard allowedRoles={[UserRole.MANAGER, UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.DEO]} />}>
                        <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
                        <Route path="/manager/demand" element={<ManagerDemandPage />} />
                        <Route path="/manager/planning/:demandId" element={<ProductionPlanningPage />} />
                      </Route>

                      <Route element={<AuthGuard allowedRoles={[UserRole.SUPERVISOR, UserRole.MANAGER, UserRole.ADMIN]} />}>
                        <Route path={SUPERVISOR_DASHBOARD} element={<SupervisorDashboardPage />} />
                        <Route path={SUPERVISOR_MONITORING} element={<SupervisorDashboardPage />} />
                        <Route path={SUPERVISOR_PROGRESS} element={<SupervisorDashboardPage />} />
                        <Route path="/supervisor/team" element={<TeamManagementPage />} />
                        <Route path={SUPERVISOR_VERIFY} element={<SupervisorDashboardPage />} />
                        <Route path={SUPERVISOR_REPORTS} element={<SupervisorDashboardPage />} />
                        <Route path={SUPERVISOR_ALERTS} element={<SupervisorDashboardPage />} />
                      </Route>
                      <Route element={<AuthGuard allowedRoles={[UserRole.DEO, UserRole.ADMIN]} />}>
                        <Route path={DEO_DASHBOARD} element={<DEODashboardPage />} />
                        <Route path={DEO_MODELS} element={<DEODashboardPage />} />
                        <Route path={DEO_ENTRY} element={<DEODashboardPage />} />
                        <Route path={DEO_REPORTS} element={<DEODashboardPage />} />
                        <Route path={DEO_VERIFY} element={<DEODashboardPage />} />
                        <Route path={DEO_NOTIFICATIONS} element={<DEODashboardPage />} />
                      </Route>

                      <Route path="/" element={<RoleBasedRedirect />} />
                      <Route path="*" element={<RoleBasedRedirect />} />
                    </Routes>
                  </main>
                </div>
              </div>
            }>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={AUTH_LOGIN} replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
