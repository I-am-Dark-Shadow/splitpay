import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/format';
import { UserCircle, LogOut, Mail, Calendar, Hash, X, ChevronRight, User } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  // Get initials
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : 'U';

  return (
    <div className="px-4 pt-5 relative min-h-screen pb-20">
      
      {/* 1. Header Profile Card */}
      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded-full bg-slate-900 text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-slate-900/20">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
          <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
            <Mail size={14} /> {user?.email}
          </div>
        </div>
      </div>

      {/* 2. Menu Options */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Account Details Button (Now Clickable) */}
        <button 
          onClick={() => setShowDetails(true)}
          className="w-full p-4 border-b border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left group"
        >
          <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-white group-hover:shadow-sm transition-all">
            <UserCircle size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-900">Account Details</div>
            <div className="text-xs text-slate-500">View personal information</div>
          </div>
          <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500" />
        </button>
        
        {/* Logout Button */}
        <button 
          onClick={logout}
          className="w-full p-4 flex items-center gap-3 hover:bg-rose-50 transition-colors text-left group"
        >
          <div className="h-10 w-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-white group-hover:shadow-sm transition-all">
            <LogOut size={20} />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-rose-600">Log Out</div>
            <div className="text-xs text-rose-400">End your session securely</div>
          </div>
        </button>
      </div>

      {/* Version Info */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500">
          <span>SplitPay v1.0.0</span>
          <span className="h-1 w-1 rounded-full bg-slate-400"></span>
          <span>Beta</span>
        </div>
      </div>

      {/* 3. Account Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setShowDetails(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">My Profile</h3>
              <button 
                onClick={() => setShowDetails(false)}
                className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <User size={12} /> Full Name
                </div>
                <div className="text-sm font-bold text-slate-900">{user?.name}</div>
              </div>

              {/* Email */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Mail size={12} /> Email Address
                </div>
                <div className="text-sm font-bold text-slate-900">{user?.email}</div>
              </div>

            </div>

            <button 
              onClick={() => setShowDetails(false)}
              className="mt-6 w-full py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}