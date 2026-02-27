import { useState } from 'react';
import CategoriesPage from './pages/CategoriesPage';
import MonthlyPage from './pages/MonthlyPage';
import YearlyPage from './pages/YearlyPage';

export default function App() {
  const [page, setPage] = useState('monthly');

  const navStyle = (name) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: page === name ? '#3b82f6' : '#e2e8f0',
    color: page === name ? 'white' : '#475569'
  });

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
          HomeLedger
        </h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Household expense tracker</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={navStyle('monthly')} onClick={() => setPage('monthly')}>Monthly</button>
        <button style={navStyle('yearly')} onClick={() => setPage('yearly')}>Yearly</button>
        <button style={navStyle('categories')} onClick={() => setPage('categories')}>Categories</button>
      </div>

      {page === 'monthly' && <MonthlyPage />}
      {page === 'yearly' && <YearlyPage />}
      {page === 'categories' && <CategoriesPage />}

    </div>
  );
}