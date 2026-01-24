import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import { calculateSettlements } from '../../utils/settlementLogic';
import { ArrowLeft, PlusCircle, Users, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GroupDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Balances
  const [totalSpent, setTotalSpent] = useState(0);
  const [myDebts, setMyDebts] = useState({ owe: [], owed: [] });

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroup(data);
      if (data) calculateStats(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (groupData) => {
    if (!groupData.expenses) return;

    let total = 0;
    groupData.expenses.forEach(exp => total += exp.amount);
    setTotalSpent(total);

    const settlements = calculateSettlements(groupData.expenses, groupData.members);
    const iOwe = settlements.filter(s => s.from === user._id);
    const owedToMe = settlements.filter(s => s.to === user._id);
    setMyDebts({ owe: iOwe, owed: owedToMe });
  };

  const getMemberName = (userId) => {
    const m = group?.members.find(mem => mem._id === userId);
    return m ? m.name.split(' ')[0] : 'Unknown';
  };

  const getMemberSpending = () => {
    if (!group) return [];
    const spending = {};
    group.members.forEach(m => spending[m._id] = { name: m.name, amount: 0 });
    
    group.expenses.forEach(exp => {
      const payerId = exp.paidBy?._id || exp.paidBy;
      if (spending[payerId]) {
        spending[payerId].amount += exp.amount;
      }
    });
    return Object.values(spending).sort((a, b) => b.amount - a.amount);
  };

  if (loading) return <div className="p-10 text-center text-slate-500">Loading...</div>;
  if (!group) return <div className="p-10 text-center">Group not found</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
            <ArrowLeft size={20} className="text-slate-900" />
          </button>
          <div>
            <div className="text-base font-bold tracking-tight text-slate-900">{group.name}</div>
            <div className="text-xs text-slate-500">{group.members.length} members</div>
          </div>
        </div>
        <Link 
          to={`/groups/${id}/add-expense`}
          className="h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold flex items-center gap-1 hover:bg-slate-800"
        >
          <PlusCircle size={16} /> Add
        </Link>
      </div>

      <div className="px-4 pt-5 space-y-4">
        
        {/* 1. Balances Section */}
        {(myDebts.owe.length > 0 || myDebts.owed.length > 0) ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="text-sm font-bold text-slate-900">Your Balances</div>
            
            <div className="space-y-2">
              {myDebts.owe.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <span className="text-rose-700 font-medium">You owe <b>{getMemberName(item.to)}</b></span>
                  <span className="font-bold text-rose-700">{formatCurrency(item.amount)}</span>
                </div>
              ))}

              {myDebts.owed.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <span className="text-emerald-700 font-medium"><b>{getMemberName(item.from)}</b> owes you</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(item.amount)}</span>
                </div>
              ))}
            </div>

            {/* BUTTON STYLE CHANGE: Full width button */}
            <Link 
              to={`/groups/${id}/settlement`} 
              className="flex items-center justify-center w-full py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md shadow-slate-900/10"
            >
              View full settlement plan <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 text-center text-sm text-emerald-700 font-medium">
            Everything is settled up here!
          </div>
        )}

        {/* 2. Total Spending */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4">
           <div className="text-sm font-bold mb-3 flex items-center gap-2">
             <Users size={16} /> Total Spending ({formatCurrency(totalSpent)})
           </div>
           <div className="space-y-2">
             {getMemberSpending().map((stat, idx) => (
               <div key={idx} className="flex justify-between items-center text-sm">
                 <span className="text-slate-600">{stat.name}</span>
                 <span className="font-semibold text-slate-900">{formatCurrency(stat.amount)}</span>
               </div>
             ))}
           </div>
        </div>

        {/* 3. Recent Expenses */}
        <div>
          <div className="text-sm font-bold text-slate-900 mb-2 px-1">Recent Expenses</div>
          
          {group.expenses.length === 0 ? (
            <div className="text-center p-6 text-slate-400 text-sm">No expenses yet.</div>
          ) : (
            <div className="space-y-3">
              {group.expenses.map((exp) => (
                <div key={exp._id} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 flex justify-between items-center">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">{exp.description}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">
                        {exp.paidBy?._id === user._id ? 'You' : exp.paidBy?.name || 'Unknown'}
                      </span> paid {formatCurrency(exp.amount)}
                    </div>
                  </div>
                  <div className="text-xs font-bold text-slate-400">
                    {formatDate(exp.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}