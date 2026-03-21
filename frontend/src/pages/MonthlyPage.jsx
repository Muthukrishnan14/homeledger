import { useState, useEffect, useMemo, useCallback } from 'react';
import { transactionsAPI, subCategoriesAPI, categoriesAPI, activityLogsAPI } from '../api';
import useIsMobile from '../useIsMobile';
import ActionBanner from '../components/ActionBanner';
import ActivityLogDrawer from '../components/ActivityLogDrawer';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#f97316','#06b6d4','#94a3b8'];

function DonutChart({ segments, total, size }) {
  const w = size || 180;
  const r = w * 0.33, cx = w / 2, cy = w / 2, sw = w * 0.155;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = segments.map(s => {
    const dash = (s.value / (total || 1)) * circ;
    const sl = { ...s, dash, offset };
    offset += dash;
    return sl;
  });
  return (
    <svg width={w} height={w}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={sw} />
      {slices.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color}
          strokeWidth={sw}
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={-(s.offset) + circ / 4} />
      ))}
      <text x={cx} y={cy - 8}  textAnchor="middle" fontSize="11" fill="#64748b">Total</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="15" fontWeight="700" fill="#1e293b">
        ${(total/1000).toFixed(1)}k
      </text>
    </svg>
  );
}

function timeAgoShort(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function MonthlyPage() {
  const isMobile = useIsMobile();
  const now = new Date();
  const [year, setYear]             = useState(now.getFullYear());
  const [month, setMonth]           = useState(now.getMonth() + 1);
  const [transactions, setTxns]     = useState([]);
  const [prevTxns, setPrevTxns]     = useState([]);
  const [subCats, setSubCats]       = useState([]);
  const [categories, setCats]       = useState([]);
  const [editMode, setEditMode]     = useState(false);
  const [localAmts, setLocalAmts]   = useState({});
  const [yearTotals, setYearTotals] = useState({});
  const [addRows, setAddRows]       = useState({});
  const [quickAdd, setQuickAdd]     = useState({});
  const [banner, setBanner]         = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const monthKey = `${year}-${String(month).padStart(2,'0')}`;
  const prevM    = month === 1 ? 12 : month - 1;
  const prevY    = month === 1 ? year - 1 : year;
  const prevKey  = `${prevY}-${String(prevM).padStart(2,'0')}`;

  const refreshTxns = useCallback(() =>
    transactionsAPI.getByMonth(monthKey).then(r => setTxns(r.data)),
    [monthKey]
  );

  const fetchYearTotals = async () => {
    const results = await Promise.all(
      MONTHS.map((_, i) => {
        const m = String(i + 1).padStart(2, '0');
        return transactionsAPI.getByMonth(`${year}-${m}`);
      })
    );
    const totals = {};
    results.forEach((res, i) => {
      totals[MONTHS[i]] = res.data.reduce((sum, tx) => sum + tx.amount, 0);
    });
    setYearTotals(totals);
  };

  useEffect(() => {
    setLocalAmts({});
    setAddRows({});
    setQuickAdd({});
    setBanner(null);
    transactionsAPI.getByMonth(monthKey).then(r => setTxns(r.data));
    transactionsAPI.getByMonth(prevKey).then(r => setPrevTxns(r.data));
    fetchYearTotals();
  }, [monthKey]);

  useEffect(() => {
    subCategoriesAPI.getAll().then(r => setSubCats(r.data));
    categoriesAPI.getAll().then(r => setCats(r.data));
  }, []);

  const subTotals = useMemo(() => {
    const t = {};
    transactions.forEach(tx => {
      const id = tx.subCategoryId?._id;
      if (id) t[id] = (t[id] || 0) + tx.amount;
    });
    return t;
  }, [transactions]);

  const total     = Object.values(subTotals).reduce((s,v) => s+v, 0);
  const prevTotal = prevTxns.reduce((s,tx) => s+tx.amount, 0);
  const diff      = total - prevTotal;

  const grouped = useMemo(() => {
    const g = {};
    subCats.forEach(s => {
      if (!s.categoryId) return;
      const id = s.categoryId._id;
      if (!g[id]) g[id] = [];
      g[id].push(s);
    });
    return g;
  }, [subCats]);

  const segments = useMemo(() => categories.map((cat, i) => ({
    name: cat.name,
    value: (grouped[cat._id] || []).reduce((s, sub) => s + (subTotals[sub._id] || 0), 0),
    color: COLORS[i % COLORS.length]
  })).filter(s => s.value > 0), [categories, grouped, subTotals]);

  // ── Helper: find sub-category name by id ──
  const getSubName = (subId) => {
    const sub = subCats.find(s => s._id === subId);
    return sub?.name || 'Unknown';
  };

  // ── Helper: check for duplicate and show banner ──
  const showBannerWithDupeCheck = async (actionObj) => {
    try {
      const recent = await activityLogsAPI.getRecent(actionObj.subCategoryId, 4);
      // Exclude the entry we just created (most recent one) — check for older duplicates
      const others = recent.data.filter((_, i) => i > 0);
      if (others.length > 0) {
        const prev = others[0];
        actionObj.duplicateWarning = `$${prev.amount.toLocaleString()} was also added ${timeAgoShort(prev.createdAt)}`;
      }
    } catch {
      // Silently ignore — duplicate check is best-effort
    }
    setBanner(actionObj);
  };

  const handleNav = dir => {
    if (dir === -1) { month === 1 ? (setMonth(12), setYear(y=>y-1)) : setMonth(m=>m-1); }
    else            { month === 12? (setMonth(1),  setYear(y=>y+1)) : setMonth(m=>m+1); }
  };

  const handleSaveAmt = async (subId) => {
    const val = parseFloat(localAmts[subId]);
    if (isNaN(val) || val < 0) return;
    const existing = transactions.find(tx => tx.subCategoryId?._id === subId);
    const previousAmount = existing ? existing.amount : 0;

    if (existing) {
      if (val === previousAmount) return; // no change
      await transactionsAPI.update(existing._id, { subCategoryId: subId, amount: val, date: existing.date, note: existing.note || '' });
      await refreshTxns();
      setBanner({
        type: 'edited',
        subCategoryId: subId,
        subCategoryName: getSubName(subId),
        amount: val,
        previousAmount,
        transactionId: existing._id,
        transactionDate: existing.date,
      });
    } else if (val > 0) {
      const res = await transactionsAPI.create({ subCategoryId: subId, amount: val, date: `${year}-${String(month).padStart(2,'0')}-01`, note: '' });
      await refreshTxns();
      await showBannerWithDupeCheck({
        type: 'added',
        subCategoryId: subId,
        subCategoryName: getSubName(subId),
        amount: val,
        newTotal: (subTotals[subId] || 0) + val,
        transactionId: res.data._id,
      });
    }
  };

  const handleAddRowChange = (catId, field, value) => {
    setAddRows(prev => ({
      ...prev,
      [catId]: { ...(prev[catId] || { name: '', amount: '' }), [field]: value }
    }));
  };

  const handleAddRow = async (catId) => {
    const row = addRows[catId];
    if (!row?.name?.trim()) return;
    const val = parseFloat(row.amount);
    if (isNaN(val) || val <= 0) return;
    const subRes = await subCategoriesAPI.create({ name: row.name.trim(), categoryId: catId, isFixed: false });
    const newSubId = subRes.data._id;
    const txRes = await transactionsAPI.create({
      subCategoryId: newSubId,
      amount: val,
      date: `${year}-${String(month).padStart(2,'0')}-01`,
      note: ''
    });
    setAddRows(prev => ({ ...prev, [catId]: { name: '', amount: '' } }));
    subCategoriesAPI.getAll().then(r => setSubCats(r.data));
    await refreshTxns();
    setBanner({
      type: 'added',
      subCategoryId: newSubId,
      subCategoryName: row.name.trim(),
      amount: val,
      newTotal: val,
      transactionId: txRes.data._id,
    });
  };

  const handleDeleteSub = async (subId) => {
    const existing = transactions.find(tx => tx.subCategoryId?._id === subId);
    if (existing) await transactionsAPI.delete(existing._id);
    await subCategoriesAPI.delete(subId);
    subCategoriesAPI.getAll().then(r => setSubCats(r.data));
    refreshTxns();
  };

  const closeQuickAdd = (subId) =>
    setQuickAdd(p => { const n = { ...p }; delete n[subId]; return n; });

  const handleQuickAdd = async (subId) => {
    const addVal = parseFloat(quickAdd[subId]);
    if (isNaN(addVal) || addVal <= 0) { closeQuickAdd(subId); return; }
    const res = await transactionsAPI.create({
      subCategoryId: subId,
      amount: addVal,
      date: `${year}-${String(month).padStart(2,'0')}-01`,
      note: ''
    });
    closeQuickAdd(subId);
    await refreshTxns();
    const newTotal = (subTotals[subId] || 0) + addVal;
    await showBannerWithDupeCheck({
      type: 'added',
      subCategoryId: subId,
      subCategoryName: getSubName(subId),
      amount: addVal,
      newTotal,
      transactionId: res.data._id,
    });
  };

  // ── Undo handler ──
  const handleUndo = async () => {
    if (!banner) return;
    if (banner.type === 'added') {
      await transactionsAPI.delete(banner.transactionId);
    } else if (banner.type === 'edited') {
      await transactionsAPI.update(banner.transactionId, {
        subCategoryId: banner.subCategoryId,
        amount: banner.previousAmount,
        date: banner.transactionDate || `${year}-${String(month).padStart(2,'0')}-01`,
        note: ''
      });
    }
    setBanner(null);
    refreshTxns();
  };

  const card = { background:'white', borderRadius:12, padding: isMobile ? 14 : 20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' };

  return (
    <div style={{
      display: isMobile ? 'flex' : 'grid',
      flexDirection: 'column',
      gridTemplateColumns: '1fr 280px',
      gap: isMobile ? 12 : 16,
      alignItems: 'start',
    }}>

      <div style={{ display:'flex', flexDirection:'column', gap: isMobile ? 12 : 16 }}>

        {/* Action Banner */}
        {banner && (
          <ActionBanner action={banner} onDismiss={() => setBanner(null)} onUndo={handleUndo} />
        )}

        {/* Header */}
        <div style={{
          background:'#1e40af', borderRadius:12,
          padding: isMobile ? '12px 14px' : '16px 20px',
          display:'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent:'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 10 : 0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, justifyContent: isMobile ? 'space-between' : 'flex-start' }}>
            <button onClick={()=>handleNav(-1)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', color:'white', fontSize:18 }}>‹</button>
            <div style={{ textAlign: isMobile ? 'center' : 'left' }}>
              <div style={{ color:'#93c5fd', fontSize:12 }}>Total — {MONTHS[month-1]} {year}</div>
              <div style={{ color:'white', fontSize: isMobile ? 22 : 26, fontWeight:700 }}>${total.toLocaleString()}</div>
              {prevTotal > 0 && (
                <div style={{ fontSize:12, color: diff>0?'#fca5a5':'#86efac', marginTop:2 }}>
                  {diff>0?'▲':'▼'} ${Math.abs(diff).toFixed(2)} vs {MONTHS[prevM-1]}
                </div>
              )}
            </div>
            <button onClick={()=>handleNav(1)} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 12px', cursor:'pointer', color:'white', fontSize:18 }}>›</button>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent: isMobile ? 'stretch' : 'flex-end' }}>
            <button onClick={()=> setDrawerOpen(true)}
              style={{
                padding: isMobile ? '8px 12px' : '10px 14px',
                borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13,
                border:'2px solid rgba(255,255,255,0.3)',
                background:'rgba(255,255,255,0.15)', color:'white',
                flex: isMobile ? 1 : undefined,
              }}>
              🕒 {isMobile ? '' : 'Activity'}
            </button>
            <button onClick={()=>{ setEditMode(e=>!e); setLocalAmts({}); setAddRows({}); setQuickAdd({}); }}
              style={{
                padding: isMobile ? '8px 12px' : '10px 16px',
                borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13,
                border: editMode?'2px solid #fbbf24':'2px solid rgba(255,255,255,0.3)',
                background: editMode?'#f59e0b':'rgba(255,255,255,0.15)', color:'white',
                flex: isMobile ? 1 : undefined,
              }}>
              {editMode ? '🔓' : '🔒'} Edit
            </button>
          </div>
        </div>

        {/* Month navigation bar */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(6, 1fr)' : 'repeat(12, 1fr)', gap: 4 }}>
          {MONTHS.map((m, i) => {
            const isActive = m === MONTHS[month - 1];
            const val      = yearTotals[m] || 0;
            return (
              <button key={m} onClick={() => setMonth(i + 1)}
                style={{
                  padding: isMobile ? '6px 2px' : '6px 4px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  textAlign: 'center',
                  background: isActive ? '#3b82f6' : val > 0 ? '#dbeafe' : '#f1f5f9',
                  color:      isActive ? 'white'   : val > 0 ? '#1e40af' : '#94a3b8',
                }}>
                <div style={{ fontSize: isMobile ? 11 : 12, fontWeight: 700 }}>{m}</div>
                {val > 0 && (
                  <div style={{ fontSize: 9, marginTop: 2, fontWeight: 400 }}>
                    ${(val / 1000).toFixed(1)}k
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Donut chart — shown at top on mobile */}
        {isMobile && (
          <div style={{ ...card, position: 'relative' }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:12 }}>Breakdown — {MONTHS[month-1]}</div>
            <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
              <DonutChart segments={segments} total={total} size={160}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
              {segments.map((s,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 0', borderBottom:'1px solid #f8fafc' }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:s.color, flexShrink:0 }}/>
                  <div style={{ flex:1, fontSize:11, color:'#475569' }}>{s.name}</div>
                  <div style={{ fontWeight:700, fontSize:11 }}>${s.value.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category groups */}
        {categories.map((cat, ci) => {
          const subs = grouped[cat._id] || [];
          const displaySubs = editMode
            ? subs
            : subs.filter(sub => sub.isFixed || (subTotals[sub._id] || 0) > 0);

          const catTotal = subs.reduce((s,sub)=>s+(subTotals[sub._id]||0), 0);
          const color = COLORS[ci % COLORS.length];
          const addRow = addRows[cat._id] || { name: '', amount: '' };

          return (
            <div key={cat._id} style={card}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:color }}/>
                  <span style={{ fontWeight:700, fontSize:13, textTransform:'uppercase', letterSpacing:'0.05em', color:'#64748b' }}>{cat.name}</span>
                </div>
                <span style={{ fontWeight:700, fontSize:15, color }}>${catTotal.toLocaleString()}</span>
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'4px 20px' }}>
                {displaySubs.map(sub => {
                  const val = subTotals[sub._id] || 0;
                  return (
                    <div key={sub._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f8fafc' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        {!sub.isFixed && editMode && (
                          <button onClick={() => handleDeleteSub(sub._id)}
                            title="Remove"
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#f87171', fontSize:14, lineHeight:1, padding:'0 2px', fontWeight:700 }}>
                            ×
                          </button>
                        )}
                        <span style={{ fontSize:13, color: sub.isFixed ? '#475569' : '#94a3b8', fontStyle: sub.isFixed ? 'normal' : 'italic' }}>
                          {sub.name}
                        </span>
                      </div>

                      {editMode ? (
                        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <span style={{ fontSize:12, color:'#94a3b8' }}>$</span>
                          <input type="number" min="0" step="0.01"
                            value={localAmts[sub._id] ?? val}
                            onChange={e=>setLocalAmts(p=>({...p,[sub._id]:e.target.value}))}
                            onBlur={()=>handleSaveAmt(sub._id)}
                            onKeyDown={e=>{ if(e.key==='Enter') e.target.blur(); }}
                            style={{ width:70, padding:'3px 6px', borderRadius:6, border:'1.5px solid #3b82f6', fontSize:13, fontWeight:700, textAlign:'right', outline:'none', background:'#eff6ff' }}
                          />
                        </div>
                      ) : quickAdd[sub._id] !== undefined ? (
                        <div style={{ display:'flex', alignItems:'center', gap:3 }}>
                          <span style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>+$</span>
                          <input
                            type="number" min="0" step="0.01" autoFocus
                            value={quickAdd[sub._id]}
                            onChange={e => setQuickAdd(p => ({...p, [sub._id]: e.target.value}))}
                            onKeyDown={e => {
                              if (e.key === 'Enter')  handleQuickAdd(sub._id);
                              if (e.key === 'Escape') closeQuickAdd(sub._id);
                            }}
                            onBlur={() => handleQuickAdd(sub._id)}
                            style={{ width:60, padding:'2px 6px', borderRadius:6, border:'1.5px solid #10b981', fontSize:12, fontWeight:700, textAlign:'right', outline:'none', background:'#f0fdf4' }}
                          />
                          <button onClick={() => closeQuickAdd(sub._id)}
                            style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontSize:13, padding:'0 2px', lineHeight:1 }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                          <span style={{ fontWeight:600, fontSize:13, color:'#1e293b' }}>${val.toLocaleString()}</span>
                          <button
                            onClick={() => setQuickAdd(p => ({...p, [sub._id]: ''}))}
                            title="Add to this amount"
                            style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:4, cursor:'pointer', color:'#10b981', fontSize:11, fontWeight:700, padding:'1px 6px', lineHeight:'16px' }}>
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {editMode && (
                <div style={{ display:'flex', gap:6, marginTop:10, paddingTop:10, borderTop:'1px dashed #e2e8f0', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <input
                    type="text"
                    placeholder="Item name…"
                    value={addRow.name}
                    onChange={e => handleAddRowChange(cat._id, 'name', e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddRow(cat._id); }}
                    style={{ flex: isMobile ? '1 1 100%' : 2, padding:'6px 10px', borderRadius:6, border:'1.5px dashed #cbd5e1', fontSize:13, outline:'none', color:'#475569' }}
                  />
                  <div style={{ display:'flex', gap:6, flex: isMobile ? '1 1 100%' : undefined }}>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={addRow.amount}
                      onChange={e => handleAddRowChange(cat._id, 'amount', e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddRow(cat._id); }}
                      style={{ width: isMobile ? undefined : 80, flex: isMobile ? 1 : undefined, padding:'6px 10px', borderRadius:6, border:'1.5px dashed #cbd5e1', fontSize:13, textAlign:'right', outline:'none', color:'#475569' }}
                    />
                    <button onClick={() => handleAddRow(cat._id)}
                      style={{ padding:'6px 14px', borderRadius:6, border:'none', background: addRow.name && addRow.amount ? '#3b82f6' : '#e2e8f0', color: addRow.name && addRow.amount ? 'white' : '#94a3b8', cursor: addRow.name && addRow.amount ? 'pointer' : 'default', fontWeight:700, fontSize:16, transition:'all 0.15s' }}>
                      +
                    </button>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Donut sidebar — desktop only */}
      {!isMobile && (
        <div style={{ ...card, position:'sticky', top:16 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:16 }}>Breakdown — {MONTHS[month-1]}</div>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
            <DonutChart segments={segments} total={total}/>
          </div>
          {segments.map((s,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'5px 0', borderBottom:'1px solid #f8fafc' }}>
              <div style={{ width:9, height:9, borderRadius:2, background:s.color, flexShrink:0 }}/>
              <div style={{ flex:1, fontSize:12, color:'#475569' }}>{s.name}</div>
              <div style={{ fontWeight:700, fontSize:12 }}>${s.value.toLocaleString()}</div>
              <div style={{ fontSize:10, color:'#94a3b8', width:30, textAlign:'right' }}>
                {total>0?((s.value/total)*100).toFixed(0):0}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Log Drawer */}
      <ActivityLogDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} month={monthKey} />
    </div>
  );
}
