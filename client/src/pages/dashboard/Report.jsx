import { useState, useEffect } from 'react';
import { useGroup } from '../../context/GroupContext';
import { calculateSettlements } from '../../utils/settlementLogic';
import { formatCurrency, formatDate } from '../../utils/format';
import { Button } from '../../components/ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

// ✅ Capacitor imports
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function Report() {
  const { groups, fetchGroups } = useGroup();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const generatePDF = async () => {
    if (!selectedGroupId) return toast.error('Select a group first');
    setLoading(true);

    try {
      const { data: group } = await api.get(`/groups/${selectedGroupId}`);

      const doc = new jsPDF();
      let finalY = 0;

      // -------- TITLE --------
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42);
      doc.text(group.name, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Expense Report | Generated on ${new Date().toLocaleDateString()}`,
        14,
        26
      );
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 30, 196, 30);

      // -------- DATA PROCESSING --------
      const realExpenses = group.expenses.filter(
        e => e.description !== 'Settlement Payment'
      );
      const settledExpenses = group.expenses.filter(
        e => e.description === 'Settlement Payment'
      );

      let totalGroupSpend = 0;
      const memberSpending = {};
      group.members.forEach(
        m => (memberSpending[m._id] = { name: m.name, amount: 0 })
      );

      realExpenses.forEach(exp => {
        totalGroupSpend += exp.amount;
        const payerId = exp.paidBy?._id || exp.paidBy;
        if (memberSpending[payerId]) {
          memberSpending[payerId].amount += exp.amount;
        }
      });

      const paymentHistoryBody = settledExpenses.map(exp => {
        const fromName = exp.paidBy?.name || 'Unknown';
        const toId = exp.shares[0]?.user;
        const toName = group.members.find(m => m._id === toId)?.name || 'Unknown';
        return [
          fromName,
          toName,
          formatCurrency(exp.amount),
          formatDate(exp.createdAt),
        ];
      });

      const pendingSettlements = calculateSettlements(
        group.expenses,
        group.members
      );

      // -------- SECTION 1: Total Spending --------
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `1. Total Group Spending: ${formatCurrency(totalGroupSpend)}`,
        14,
        40
      );

      autoTable(doc, {
        startY: 45,
        head: [['Member', 'Total Spent']],
        body: Object.values(memberSpending).map(m => [
          m.name,
          formatCurrency(m.amount),
        ]),
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] },
      });

      finalY = doc.lastAutoTable.finalY + 15;

      // -------- SECTION 2: Payment History --------
      doc.setFontSize(14);
      doc.text('2. Payment History', 14, finalY);

      if (paymentHistoryBody.length) {
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Payer', 'Receiver', 'Amount', 'Date']],
          body: paymentHistoryBody,
          theme: 'grid',
          headStyles: { fillColor: [5, 150, 105] },
        });
      } else {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('No payments yet.', 14, finalY + 8);
        // table na thakle manual spacing
        doc.lastAutoTable = { finalY: finalY + 10 };
      }

      finalY = doc.lastAutoTable.finalY + 15;

      // -------- SECTION 3: Pending Balances --------
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('3. Pending Balances', 14, finalY);

      if (pendingSettlements.length) {
        autoTable(doc, {
          startY: finalY + 5,
          head: [['From', 'To', 'Amount']],
          body: pendingSettlements.map(s => [
            group.members.find(m => m._id === s.from)?.name || 'Unknown',
            group.members.find(m => m._id === s.to)?.name || 'Unknown',
            formatCurrency(s.amount),
          ]),
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] },
        });
      } else {
        // 🔥 FIX FOR ANDROID GARBAGE TEXT STARTS HERE 🔥
        doc.setFont("helvetica", "normal"); // Force standard font
        doc.setFontSize(11);
        doc.setTextColor(5, 150, 105); // Green color
        // ইমোজি সরিয়ে দেওয়া হয়েছে
        doc.text('All balances are settled!', 14, finalY + 10);
      }

      // -------- SAVE FILE --------
      const fileName = `${group.name.replace(/\s+/g, '_')}_Report.pdf`;

      if (Capacitor.isNativePlatform()) {
        const base64 = doc.output('datauristring').split(',')[1];

        // Documents এর বদলে Cache ব্যবহার করছি যা সব অ্যান্ড্রয়েড ভার্সনে নিরাপদ
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache, 
        });

        await Share.share({
          title: 'SplitPay Report',
          text: `Expense report for ${group.name}`,
          url: savedFile.uri,
          dialogTitle: 'Download Report',
        });

        toast.success('File ready to share!');
      } else {
        doc.save(fileName);
        toast.success('Report downloaded');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-8 pb-24 ">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Expense Reports</h1>
        <p className="text-sm text-slate-600">Download detailed PDF summaries.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-2">Select Group</label>
          <select
            className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none"
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
          >
            <option value="">Select Group</option>
            {groups.map(g => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <Button
            className="w-full"
            onClick={generatePDF}
            disabled={loading || !selectedGroupId}
          >
            {loading ? 'Generating...' : <><Download size={18} /> Download Report</>}
          </Button>
        </div>
      </div>
    </div>
  );
}