import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGroup } from '../../context/GroupContext';
import { Plus, Users, Receipt, ChevronRight, Search, Layers } from 'lucide-react';
import { Input } from '../../components/ui/Input'; // Ensure Input component exists or use standard input

export default function Groups() {
  const { groups, fetchGroups, loading } = useGroup();
  const [searchTerm, setSearchTerm] = useState('');

  // Refresh groups on load
  useEffect(() => {
    fetchGroups();
  }, []);

  // Filter groups based on search
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper: Generate a random gradient based on group name length
  const getGradient = (name) => {
    const gradients = [
      'from-blue-500 to-cyan-400',
      'from-purple-500 to-pink-400',
      'from-emerald-500 to-teal-400',
      'from-orange-500 to-amber-400',
      'from-rose-500 to-red-400',
      'from-indigo-500 to-violet-400',
    ];
    const index = name.length % gradients.length;
    return gradients[index];
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 pt-8 pb-24">
      
      {/* 1. Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Your Groups</h1>
          <p className="text-sm text-slate-500 mt-1">Manage expenses & friends.</p>
        </div>
        <Link 
          to="/groups/create" 
          className="h-10 w-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </Link>
      </div>

      {/* 2. Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl border-none bg-white shadow-sm text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900/10 outline-none placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 3. Groups List */}
      <div className="space-y-3">
        {loading ? (
          // Loading Skeleton
          [1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-3xl shadow-sm animate-pulse" />
          ))
        ) : filteredGroups.length === 0 ? (
          // Empty State
          <div className="text-center py-10">
            <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Layers size={32} className="text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">No groups found</h3>
            <p className="text-xs text-slate-500 mt-1">Try a different name or create a new one.</p>
          </div>
        ) : (
          // List Items
          filteredGroups.map((group) => (
            <Link 
              key={group._id} 
              to={`/groups/${group._id}`}
              className="group relative block bg-white rounded-3xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.98] border border-transparent hover:border-slate-100"
            >
              <div className="flex items-center gap-4">
                
                {/* Colorful Icon Avatar */}
                <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${getGradient(group.name)} flex items-center justify-center text-white shadow-sm`}>
                  <span className="text-xl font-bold uppercase">{group.name.charAt(0)}</span>
                </div>

                {/* Group Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-slate-900 truncate pr-2">
                      {group.name}
                    </h3>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Users size={12} className="text-slate-400" />
                      {group.members.length} members
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                      <Receipt size={12} className="text-slate-400" />
                      {group.expenses.length} exp
                    </div>
                  </div>
                </div>

                {/* Arrow Icon */}
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                  <ChevronRight size={18} />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}