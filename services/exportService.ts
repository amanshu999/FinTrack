import { Expense, Debt } from '../types';

const downloadFile = (content: string, fileName: string, contentType: string) => {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(a.href);
};

export const exportToJSON = (expenses: Expense[], debts: Debt[]) => {
  const data = {
    expenses,
    debts,
    exportedAt: new Date().toISOString(),
  };
  downloadFile(JSON.stringify(data, null, 2), `fintrack_export_${Date.now()}.json`, 'application/json');
};

export const exportToCSV = (expenses: Expense[], debts: Debt[]) => {
  // Helper to escape CSV fields
  const escape = (text: string | number | undefined) => {
    if (text === undefined || text === null) return '';
    const str = String(text);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  let csvContent = "TYPE,DATE,DESCRIPTION,AMOUNT,CATEGORY/PERSON,STATUS/TYPE\n";

  // Add Expenses
  expenses.forEach(e => {
    csvContent += `${e.type},${e.date},${escape(e.description)},${e.amount},${escape(e.category)},COMPLETED\n`;
  });

  // Add Debts
  debts.forEach(d => {
    csvContent += `DEBT,${d.dueDate || 'N/A'},${escape(d.description || 'Debt')},${d.amount},${escape(d.person)},${d.type} - ${d.status}\n`;
  });

  downloadFile(csvContent, `fintrack_export_${Date.now()}.csv`, 'text/csv');
};
