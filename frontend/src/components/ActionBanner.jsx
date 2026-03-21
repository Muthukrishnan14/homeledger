import { useEffect, useState } from 'react';
import useIsMobile from '../useIsMobile';

export default function ActionBanner({ action, onDismiss, onUndo }) {
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [action]);

  if (!action) return null;

  const isEdit = action.type === 'edited';
  const bg = isEdit ? '#fef3c7' : '#dcfce7';
  const border = isEdit ? '#f59e0b' : '#22c55e';
  const icon = isEdit ? '✏' : '✓';

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 10,
      padding: isMobile ? '10px 12px' : '12px 16px',
      marginBottom: isMobile ? 10 : 14,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'space-between',
      gap: isMobile ? 8 : 12,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(-10px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
          {icon} {isEdit ? (
            <>Edited <strong>{action.subCategoryName}</strong>: ${action.previousAmount?.toLocaleString()} → ${action.amount.toLocaleString()}</>
          ) : (
            <>Added <strong>${action.amount.toLocaleString()}</strong> to <strong>{action.subCategoryName}</strong>{action.newTotal != null && <> (total now: ${action.newTotal.toLocaleString()})</>}</>
          )}
        </div>
        {action.duplicateWarning && (
          <div style={{ fontSize: 12, color: '#b45309', marginTop: 4, fontWeight: 500 }}>
            ⚠ {action.duplicateWarning}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button onClick={() => { setVisible(false); setTimeout(onUndo, 200); }}
          style={{
            padding: '5px 12px', borderRadius: 6, border: `1.5px solid ${border}`,
            background: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 12,
            color: '#1e293b',
          }}>
          Undo
        </button>
        <button onClick={() => { setVisible(false); setTimeout(onDismiss, 200); }}
          style={{
            padding: '5px 8px', borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: 14,
            color: '#94a3b8', lineHeight: 1,
          }}>
          ✕
        </button>
      </div>
    </div>
  );
}
