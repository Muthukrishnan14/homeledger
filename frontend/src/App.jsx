import { useState } from 'react';
import CategoriesPage from './pages/CategoriesPage';
import MonthlyPage from './pages/MonthlyPage';
import YearlyPage from './pages/YearlyPage';
import AnalyticsPage from './pages/AnalyticsPage';

export default function App() {
  const [page, setPage] = useState('monthly');

  const navStyle = (name) => ({
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: 14,
    background: page === name ? '#3b82f6' : '#334155',
    color: page === name ? 'white' : '#94a3b8'
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '18px 22px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Personal Finance</div>
          <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>HomeLedger</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={navStyle('monthly')}   onClick={() => setPage('monthly')}>Monthly Entry</button>
          <button style={navStyle('yearly')}    onClick={() => setPage('yearly')}>Year Overview</button>
          <button style={navStyle('analytics')} onClick={() => setPage('analytics')}>Analytics</button>
          <button style={navStyle('categories')} onClick={() => setPage('categories')}>⚙ Categories</button>
        </div>
      </div>

      {page === 'monthly'    && <MonthlyPage />}
      {page === 'yearly'     && <YearlyPage />}
      {page === 'analytics'  && <AnalyticsPage />}
      {page === 'categories' && <CategoriesPage />}
    </div>
  );
}