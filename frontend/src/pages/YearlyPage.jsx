import { useState, useEffect } from 'react';
import { transactionsAPI } from '../api';
import useIsMobile from '../useIsMobile';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function YearlyPage() {
  const isMobile = useIsMobile();
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyTotals, setMonthlyTotals] = useState({});
  const [monthlyData, setMonthlyData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllMonths();
  }, [year]);

  const fetchAllMonths = async () => {
    setLoading(true);
    const results = await Promise.all(
      MONTHS.map((_, i) => {
        const month = String(i + 1).padStart(2, '0');
        return transactionsAPI.getByMonth(`${year}-${month}`);
      })
    );
    const totals = {};
    const data   = {};
    results.forEach((res, i) => {
      const month = MONTHS[i];
      totals[month] = res.data.reduce((sum, tx) => sum + tx.amount, 0);
      data[month]   = res.data;
    });
    setMonthlyTotals(totals);
    setMonthlyData(data);
    setLoading(false);
  };

  const values       = Object.values(monthlyTotals);
  const yearTotal    = values.reduce((sum, v) => sum + v, 0);
  const nonZero      = values.filter(v => v > 0);
  const average      = nonZero.length ? yearTotal / nonZero.length : 0;
  const highest      = Math.max(...values, 0);
  const lowest       = nonZero.length ? Math.min(...nonZero) : 0;
  const highestMonth = MONTHS[values.indexOf(highest)];
  const lowestMonth  = MONTHS[values.indexOf(lowest)];
  const maxBar       = highest || 1;

  const cardStyle = { background: 'white', borderRadius: 12, padding: isMobile ? 14 : 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 16 }}>

      {/* Year navigation */}
      <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={() => setYear(y => y - 1)}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>‹</button>
        <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700 }}>{year} Overview</div>
        <button onClick={() => setYear(y => y + 1)}
          style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 18 }}>›</button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 12 }}>
        {[
          { label: 'Year Total',     value: `$${yearTotal.toLocaleString()}` },
          { label: 'Monthly Avg',    value: `$${Math.round(average).toLocaleString()}` },
          { label: 'Highest Month',  value: `${highestMonth} · $${highest.toLocaleString()}` },
          { label: 'Lowest Month',   value: `${lowestMonth} · $${lowest.toLocaleString()}` }
        ].map(stat => (
          <div key={stat.label} style={{ ...cardStyle, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{stat.label}</div>
            <div style={{ fontSize: isMobile ? 14 : 18, fontWeight: 700, color: '#1e293b' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={cardStyle}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: isMobile ? 14 : 16 }}>Monthly Spend</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 3 : 8, height: isMobile ? 120 : 160 }}>
          {MONTHS.map((m, i) => {
            const val  = monthlyTotals[m] || 0;
            const prev = i > 0 ? monthlyTotals[MONTHS[i - 1]] || 0 : null;
            const pct  = (val / maxBar) * 100;
            const up   = prev !== null && val > prev;
            const down = prev !== null && val < prev;
            return (
              <div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                {!isMobile && prev !== null && val !== prev && (
                  <div style={{ fontSize: 10, color: up ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                    {up ? '▲' : '▼'}
                  </div>
                )}
                <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', height: isMobile ? 90 : 130 }}>
                  <div style={{
                    width: '100%',
                    height: `${pct}%`,
                    minHeight: val > 0 ? 4 : 0,
                    background: val === highest ? '#3b82f6' : '#bfdbfe',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.3s ease'
                  }} />
                </div>
                <div style={{ fontSize: isMobile ? 8 : 10, color: '#64748b', fontWeight: 600 }}>{m}</div>
                {val > 0 && <div style={{ fontSize: isMobile ? 7 : 9, color: '#94a3b8' }}>${(val/1000).toFixed(1)}k</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Month by month table */}
      <div style={cardStyle}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: isMobile ? 14 : 16 }}>Month by Month</h3>
        {loading ? <div style={{ color: '#94a3b8' }}>Loading...</div> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 13 : 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: isMobile ? '8px 8px' : '10px 12px', textAlign: 'left',  fontWeight: 700, color: '#64748b' }}>Month</th>
                  <th style={{ padding: isMobile ? '8px 8px' : '10px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>Total</th>
                  <th style={{ padding: isMobile ? '8px 8px' : '10px 12px', textAlign: 'right', fontWeight: 700, color: '#64748b' }}>vs Last</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map((m, i) => {
                  const val  = monthlyTotals[m] || 0;
                  const prev = i > 0 ? monthlyTotals[MONTHS[i - 1]] || 0 : null;
                  const diff = prev !== null ? val - prev : null;
                  return (
                    <tr key={m} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: isMobile ? '8px 8px' : '10px 12px', fontWeight: 600 }}>{m} {year}</td>
                      <td style={{ padding: isMobile ? '8px 8px' : '10px 12px', textAlign: 'right', fontWeight: 700 }}>
                        {val > 0 ? `$${val.toLocaleString()}` : '—'}
                      </td>
                      <td style={{ padding: isMobile ? '8px 8px' : '10px 12px', textAlign: 'right', fontSize: 13 }}>
                        {diff !== null && val > 0 && prev > 0 ? (
                          <span style={{ color: diff > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                            {diff > 0 ? '▲' : '▼'} ${Math.abs(diff).toLocaleString()}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full sub-category breakdown */}
      <div style={cardStyle}>
        <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: isMobile ? 14 : 16 }}>Full Breakdown</h3>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? 11 : 12, minWidth: isMobile ? 700 : undefined }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '8px 8px', textAlign: 'left', fontWeight: 700, color: '#64748b', minWidth: 100, position: isMobile ? 'sticky' : undefined, left: 0, background: '#f8fafc', zIndex: 1 }}>Category</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 700, color: '#64748b', minWidth: 55 }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(
                MONTHS.reduce((acc, m) => {
                  const monthData = monthlyData[m] || [];
                  monthData.forEach(tx => {
                    const name = tx.subCategoryId?.name || 'Unknown';
                    const cat  = tx.subCategoryId?.categoryId?.name || '';
                    if (!acc[cat]) acc[cat] = {};
                    if (!acc[cat][name]) acc[cat][name] = {};
                    acc[cat][name][m] = (acc[cat][name][m] || 0) + tx.amount;
                  });
                  return acc;
                }, {})
              ).map(([catName, subs]) => ([
                <tr key={catName + '-header'}>
                  <td colSpan={13} style={{ padding: '8px 8px', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', background: '#f8fafc' }}>
                    {catName}
                  </td>
                </tr>,
                ...Object.entries(subs).map(([subName, monthAmts]) => (
                  <tr key={subName} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 8px', color: '#374151', position: isMobile ? 'sticky' : undefined, left: 0, background: 'white', zIndex: 1 }}>• {subName}</td>
                    {MONTHS.map((m, mi) => {
                      const val  = monthAmts[m] || 0;
                      const prev = mi > 0 ? (monthAmts[MONTHS[mi - 1]] || 0) : null;
                      const up   = prev !== null && val > prev && val > 0;
                      const dn   = prev !== null && val < prev && prev > 0;
                      return (
                        <td key={m} style={{ padding: '7px 6px', textAlign: 'right' }}>
                          {val > 0 ? (
                            <span style={{ color: '#1e293b', fontWeight: 500 }}>
                              ${val.toLocaleString()}
                              {!isMobile && up && <span style={{ color: '#ef4444', fontSize: 10 }}> ▲</span>}
                              {!isMobile && dn && <span style={{ color: '#22c55e', fontSize: 10 }}> ▼</span>}
                            </span>
                          ) : (
                            <span style={{ color: '#e2e8f0' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ]))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
