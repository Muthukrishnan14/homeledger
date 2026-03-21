import { useState, useEffect, useMemo } from 'react';
import { transactionsAPI } from '../api';
import useIsMobile from '../useIsMobile';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AnalyticsPage() {
  const isMobile = useIsMobile();
  const now          = new Date();
  const curMonth     = now.getMonth() + 1;
  const curYear      = now.getFullYear();
  const prevMonth    = curMonth === 1 ? 12 : curMonth - 1;
  const prevYear     = curMonth === 1 ? curYear - 1 : curYear;
  const curKey       = `${curYear}-${String(curMonth).padStart(2,'0')}`;
  const prevKey      = `${prevYear}-${String(prevMonth).padStart(2,'0')}`;

  const [curTxns,  setCurTxns]  = useState([]);
  const [prevTxns, setPrevTxns] = useState([]);
  const [allData,  setAllData]  = useState({});

  useEffect(() => {
    transactionsAPI.getByMonth(curKey).then(r  => setCurTxns(r.data));
    transactionsAPI.getByMonth(prevKey).then(r => setPrevTxns(r.data));
    Promise.all(
      MONTHS.map((_,i) => {
        const m = String(i+1).padStart(2,'0');
        return transactionsAPI.getByMonth(`${curYear}-${m}`).then(r=>({ month: MONTHS[i], data: r.data }));
      })
    ).then(results => {
      const d = {};
      results.forEach(r => { d[r.month] = r.data; });
      setAllData(d);
    });
  }, []);

  const curTotal  = curTxns.reduce((s,tx) => s+tx.amount, 0);
  const prevTotal = prevTxns.reduce((s,tx) => s+tx.amount, 0);
  const monthDiff = curTotal - prevTotal;

  const monthTotals = useMemo(() => MONTHS.map(m => ({
    month: m,
    total: (allData[m]||[]).reduce((s,tx)=>s+tx.amount,0)
  })), [allData]);

  const highestMonth = monthTotals.reduce((a,b)=>b.total>a.total?b:a, {month:'—',total:0});

  const curSubTotals = useMemo(() => {
    const t = {};
    curTxns.forEach(tx => {
      const n = tx.subCategoryId?.name || 'Unknown';
      t[n] = (t[n]||0) + tx.amount;
    });
    return Object.entries(t).sort((a,b)=>b[1]-a[1]);
  }, [curTxns]);

  const prevSubTotals = useMemo(() => {
    const t = {};
    prevTxns.forEach(tx => {
      const n = tx.subCategoryId?.name || 'Unknown';
      t[n] = (t[n]||0) + tx.amount;
    });
    return t;
  }, [prevTxns]);

  const spentMore = useMemo(() => curSubTotals
    .map(([name,curr])=>({ name, curr, prev: prevSubTotals[name]||0, diff: curr-(prevSubTotals[name]||0) }))
    .filter(x => x.diff > 0 && x.prev > 0)
    .sort((a,b)=>b.diff-a.diff)
  , [curSubTotals, prevSubTotals]);

  const trends = useMemo(() => {
    const cats = {};
    Object.values(allData).flat().forEach(tx => {
      const n = tx.subCategoryId?.name || 'Unknown';
      if (!cats[n]) cats[n] = [];
      cats[n].push(tx.amount);
    });
    const latest = Object.fromEntries(curSubTotals);
    return Object.entries(cats).map(([name, amounts]) => {
      const first  = amounts[0];
      const lat    = latest[name] || amounts[amounts.length-1];
      const change = lat - first;
      const trend  = Math.abs(change) < 0.5 ? 'Flat' : change > 0 ? 'Up' : 'Down';
      return { name, first, latest: lat, change, trend };
    }).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change));
  }, [allData, curSubTotals]);

  const card = { background:'white', borderRadius:12, padding: isMobile ? 14 : 20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 12 : 16 }}>

      {/* Stat cards */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 8 : 12 }}>
        <div style={card}>
          <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>This month vs last month</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginBottom:8 }}>{MONTHS[curMonth-1]} vs {MONTHS[prevMonth-1]}</div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight:700, color: monthDiff>0?'#ef4444':'#22c55e' }}>
            {monthDiff>0?'▼':'▲'} ${Math.abs(monthDiff).toFixed(2)}
          </div>
        </div>
        <div style={card}>
          <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>Highest spend month</div>
          <div style={{ fontSize:15, fontWeight:600, color:'#f59e0b', marginBottom:8 }}>{highestMonth.month}</div>
          <div style={{ fontSize: isMobile ? 20 : 24, fontWeight:700, color:'#1e293b' }}>${highestMonth.total.toLocaleString()}</div>
        </div>
        <div style={card}>
          <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>Most expensive category</div>
          {curSubTotals[0] && (
            <>
              <div style={{ fontSize:15, fontWeight:600, color:'#3b82f6', marginBottom:8 }}>{curSubTotals[0][0]}</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight:700, color:'#1e293b' }}>${curSubTotals[0][1].toLocaleString()}</div>
            </>
          )}
        </div>
      </div>

      {/* Spent more than last month */}
      {spentMore.length > 0 && (
        <div style={card}>
          <h3 style={{ fontWeight:700, marginBottom:16, fontSize: isMobile ? 14 : 16 }}>Where you spent more than last month</h3>
          {spentMore.map(item => (
            <div key={item.name} style={{
              display:'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent:'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              padding:'8px 0',
              borderBottom:'1px solid #f1f5f9',
              gap: isMobile ? 4 : 0,
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6' }}/>
                <span style={{ fontSize:14 }}>{item.name}</span>
              </div>
              <div style={{ display:'flex', gap: isMobile ? 8 : 16, paddingLeft: isMobile ? 16 : 0 }}>
                <span style={{ fontSize:13, color:'#94a3b8' }}>${item.prev.toFixed(2)} → ${item.curr.toFixed(2)}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'#ef4444' }}>+${item.diff.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category trends YTD */}
      <div style={card}>
        <h3 style={{ fontWeight:700, marginBottom:16, fontSize: isMobile ? 14 : 16 }}>Category trends (year to date)</h3>
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize: isMobile ? 12 : 13, minWidth: isMobile ? 480 : undefined }}>
            <thead>
              <tr style={{ background:'#f8fafc' }}>
                {['Category','First','Latest','Change','Trend'].map(h=>(
                  <th key={h} style={{ padding: isMobile ? '8px 6px' : '8px 12px', textAlign: h==='Category'?'left':'right', fontWeight:700, color:'#64748b', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trends.map(row => (
                <tr key={row.name} style={{ borderBottom:'1px solid #f1f5f9' }}>
                  <td style={{ padding: isMobile ? '8px 6px' : '8px 12px', display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6', flexShrink:0 }}/>
                    <span style={{ whiteSpace:'nowrap' }}>{row.name}</span>
                  </td>
                  <td style={{ padding: isMobile ? '8px 6px' : '8px 12px', textAlign:'right', color:'#64748b' }}>${row.first.toFixed(2)}</td>
                  <td style={{ padding: isMobile ? '8px 6px' : '8px 12px', textAlign:'right', color:'#64748b' }}>${row.latest.toFixed(2)}</td>
                  <td style={{ padding: isMobile ? '8px 6px' : '8px 12px', textAlign:'right', fontWeight:600, color: row.change>0?'#ef4444':row.change<0?'#22c55e':'#94a3b8' }}>
                    {row.change>0?'+':''}{row.change.toFixed(2)}
                  </td>
                  <td style={{ padding: isMobile ? '8px 6px' : '8px 12px', textAlign:'right' }}>
                    <span style={{ padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:600,
                      background: row.trend==='Up'?'#fee2e2':row.trend==='Down'?'#dcfce7':'#f1f5f9',
                      color: row.trend==='Up'?'#ef4444':row.trend==='Down'?'#16a34a':'#94a3b8' }}>
                      {row.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
