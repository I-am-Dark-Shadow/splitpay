import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { calculateSettlements } from '../../utils/settlementLogic';
import { formatCurrency } from '../../utils/format';
import { ArrowLeft, ArrowUpRight, User, CheckCircle } from 'lucide-react';

export default function ToPay() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { groups, fetchGroups } = useGroup();
    const [payList, setPayList] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        if (groups.length === 0) fetchGroups();
    }, []);

    useEffect(() => {
        if (groups.length > 0 && user) {
            let list = [];
            let total = 0;

            groups.forEach(group => {
                // Calculate settlements for this group
                if (group.expenses && group.expenses.length > 0) {
                    const settlements = calculateSettlements(group.expenses, group.members);

                    // Filter: Where I am the 'from' (Debtor)
                    const myDebts = settlements.filter(s => s.from === user._id);

                    myDebts.forEach(debt => {
                        const receiver = group.members.find(m => m._id === debt.to);
                        if (receiver) {
                            list.push({
                                groupId: group._id,
                                groupName: group.name,
                                receiverName: receiver.name,
                                receiverId: receiver._id,
                                amount: debt.amount
                            });
                            total += debt.amount;
                        }
                    });
                }
            });

            setPayList(list);
            setTotalAmount(total);
        }
    }, [groups, user]);

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-6 px-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button onClick={() => navigate(-1)} className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <ArrowLeft size={20} className="text-slate-900" />
                </button>
                <h1 className="text-xl font-bold text-slate-900">You need to pay</h1>
            </div>

            {/* Summary Card */}
            <div className="bg-rose-50 border border-rose-100 rounded-3xl p-6 mb-6 text-center">
                <div className="text-sm text-rose-600 font-medium mb-1">Total You Pay</div>
                <div className="text-3xl font-bold text-rose-700">{formatCurrency(totalAmount)}</div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {payList.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">All Settled!</h3>
                        <p className="text-slate-500 text-sm">You don't owe anyone anything.</p>
                    </div>
                ) : (
                    payList.map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{item.receiverName}</div>
                                    <div className="text-xs text-slate-500">Group : {item.groupName}</div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                {/* Amount Badge */}
                                <div className="px-3 py-1 rounded-lg bg-rose-100 text-rose-700 text-sm font-bold">
                                    {formatCurrency(item.amount)}
                                </div>

                                {/* Pay Button */}
                                <Link
                                    to={`/groups/${item.groupId}/settlement`}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg 
               bg-rose-600 text-white text-[11px] font-semibold
               hover:bg-rose-700 active:scale-95 transition"
                                >
                                    PAY NOW
                                    <ArrowUpRight size={12} />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}