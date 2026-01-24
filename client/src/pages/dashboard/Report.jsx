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
      doc.text(group.name, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(120);
      doc.text(
        `Expense Report | Generated on ${new Date().toLocaleDateString()}`,
        14,
        26
      );
      doc.line(14, 30, 196, 30);

      // -------- DATA --------
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
        const toName =
          group.members.find(m => m._id === toId)?.name || 'Unknown';
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

      // -------- SECTION 1 --------
      doc.setFontSize(14);
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
      });

      finalY = doc.lastAutoTable.finalY + 15;

      // -------- SECTION 2 --------
      doc.text('2. Payment History', 14, finalY);

      if (paymentHistoryBody.length) {
        autoTable(doc, {
          startY: finalY + 5,
          head: [['Payer', 'Receiver', 'Amount', 'Date']],
          body: paymentHistoryBody,
        });
        finalY = doc.lastAutoTable.finalY + 15;
      } else {
        doc.text('No payments yet.', 14, finalY + 8);
        finalY += 20;
      }

      // -------- SECTION 3 --------
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
        });
      } else {
        doc.text('All balances settled 🎉', 14, finalY + 8);
      }

      // -------- SAVE FILE --------
      const fileName = `${group.name.replace(/\s+/g, '_')}_Report.pdf`;

      if (Capacitor.isNativePlatform()) {
        const base64 = doc.output('datauristring').split(',')[1];

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Documents,
        });

        await Share.share({
          title: 'SplitPay Report',
          text: 'Expense report',
          url: savedFile.uri,
        });

        toast.success('Report ready to save');
      } else {
        doc.save(fileName);
        toast.success('Report downloaded');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-semibold mb-2">Expense Reports</h1>
      <p className="text-sm text-slate-600 mb-4">
        Download full group expense report
      </p>

      <select
        className="w-full h-11 rounded-xl border px-3 mb-4"
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

      <Button
        className="w-full"
        onClick={generatePDF}
        disabled={loading || !selectedGroupId}
      >
        {loading ? 'Generating...' : <><Download size={18} /> Download Report</>}
      </Button>
    </div>
  );
}
