import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { calculateSettlements } from '../../utils/settlementLogic';
import { formatCurrency } from '../../utils/format';
import { RefreshCw, ArrowDown, ArrowUp, Users, ArrowRight, Calculator } from 'lucide-react'; // Added Calculator Icon
import { Link } from 'react-router-dom';
import LoadingScreen from '../../components/ui/LoadingScreen';

export default function Home() {
  const { user } = useAuth();
  const { groups, fetchGroups, loading } = useGroup();

  const [totalOwe, setTotalOwe] = useState(0);
  const [totalOwed, setTotalOwed] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (groups.length > 0 && user) {
      let owe = 0;
      let owed = 0;
      groups.forEach(group => {
        const { owe: gOwe, owed: gOwed } = getUserDebts(group);
        gOwe.forEach(item => owe += item.amount);
        gOwed.forEach(item => owed += item.amount);
      });
      setTotalOwe(owe);
      setTotalOwed(owed);
    }
  }, [groups, user]);

  const getUserDebts = (group) => {
    if (!group.expenses || group.expenses.length === 0) return { owe: [], owed: [] };
    const settlements = calculateSettlements(group.expenses, group.members);
    const iOwe = settlements.filter(s => s.from === user._id);
    const owedToMe = settlements.filter(s => s.to === user._id);
    return { owe: iOwe, owed: owedToMe };
  };

  const handleFullRefresh = () => {
    setSpinning(true);
    window.location.reload();
    setTimeout(() => setSpinning(false), 800);
  };

  if (loading) return <LoadingScreen />;
  
  return (
    <div className="px-4 pt-5 pb-24">
      {/* 1. Header */}
      <div className="flex items-start justify-between gap-3 mb-6 pt-4">
        <div className="flex flex-col">
          <img src="/name.webp" alt="" className="w-28 mx-[-6px]" />
          <div className="text-sm text-slate-600">
            {user && user.name ? user.name.split(' ')[0] : 'Guest'}
          </div>
        </div>
        <button onClick={handleFullRefresh} className="h-10 w-10 rounded-full bg-white border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center justify-center active:scale-95">
          <RefreshCw size={20} className={`text-slate-900 transition-transform ${spinning ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* 2. Balance Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link to="/to-pay" className="bg-white border border-slate-200 rounded-3xl hover:shadow-lg shadow-sm p-4 active:scale-95 transition-transform">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">You need to pay</div>
            <div className="h-8 w-8 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center">
              <ArrowUp size={16} className="text-rose-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(totalOwe)}</div>
          <div className="text-xs text-slate-400 mt-1">Total across groups</div>
        </Link>
        <Link to="/to-receive" className="bg-white border border-slate-200 rounded-3xl hover:shadow-lg shadow-sm p-4 active:scale-95 transition-transform">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">You will receive</div>
            <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <ArrowDown size={16} className="text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{formatCurrency(totalOwed)}</div>
          <div className="text-xs text-slate-400 mt-1">Total across groups</div>
        </Link>
      </div>

      {/* 3. Quick Actions */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-5 mb-6">
        <div className="text-sm font-bold text-slate-900 mb-4">Quick actions</div>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/groups/create" className="h-12 rounded-2xl bg-green-600 text-white font-semibold text-sm hover:bg-green-800 flex items-center justify-center gap-1 shadow-md shadow-slate-900/10">
            <img src="/addgroup.gif" alt="Groups" className="w-6 object-contain scale-[1.6]" />
            <p className="mt-1">Create Group</p>
          </Link>
          <Link to="/add-expense" className="h-12 rounded-2xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 flex items-center justify-center gap-1 shadow-md shadow-slate-900/10">
            <img src="/expence.gif" alt="Expense" className="w-6 object-contain scale-[1.2]" />
            <p className="mt-1">Add Expense</p>
          </Link>
        </div>
      </div>

      {/* ✅ 4. Quick Calculator Button (New Position) */}
      <Link to="/calculator" className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-3xl shadow-lg shadow-slate-900/20 mb-6 active:scale-95 transition-transform">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <img src="/calculator.gif" alt="Calculator" className="w-6 object-contain scale-[1.6]" />
          </div>
          <div>
            <div className="font-bold text-sm">Manual Calculator</div>
            <div className="text-xs text-slate-400">Split bills without creating groups</div>
          </div>
        </div>
        <ArrowRight size={18} className="text-slate-500" />
      </Link>

      {/* 5. Group Grid */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="text-sm font-bold text-slate-900">Your Groups</div>
        </div>
        {groups.length === 0 && !loading ? (
          <div className="bg-slate-100 rounded-3xl p-6 text-center border border-dashed border-slate-300">
            <div className="text-sm text-slate-500">No groups found.</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {groups.map(group => (
              <Link key={group._id} to={`/groups/${group._id}`} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-95 flex flex-col justify-between h-28">
                <div className="flex justify-between items-start">
                  <div className="ml-[7px]">
                    <img src="/fullgroup.gif" alt="Groups" className="w-6 object-contain scale-[1.9]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 truncate text-ellipsis line-clamp-1">{group.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    View Details <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}