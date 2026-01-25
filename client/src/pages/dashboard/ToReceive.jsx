import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { calculateSettlements } from '../../utils/settlementLogic';
import { formatCurrency } from '../../utils/format';
import { ArrowLeft, User, CheckCircle } from 'lucide-react';

export default function ToReceive() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { groups, fetchGroups } = useGroup();
    const [receiveList, setReceiveList] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        if (groups.length === 0) fetchGroups();
    }, []);

    useEffect(() => {
        if (groups.length > 0 && user) {
            let list = [];
            let total = 0;

            groups.forEach(group => {
                if (group.expenses && group.expenses.length > 0) {
                    const settlements = calculateSettlements(group.expenses, group.members);

                    // Filter: Where I am the 'to' (Creditor)
                    const owedToMe = settlements.filter(s => s.to === user._id);

                    owedToMe.forEach(debt => {
                        const payer = group.members.find(m => m._id === debt.from);
                        if (payer) {
                            list.push({
                                groupId: group._id,
                                groupName: group.name,
                                payerName: payer.name,
                                amount: debt.amount
                            });
                            total += debt.amount;
                        }
                    });
                }
            });

            setReceiveList(list);
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
                <h1 className="text-xl font-bold text-slate-900">You will receive</h1>
            </div>

            {/* Summary Card */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 mb-6 text-center">
                <div className="text-sm text-emerald-600 font-medium mb-1">Total You’ll receive</div>
                <div className="text-3xl font-bold text-emerald-700">{formatCurrency(totalAmount)}</div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {receiveList.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="h-16 w-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">All Settled!</h3>
                        <p className="text-slate-500 text-sm">No pending payments to receive.</p>
                    </div>
                ) : (
                    receiveList.map((item, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900">{item.payerName}</div>
                                    <div className="text-xs text-slate-500">Group : {item.groupName}</div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                                {/* Amount Badge */}
                                <div className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold">
                                    {formatCurrency(item.amount)}
                                </div>

                                {/* Status Badge */}
                                <div className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-600 text-[12px] font-semibold">
                                    PENDING
                                </div>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
}