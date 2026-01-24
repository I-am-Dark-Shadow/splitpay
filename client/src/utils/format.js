export const formatCurrency = (amount) => {
  // Safety check: Jodi amount na thake
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Rs. 0';
  }

  // Built-in formatter use korchi
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  // PDF ERROR FIX: 
  // jsPDF '₹' symbol support kore na default font-e.
  // Tai amra '₹' ke replace kore 'Rs.' kore dicchi.
  return formatted.replace('₹', 'Rs. ');
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Date format: 12 Jan 2024
  return date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
};