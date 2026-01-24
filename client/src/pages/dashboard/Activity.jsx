import { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate, formatCurrency } from '../../utils/format';
import { Receipt } from 'lucide-react';

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/groups/activity')
      .then(({ data }) => setActivities(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-4 pt-5 pb-20">
      <div className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-slate-600">Recent expenses across all groups.</p>
      </div>

      {loading ? (
        <div className="text-center text-sm text-slate-500 mt-10">Loading updates...</div>
      ) : activities.length === 0 ? (
        <div className="text-center text-sm text-slate-500 mt-10">No recent activity found.</div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => (
            <div key={act._id} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 flex gap-3">
              <div className="h-10 w-10 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                <Receipt size={20} className="text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 truncate">
                  {act.description}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {act.paidBy.name} paid {formatCurrency(act.amount)} in <span className="font-medium text-slate-700">{act.group?.name}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-2">
                  {formatDate(act.createdAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}