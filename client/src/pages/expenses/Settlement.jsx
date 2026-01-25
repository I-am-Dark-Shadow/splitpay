import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import api from '../../services/api';
import { calculateSettlements } from '../../utils/settlementLogic';
import { formatCurrency } from '../../utils/format';
import { ArrowLeft, CheckCircle, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Settlement() {
  const { id } = useParams();
  const { user } = useAuth();
  const { fetchGroups } = useGroup(); // To refresh home page data
  const navigate = useNavigate();
  
  const [settlements, setSettlements] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data } = await api.get(`/groups/${id}`);
      setGroup(data);
      const results = calculateSettlements(data.expenses, data.members);
      setSettlements(results);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load details');
    } finally {
      setLoading(false);
    }
  };

  const getName = (userId) => group?.members.find(m => m._id === userId)?.name || 'Unknown';

  // Open Confirmation Modal
  const handleSettleClick = (settlement) => {
    setSelectedSettlement(settlement);
    setShowModal(true);
  };

  // Confirm Settlement Logic
  const confirmSettlement = async () => {
    if (!selectedSettlement) return;
    setSettling(true);

    try {
      // Logic: "Settlement" is essentially an expense paid by Debtor, split 100% to Creditor.
      // This reduces the balance to 0.
      await api.post(`/groups/${id}/expenses`, {
        description: 'Settlement Payment',
        amount: selectedSettlement.amount,
        paidBy: selectedSettlement.from, // Debtor pays
        splitMethod: 'custom',
        shares: [
          { user: selectedSettlement.to, amount: selectedSettlement.amount } // Creditor receives value
        ]
      });

      toast.success('Marked as settled!');
      setShowModal(false);
      
      // Update UI
      await fetchGroups(); // Updates Home Page
      fetchData(); // Refresh current page
      
    } catch (error) {
      toast.error('Failed to settle');
      console.error(error);
    } finally {
      setSettling(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 relative pt-6">
      <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
          <ArrowLeft size={20} className="text-slate-900" />
        </button>
        <div className="text-base font-semibold">Settlement Plan</div>
      </div>

      <div className="px-4 pt-6">
        <div className="text-sm text-slate-600 mb-4">Suggested payments to clear debts in <b>{group?.name}</b>.</div>

        {settlements.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-3" />
            <div className="text-lg font-bold text-slate-900">All settled!</div>
            <div className="text-sm text-slate-500 mt-1">No pending debts in this group.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {settlements.map((s, idx) => {
              const isMyDebt = s.from === user._id;

              return (
                <div key={idx} className={`bg-white border ${isMyDebt ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-200'} rounded-3xl p-5 shadow-sm`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {isMyDebt ? 'You' : getName(s.from)} <span className="font-normal text-slate-500">pay</span> {getName(s.to)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">Direct Payment</div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                      {formatCurrency(s.amount)}
                    </div>
                  </div>

                  {/* Show Button ONLY if I owe the money */}
                  {isMyDebt ? (
                    <button 
                      onClick={() => handleSettleClick(s)}
                      className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
                    >
                      <CheckCircle size={18} /> Mark as Paid
                    </button>
                  ) : (
                     <div className="w-full py-3 rounded-xl bg-slate-50 text-slate-400 text-sm font-semibold text-center border border-slate-100 cursor-not-allowed">
                       Waiting for payment
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto">
              <Wallet size={24} />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900">Confirm Settlement</h3>
            <p className="text-sm text-center text-slate-500 mt-2">
              Are you sure you paid <b>{formatCurrency(selectedSettlement?.amount)}</b> to <b>{getName(selectedSettlement?.to)}</b>?
            </p>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button 
                onClick={() => setShowModal(false)}
                className="py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSettlement}
                disabled={settling}
                className="py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 flex items-center justify-center"
              >
                {settling ? 'Processing...' : 'Yes, Settle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}