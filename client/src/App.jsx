import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/dashboard/Home';
import Groups from './pages/groups/Groups';
import CreateGroup from './pages/groups/CreateGroup';
import GroupDetails from './pages/groups/GroupDetails';
import AddExpense from './pages/expenses/AddExpense';
import Settlement from './pages/expenses/Settlement';
import Activity from './pages/dashboard/Activity';
import Profile from './pages/dashboard/Profile';
import Report from './pages/dashboard/Report'; // Import Report Page

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Protected Layout Routes */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/" element={<Home />} />
        
        {/* Groups */}
        <Route path="/groups" element={<Groups />} />
        <Route path="/groups/create" element={<CreateGroup />} />
        <Route path="/groups/:id" element={<GroupDetails />} />
        
        {/* Expenses */}
        <Route path="/add-expense" element={<AddExpense />} />
        <Route path="/groups/:id/add-expense" element={<AddExpense />} />
        <Route path="/groups/:id/settlement" element={<Settlement />} />
        
        {/* Other Tabs */}
        <Route path="/activity" element={<Activity />} />
        <Route path="/report" element={<Report />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GroupProvider>
          <AppRoutes />
          
          {/* TOAST CONFIGURATION - CHANGED TO TOP */}
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
                  primary: '#10b981', // Emerald green
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444', // Red
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