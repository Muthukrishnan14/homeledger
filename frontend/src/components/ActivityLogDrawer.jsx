import { useState, useEffect } from 'react';
import { activityLogsAPI } from '../api';
import useIsMobile from '../useIsMobile';

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return '';
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function getDateLabel(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ActivityLogDrawer({ open, onClose, month }) {
  const isMobile = useIsMobile();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slideIn, setSlideIn] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      activityLogsAPI.getByMonth(month).then(r => {
        setLogs(r.data);
        setLoading(false);
      }).catch(() => setLoading(false));
      requestAnimationFrame(() => setSlideIn(true));
    } else {
      setSlideIn(false);
    }
  }, [open, month]);

  const handleClose = () => {
    setSlideIn(false);
    setTimeout(onClose, 250);
  };

  if (!open) return null;

  // Group by date label
  const grouped = {};
  logs.forEach(log => {
    const label = getDateLabel(log.createdAt);
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(log);
  });

  const [y, m] = month.split('-');
  const monthLabel = `${MONTHS[parseInt(m) - 1]} ${y}`;

  const actionBadge = (action) => {
    const styles = {
      added:   { bg: '#dcfce7', color: '#16a34a', label: 'Added' },
      edited:  { bg: '#fef3c7', color: '#b45309', label: 'Edited' },
      deleted: { bg: '#fee2e2', color: '#dc2626', label: 'Deleted' },
    };
    const s = styles[action] || styles.added;
    return (
      <span style={{
        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
        background: s.bg, color: s.color, textTransform: 'uppercase', letterSpacing: '0.03em',
      }}>
        {s.label}
      </span>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
        zIndex: 999, opacity: slideIn ? 1 : 0, transition: 'opacity 0.25s ease',
      }} />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: isMobile ? '100%' : 380,
        background: 'white', zIndex: 1000,
        boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        transform: slideIn ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Activity Log</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{monthLabel}</div>
          </div>
          <button onClick={handleClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 12px',
            cursor: 'pointer', fontSize: 16, color: '#64748b', fontWeight: 600,
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading...</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 14 }}>No activity yet this month</div>
            </div>
          ) : (
            Object.entries(grouped).map(([label, entries]) => (
              <div key={label} style={{ marginBottom: 20 }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase',
                  letterSpacing: '0.05em', marginBottom: 8, paddingBottom: 6,
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  {label}
                </div>

                {entries.map((log, i) => {
                  const subName = log.subCategoryId?.name || 'Unknown';
                  const catName = log.subCategoryId?.categoryId?.name || '';
                  return (
                    <div key={log._id || i} style={{
                      display: 'flex', gap: 10, padding: '10px 0',
                      borderBottom: i < entries.length - 1 ? '1px solid #f8fafc' : 'none',
                    }}>
                      {/* Timeline dot */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%',
                          background: log.action === 'added' ? '#22c55e' : log.action === 'edited' ? '#f59e0b' : '#ef4444',
                          flexShrink: 0,
                        }} />
                        {i < entries.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: '#e2e8f0', marginTop: 4 }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          {actionBadge(log.action)}
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{subName}</span>
                        </div>

                        {log.action === 'edited' ? (
                          <div style={{ fontSize: 13, color: '#475569' }}>
                            ${log.previousAmount?.toLocaleString()} → <strong>${log.amount.toLocaleString()}</strong>
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: '#475569' }}>
                            {log.action === 'deleted' ? '−' : '+'}${log.amount.toLocaleString()}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                          {catName && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{catName}</span>
                          )}
                          <span style={{ fontSize: 11, color: '#cbd5e1' }}>
                            {formatTime(log.createdAt)}
                            {timeAgo(log.createdAt) && ` · ${timeAgo(log.createdAt)}`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
