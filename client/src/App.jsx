import { App as CapApp } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/ui/LoadingScreen'; // আপনার তৈরি করা লোডিং স্ক্রিন
import Calculator from './pages/Calculator';

// --- LAZY IMPORTS (Code Splitting) ---
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Home = lazy(() => import('./pages/dashboard/Home'));
const Groups = lazy(() => import('./pages/groups/Groups'));
const CreateGroup = lazy(() => import('./pages/groups/CreateGroup'));
const GroupDetails = lazy(() => import('./pages/groups/GroupDetails'));
const AddExpense = lazy(() => import('./pages/expenses/AddExpense'));
const Settlement = lazy(() => import('./pages/expenses/Settlement'));
const Profile = lazy(() => import('./pages/dashboard/Profile'));
const Report = lazy(() => import('./pages/dashboard/Report'));
const ToPay = lazy(() => import('./pages/dashboard/ToPay'));
const ToReceive = lazy(() => import('./pages/dashboard/ToReceive'));
const JoinGroup = lazy(() => import('./pages/groups/JoinGroup'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const UserGroupExpenses = lazy(() => import('./pages/expenses/UserGroupExpenses'));


const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />; // Auth লোড হওয়ার সময়ও সুন্দর লোডার দেখাবে
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const navigate = useNavigate();

  useEffect(() => {
    CapApp.addListener('appUrlOpen', ({ url }) => {
      if (!url) return;

      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;

      navigate(path);
    });
  }, []);

  return (
    // Suspense: পেজ লোড হওয়ার মাঝখানের সময়ে LoadingScreen দেখাবে
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/calculator" element={<Calculator />} />

        {/* Protected Layout Routes */}
        <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/to-pay" element={<ToPay />} />
          <Route path="/to-receive" element={<ToReceive />} />

          {/* Groups */}
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/create" element={<CreateGroup />} />
          <Route path="/groups/:id" element={<GroupDetails />} />

          {/* Expenses */}
          <Route path="/add-expense" element={<AddExpense />} />
          <Route path="/groups/:id/add-expense" element={<AddExpense />} />
          <Route path="/groups/:id/settlement" element={<Settlement />} />

          {/* Other Tabs */}
          <Route path="/report" element={<Report />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/join/:groupId" element={<JoinGroup />} />
          <Route path="/groups/:id/my-expenses" element={<UserGroupExpenses />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/">
      <AuthProvider>
        <GroupProvider>
          <AppRoutes />

          {/* TOAST CONFIGURATION */}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#0f172a',
                color: '#fff',
                borderRadius: '16px',
                fontSize: '14px',
                padding: '12px 20px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

        </GroupProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}