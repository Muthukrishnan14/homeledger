import { useState, useEffect } from 'react';
import { transactionsAPI, subCategoriesAPI, categoriesAPI } from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function MonthlyPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [transactions, setTransactions] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ subCategoryId: '', amount: '', date: '', note: '' });

  const monthKey = `${year}-${String(month).padStart(2, '0')}`;

  useEffect(() => {
    fetchTransactions();
  }, [year, month]);

  useEffect(() => {
    fetchSubCategories();
    fetchCategories();
  }, []);

  const fetchTransactions = async () => {
    const res = await transactionsAPI.getByMonth(monthKey);
    setTransactions(res.data);
  };

  const fetchSubCategories = async () => {
    const res = await subCategoriesAPI.getAll();
    setSubCategories(res.data);
  };

  const fetchCategories = async () => {
    const res = await categoriesAPI.getAll();
    setCategories(res.data);
  };

  const handlePrev = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const handleNext = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const handleSubmit = async () => {
    if (!form.subCategoryId || !form.amount || !form.date) return;
    await transactionsAPI.create({
      subCategoryId: form.subCategoryId,
      amount: parseFloat(form.amount),
      date: form.date,
      note: form.note
    });
    setForm({ subCategoryId: '', amount: '', date: '', note: '' });
    setShowForm(false);
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    await transactionsAPI.delete(id);
    fetchTransactions();
  };

  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  const cardStyle = { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
  const inputStyle = { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, width: '100%', outline: 'none' };
console.log('subCategories:', subCategories);
console.log('categories:', categories);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Month navigation */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={handlePrev} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{MONTHS[month - 1]} {year}</div>
          <div style={{ color: '#64748b', fontSize: 14 }}>Total: <strong>${total.toLocaleString()}</strong></div>
        </div>
        <button onClick={handleNext} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>›</button>
      </div>

      {/* Add button */}
      <button onClick={() => setShowForm(!showForm)}
        style={{ padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: '#3b82f6', color: 'white' }}>
        + Add Expense
      </button>

      {/* Add form */}
      {showForm && (
        <div style={cardStyle}>
          <h3 style={{ marginBottom: 16, fontWeight: 700 }}>New Expense</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <select value={form.subCategoryId} onChange={e => setForm({ ...form, subCategoryId: e.target.value })} style={inputStyle}>
              <option value=''>Select category</option>
              {categories.map(cat => (
                <optgroup key={cat._id} label={cat.name}>
                  {subCategories.filter(s => s.categoryId && s.categoryId._id === cat._id).map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            <input type="number" placeholder="Amount" value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })} style={inputStyle} />

            <input type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} style={inputStyle} />

            <input type="text" placeholder="Note (optional)" value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })} style={inputStyle} />

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowForm(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e2e8f0', cursor: 'pointer', background: 'white', fontWeight: 600 }}>
                Cancel
              </button>
              <button onClick={handleSubmit}
                style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: '#3b82f6', color: 'white', fontWeight: 700 }}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div style={cardStyle}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Transactions</h3>
        {transactions.length === 0 && (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: 24 }}>No expenses for this month</div>
        )}
        {transactions.map(tx => (
          <div key={tx._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>
                {tx.subCategoryId?.name} 
                <span style={{ color: '#94a3b8', fontWeight: 400 }}> · {tx.subCategoryId?.categoryId?.name}</span>
              </div>
              {tx.note && <div style={{ fontSize: 12, color: '#94a3b8' }}>{tx.note}</div>}
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(tx.date).toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>${tx.amount.toLocaleString()}</span>
              <button onClick={() => handleDelete(tx._id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}>✕</button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}