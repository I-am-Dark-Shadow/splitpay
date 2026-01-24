import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-dvh w-full flex justify-center bg-slate-50">
      <div className="w-full max-w-md min-h-dvh bg-slate-50 relative shadow-2xl overflow-hidden pb-24">
        {/* Page Content Rendered Here */}
        <Outlet />
        
        {/* Navigation Bar */}
        <BottomNav />
      </div>
    </div>
  );
}