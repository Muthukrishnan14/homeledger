import { useState } from 'react';
import CategoriesPage from './pages/CategoriesPage';
import MonthlyPage from './pages/MonthlyPage';
import YearlyPage from './pages/YearlyPage';
import AnalyticsPage from './pages/AnalyticsPage';
import useIsMobile from './useIsMobile';

export default function App() {
  const [page, setPage] = useState('monthly');
  const isMobile = useIsMobile();

  const navStyle = (name) => ({
    padding: isMobile ? '8px 12px' : '10px 20px',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: isMobile ? 12 : 14,
    background: page === name ? '#3b82f6' : '#334155',
    color: page === name ? 'white' : '#94a3b8',
    flex: isMobile ? '1 1 auto' : undefined,
    minWidth: isMobile ? 0 : undefined,
  });

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '12px 8px' : '24px 16px' }}>
      <div style={{
        background: '#1e293b', borderRadius: 14,
        padding: isMobile ? '12px 14px' : '18px 22px',
        marginBottom: isMobile ? 12 : 24,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 12 : 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Personal Finance</div>
            <div style={{ color: 'white', fontSize: isMobile ? 18 : 20, fontWeight: 700 }}>HomeLedger</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button style={navStyle('monthly')}   onClick={() => setPage('monthly')}>Monthly</button>
          <button style={navStyle('yearly')}    onClick={() => setPage('yearly')}>Yearly</button>
          <button style={navStyle('analytics')} onClick={() => setPage('analytics')}>Analytics</button>
          <button style={navStyle('categories')} onClick={() => setPage('categories')}>Categories</button>
        </div>
      </div>

      {page === 'monthly'    && <MonthlyPage />}
      {page === 'yearly'     && <YearlyPage />}
      {page === 'analytics'  && <AnalyticsPage />}
      {page === 'categories' && <CategoriesPage />}
    </div>
  );
}
