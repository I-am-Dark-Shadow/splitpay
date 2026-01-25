import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import api from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Tag, IndianRupee, Users, CheckCircle, ArrowLeft, User } from 'lucide-react';
import { calculateSettlements } from '../../utils/settlementLogic'; // ✅ Import Added
import toast from 'react-hot-toast';

export default function AddExpense() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, fetchGroups } = useGroup();
  
  const [selectedGroupId, setSelectedGroupId] = useState(id || '');
  const [group, setGroup] = useState(null);
  
  // Form States
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const paidBy = user?._id; 
  
  const [splitMethod, setSplitMethod] = useState('equal');
  const [customAmounts, setCustomAmounts] = useState({});
  const [loading, setLoading] = useState(false);

  // Initial Data Load
  useEffect(() => {
    if (!groups.length) fetchGroups();
  }, []);

  // When Group ID is selected or present
  useEffect(() => {
    if (selectedGroupId) {
      const foundGroup = groups.find(g => g._id === selectedGroupId);
      if (foundGroup) {
        setGroup(foundGroup);
        // Refresh details via API
        api.get(`/groups/${selectedGroupId}`).then(({ data }) => setGroup(data));
      }
    }
  }, [selectedGroupId, groups]);

  const handleSubmit = async () => {
    if (!selectedGroupId) return toast.error('Please select a group');
    if (!description || !amount || parseFloat(amount) <= 0) return toast.error('Enter valid details');

    const totalAmount = parseFloat(amount);
    let shares = [];

    if (splitMethod === 'equal') {
      const splitAmount = totalAmount / group.members.length;
      shares = group.members.map(m => ({ user: m._id, amount: splitAmount }));
    } else {
      const totalCustom = Object.values(customAmounts).reduce((a, b) => a + parseFloat(b || 0), 0);
      if (Math.abs(totalCustom - totalAmount) > 1) {
        return toast.error(`Total split must match Amount`);
      }
      shares = group.members.map(m => ({ user: m._id, amount: parseFloat(customAmounts[m._id] || 0) }));
    }

    setLoading(true);
    try {
      await api.post(`/groups/${selectedGroupId}/expenses`, {
        description,
        amount: totalAmount,
        paidBy,
        splitMethod,
        shares
      });
      toast.success('Expense added!');
      navigate(`/groups/${selectedGroupId}`);
    } catch (error) {
      toast.error('Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Filter Logic: Hide fully settled groups
  // Condition: Show if (No expenses yet) OR (Settlements > 0)
  const activeGroups = groups.filter(g => {
    const hasExpenses = g.expenses && g.expenses.length > 0;
    if (!hasExpenses) return true; // Show new groups
    const settlements = calculateSettlements(g.expenses, g.members);
    return settlements.length > 0; // Show only if debts exist
  });

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-6">
      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <ArrowLeft size={20} className="text-slate-900" />
        </button>
        <div className="text-base font-semibold">Add Expense</div>
      </div>

      <div className="px-4 pt-6 space-y-5">
        
        {/* GROUP SELECTOR */}
        {!id && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4">
             <label className="text-xs font-semibold text-slate-700 block mb-2">Select Group</label>
             <select 
                className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none"
                value={selectedGroupId}
                onChange={e => setSelectedGroupId(e.target.value)}
              >
                <option value="" disabled> Choose Group </option>
                {/* ✅ Using activeGroups instead of groups */}
                {activeGroups.map(g => (
                  <option key={g._id} value={g._id}>{g.name}</option>
                ))}
              </select>
          </div>
        )}

        {/* FORM */}
        {selectedGroupId && group ? (
            <>
              <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-2">Description</label>
                  <Input icon={Tag} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ticket / Lunch / Dinner" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">Amount</label>
                    <Input icon={IndianRupee} type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  
                  {/* FIXED PAID BY SECTION */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-2">Paid By</label>
                    <div className="flex items-center gap-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-100 px-3">
                      <User size={16} className="text-slate-500" />
                      <span className="text-sm font-semibold text-slate-900 truncate">
                         {user?.name || 'You'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Split Method Selector */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="text-xs font-semibold text-slate-700">Split Method</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setSplitMethod('equal')}
                    className={`h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${splitMethod === 'equal' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}
                  >
                    <Users size={16} /> Equally
                  </button>
                  <button 
                    onClick={() => setSplitMethod('custom')}
                    className={`h-11 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${splitMethod === 'custom' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-800'}`}
                  >
                    <CheckCircle size={16} /> Custom
                  </button>
                </div>
              </div>

              {/* Custom Split Inputs */}
              {splitMethod === 'custom' && (
                <div className="bg-white border border-slate-200 rounded-3xl p-4 space-y-3">
                  <div className="text-xs text-slate-500 mb-2">Assign amounts to each member</div>
                  {group.members.map(m => (
                    <div key={m._id} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">₹</span>
                        <input 
                          type="number" 
                          className="w-24 text-right bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-sm outline-none focus:border-slate-400"
                          placeholder="0"
                          value={customAmounts[m._id] || ''}
                          onChange={(e) => setCustomAmounts({...customAmounts, [m._id]: e.target.value})}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button onClick={handleSubmit} disabled={loading} className="w-full">
                {loading ? 'Saving...' : 'Save Expense'}
              </Button>
            </>
        ) : (
           <div className="text-center text-slate-500 mt-10">Select a group to add expense</div>
        )}
      </div>
    </div>
  );
}