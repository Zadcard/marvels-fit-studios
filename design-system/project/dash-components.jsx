// Marvel's Fit Studios — Shared Dashboard UI Components
// Exported to window for use by other script tags

function Badge({ tone = 'neutral', dot = false, children }) {
  const cls = ['dashboard-badge', tone !== 'neutral' ? `dashboard-badge--${tone}` : ''].filter(Boolean).join(' ');
  return (
    <span className={cls} style={dot ? {display:'inline-flex',alignItems:'center',gap:5} : {}}>
      {dot && <span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',flexShrink:0}}/>}
      {children}
    </span>
  );
}

function StatusBadge({ label, tone = 'neutral' }) {
  const colors = {
    accent:  { bg:'rgba(230,36,41,.12)',  border:'rgba(230,36,41,.35)',  color:'#ff8b8f'  },
    success: { bg:'rgba(37,211,102,.12)', border:'rgba(37,211,102,.32)', color:'#7ce0a2'  },
    warning: { bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.32)', color:'#f5c068'  },
    neutral: { bg:'rgba(255,255,255,.05)',border:'rgba(255,255,255,.1)', color:'#cccccc'  },
  };
  const c = colors[tone] || colors.neutral;
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',minHeight:24,padding:'0 10px',
      borderRadius:999,border:`1px solid ${c.border}`,background:c.bg,color:c.color,
      fontSize:'.7rem',fontWeight:800,letterSpacing:'.07em',textTransform:'uppercase',whiteSpace:'nowrap',
    }}>{label}</span>
  );
}

function MiniStat({ label, value, description, tone = 'neutral' }) {
  const cls = ['dashboard-mini-stat', tone !== 'neutral' ? `dashboard-mini-stat--${tone}` : ''].filter(Boolean).join(' ');
  return (
    <article className={cls}>
      <span className="dashboard-mini-stat__label">{label}</span>
      <strong style={{fontFamily:'var(--font-display)',fontSize:'clamp(1.6rem,2vw,2.2rem)',letterSpacing:'-.04em',color:'#fff',lineHeight:1}}>{value}</strong>
      <p style={{fontSize:'.8rem',marginTop:4}}>{description}</p>
    </article>
  );
}

function StatCard({ label, value, change, detail, tone = 'neutral', icon }) {
  const toneColors = { accent:'#ff8b8f', success:'#7ce0a2', warning:'#f7c36a', neutral:'#c9c9c9' };
  const color = toneColors[tone];
  return (
    <article className={`dashboard-stat-card dashboard-stat-card--${tone}`}>
      <div className="dashboard-stat-card__header">
        <span className="dashboard-stat-card__label">{label}</span>
        <span className="dashboard-stat-card__icon" style={{color}}>{icon}</span>
      </div>
      <div className="dashboard-stat-card__value">{value}</div>
      <p className="dashboard-stat-card__detail">{detail}</p>
      <div className="dashboard-stat-card__footer">
        <span className="dashboard-stat-card__change">{change}</span>
        <span className="dashboard-stat-card__note">Mock metric</span>
      </div>
    </article>
  );
}

function SurfaceNote({ eyebrow, title, description, items = [], tone }) {
  const cls = ['dashboard-surface-note', tone === 'success' ? 'dashboard-surface-note--success' : ''].filter(Boolean).join(' ');
  return (
    <div className={cls}>
      <div className="dashboard-surface-note__header">
        <div>
          <span className="mv-eyebrow">{eyebrow}</span>
          <h2 style={{marginTop:8}}>{title}</h2>
          {description && <p style={{marginTop:6}}>{description}</p>}
        </div>
      </div>
      {items.length > 0 && (
        <ul className="dashboard-surface-note__list">
          {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
    </div>
  );
}

function Panel({ children, accent, dense, style }) {
  let cls = 'dashboard-panel';
  if (accent) cls += ' dashboard-panel--accent';
  if (dense) cls += ' dashboard-panel--dense';
  return <div className={cls} style={style}>{children}</div>;
}

function DashModal({ open, onClose, title, description, children, footer }) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed',inset:0,zIndex:90,display:'grid',placeItems:'center',padding:20,
    }}>
      <button onClick={onClose} style={{
        position:'absolute',inset:0,border:0,background:'rgba(0,0,0,.76)',
        backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',cursor:'pointer',
      }}/>
      <div style={{
        position:'relative',zIndex:1,
        width:'min(680px,calc(100vw - 32px))',maxHeight:'calc(100vh - 48px)',
        overflowY:'auto',borderRadius:24,
        border:'1px solid rgba(255,255,255,.1)',
        background:'linear-gradient(180deg,rgba(28,28,28,.96),rgba(10,10,10,.98))',
        backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
        boxShadow:'0 40px 100px rgba(0,0,0,.6)',padding:24,
        animation:'modalIn .28s cubic-bezier(.16,1,.3,1) both',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16,marginBottom:20}}>
          <div>
            <div className="mv-eyebrow" style={{marginBottom:8}}>{description}</div>
            <h2 style={{fontSize:'1.3rem',letterSpacing:'-.025em'}}>{title}</h2>
          </div>
          <button onClick={onClose} style={{
            minHeight:38,padding:'0 14px',border:'1px solid rgba(255,255,255,.12)',
            borderRadius:999,background:'rgba(255,255,255,.04)',color:'#ccc',
            fontSize:'.78rem',fontWeight:800,letterSpacing:'.07em',textTransform:'uppercase',cursor:'pointer',whiteSpace:'nowrap',
          }}>Close</button>
        </div>
        {children}
        {footer && (
          <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:20,paddingTop:16,borderTop:'1px solid rgba(255,255,255,.08)'}}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Toolbar({ searchValue, onSearchChange, searchPlaceholder = 'Search…', children }) {
  return (
    <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:14}}>
      <div style={{
        flex:'1 1 220px',minHeight:42,display:'flex',alignItems:'center',gap:10,
        padding:'0 14px',border:'1px solid rgba(255,255,255,.1)',borderRadius:14,
        background:'rgba(255,255,255,.03)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{color:'#888',flexShrink:0}}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={searchValue} onChange={e => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          style={{flex:1,border:0,background:'transparent',color:'#fff',fontSize:'.9rem',outline:'none'}}
        />
        {searchValue && (
          <button onClick={() => onSearchChange('')} style={{border:0,background:'transparent',color:'#888',cursor:'pointer',fontSize:'1rem',lineHeight:1}}>×</button>
        )}
      </div>
      {children}
    </div>
  );
}

function DashSelect({ label, value, onChange, options }) {
  return (
    <label style={{display:'flex',flexDirection:'column',gap:4,fontSize:'.75rem',fontWeight:800,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(255,255,255,.55)'}}>
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} className="dashboard-select">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function MvBtn({ variant='primary', size, onClick, children, disabled, style }) {
  let cls = 'mv-btn mv-btn-' + variant;
  if (size === 'sm') cls += ' mv-btn-sm';
  if (size === 'lg') cls += ' mv-btn-lg';
  return <button className={cls} onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

// Icons (inline SVG)
const Icons = {
  users:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  shield:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  dumbbell: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 5v14M18 5v14M3 9h3M18 9h3M3 15h3M18 15h3M6 9h12v6H6z"/></svg>,
  dollar:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  home:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  plus:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  chevron:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>,
  logout:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  menu:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  x:        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  edit:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  eye:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
};

Object.assign(window, { Badge, StatusBadge, MiniStat, StatCard, SurfaceNote, Panel, DashModal, Toolbar, DashSelect, MvBtn, Icons });
