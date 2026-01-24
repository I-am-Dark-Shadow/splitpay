export const calculateSettlements = (expenses, members) => {
  // Safety check: Jodi expenses ba members na ase, blank return koro
  if (!expenses || !members) return [];

  // 1. Calculate Net Balance for each user
  let balances = {};
  
  // FIX: Check if member exists (handle deleted users or nulls)
  members.forEach(m => {
    if (m && m._id) {
      balances[m._id] = 0;
    }
  });

  expenses.forEach(exp => {
    // Safety check: Jodi paidBy missing thake (deleted user)
    const paidById = exp.paidBy?._id || exp.paidBy; // Handle object or string ID
    const amount = exp.amount;

    if (balances[paidById] !== undefined) {
      balances[paidById] += amount;
    }

    // Split calculation
    if (exp.shares && Array.isArray(exp.shares)) {
      exp.shares.forEach(share => {
        if (balances[share.user] !== undefined) {
          balances[share.user] -= share.amount;
        }
      });
    }
  });

  // 2. Separate into Debtors (-) and Creditors (+)
  let debtors = [];
  let creditors = [];

  Object.keys(balances).forEach(userId => {
    const amount = balances[userId];
    // .01 er kom hole ignore korbo (floating point error fix)
    if (amount < -0.01) debtors.push({ userId, amount }); // Negative = Debtor
    if (amount > 0.01) creditors.push({ userId, amount });  // Positive = Creditor
  });

  // Sort by magnitude
  debtors.sort((a, b) => a.amount - b.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  // 3. Greedy Settlement Matching
  let settlements = [];
  let i = 0; // debtor index
  let j = 0; // creditor index

  while (i < debtors.length && j < creditors.length) {
    let debtor = debtors[i];
    let creditor = creditors[j];

    // Min amount settle korbo
    let amount = Math.min(Math.abs(debtor.amount), creditor.amount);
    
    // Round to 2 decimals
    amount = Math.round(amount * 100) / 100;

    if (amount > 0) {
      settlements.push({
        from: debtor.userId,
        to: creditor.userId,
        amount
      });
    }

    // Adjust balances
    debtor.amount += amount;
    creditor.amount -= amount;

    // Move indices if settled
    if (Math.abs(debtor.amount) < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  return settlements;
};