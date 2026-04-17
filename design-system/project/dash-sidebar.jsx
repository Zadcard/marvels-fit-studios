// Marvel's Fit Studios — Sidebar + Topbar
// Requires: Icons (from dash-components.jsx), window.DASH_DATA

const NAV_ITEMS = [
  { id:'overview',  label:'Overview',       description:'Studio snapshot',    section:'primary',   icon:'home'     },
  { id:'clients',   label:'Clients',        description:'Roster management',  section:'primary',   icon:'users'    },
  { id:'sessions',  label:'Sessions',       description:'Group & private',    section:'primary',   icon:'dumbbell' },
  { id:'coaches',   label:'Coaches',        description:'Coverage & capacity',section:'primary',   icon:'shield'   },
  { id:'schedule',  label:'Schedule',       description:'Blocks & calendar',  section:'primary',   icon:'calendar' },
  { id:'payments',  label:'Payments',       description:'Billing & renewals', section:'primary',   icon:'dollar',  badge:'7 due'  },
  { id:'settings',  label:'Settings',       description:'Studio config',      section:'secondary', icon:'settings' },
];

function DashSidebar({ activePage, onNavigate, isOpen, onClose }) {
  const { user } = DASH_DATA;
  const primary   = NAV_ITEMS.filter(n => n.section === 'primary');
  const secondary = NAV_ITEMS.filter(n => n.section === 'secondary');

  function NavSection({ label, items }) {
    return (
      <div className="dashboard-sidebar__section">
        <div className="dashboard-sidebar__section-label">{label}</div>
        <nav className="dashboard-sidebar__nav">
          {items.map(item => {
            const isActive = activePage === item.id;
            const available = item.id !== 'schedule' && item.id !== 'payments';
            const cls = isActive
              ? 'dashboard-sidebar__link dashboard-sidebar__link--active'
              : available ? 'dashboard-sidebar__link' : 'dashboard-sidebar__link--muted';
            return (
              <button key={item.id} type="button" className={cls}
                onClick={() => { if (available) { onNavigate(item.id); onClose(); }}}
                style={{textAlign:'left',width:'100%',cursor: available ? 'pointer' : 'default'}}>
                <span className="dashboard-sidebar__icon">{Icons[item.icon]}</span>
                <span className="dashboard-sidebar__item-copy">
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </span>
                {item.badge && <Badge tone="warning">{item.badge}</Badge>}
                {!available && <Badge>Soon</Badge>}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <aside className="dashboard-sidebar" data-open={isOpen ? 'true' : 'false'}>
      <div className="dashboard-sidebar__brand">
        <span style={{display:'inline-flex',alignItems:'center',gap:10,flex:1,minWidth:0}}>
          <span style={{
            width:40,height:40,display:'inline-flex',alignItems:'center',justifyContent:'center',
            borderRadius:14,border:'1px solid rgba(255,255,255,.1)',background:'rgba(0,0,0,.9)',flexShrink:0,
          }}>
            <img src="assets/Logo-3.png" style={{width:26,height:26,objectFit:'contain',filter:'brightness(0) invert(1)'}} alt="MFS"/>
          </span>
          <span style={{display:'grid',gap:2,minWidth:0}}>
            <strong style={{fontFamily:'var(--font-display)',fontSize:'.94rem',letterSpacing:'-.02em',color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Marvel's Fit Studios</strong>
            <span style={{fontSize:'.62rem',letterSpacing:'.18em',textTransform:'uppercase',color:'rgba(255,255,255,.5)'}}>Admin workspace</span>
          </span>
        </span>
        <button type="button" className="dashboard-sidebar__close" onClick={onClose}>{Icons.x}</button>
      </div>

      <NavSection label="Workspace" items={primary}/>
      <NavSection label="Account"   items={secondary}/>

      <div className="dashboard-sidebar__account">
        <div className="dashboard-sidebar__account-copy">
          <StatusBadge label="Admin" tone="accent"/>
          <strong style={{marginTop:4}}>{user.name}</strong>
          <p>{user.email}</p>
        </div>
        <button type="button" className="dashboard-sidebar__logout">
          {Icons.logout} Log out
        </button>
      </div>
    </aside>
  );
}

function DashTopbar({ activePage, onMenuToggle }) {
  const { user } = DASH_DATA;
  const meta = {
    overview:  { eyebrow:'Admin · Overview',  title:'Studio overview',      subtitle:"Your top-level snapshot of what's moving today." },
    clients:   { eyebrow:'Admin · Clients',   title:'Client roster',        subtitle:'Manage membership, billing, and coach assignments.' },
    sessions:  { eyebrow:'Admin · Sessions',  title:'Session management',   subtitle:'Build and monitor the weekly group and private schedule.' },
    coaches:   { eyebrow:'Admin · Coaches',   title:'Coach management',     subtitle:'Coverage, capacity, and coach-client assignments.' },
    schedule:  { eyebrow:'Admin · Schedule',  title:'Schedule blocks',      subtitle:'Recurring session structure and block management.' },
    payments:  { eyebrow:'Admin · Payments',  title:'Payments & renewals',  subtitle:'Billing status, pending renewals, and overdue members.' },
    settings:  { eyebrow:'Admin · Settings',  title:'Studio settings',      subtitle:'Configure studio-level preferences and defaults.' },
  };
  const m = meta[activePage] || meta.overview;
  const initials = user.name.split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase();

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__left">
        <button type="button" className="dashboard-menu-toggle" onClick={onMenuToggle}>{Icons.menu}</button>
        <div className="dashboard-topbar__meta">
          <span className="mv-eyebrow">{m.eyebrow}</span>
          <h1 className="dashboard-topbar__title">{m.title}</h1>
          <p className="dashboard-topbar__subtitle">{m.subtitle}</p>
        </div>
      </div>
      <div className="dashboard-topbar__right">
        <div className="dashboard-topbar__search" style={{display:'flex'}}>
          {Icons.search}
          <span className="dashboard-topbar__search-copy" style={{display:'grid'}}>
            <strong>Quick find</strong>
            <span>Search members, sessions, coaches</span>
          </span>
          <span className="dashboard-topbar__search-hint">/</span>
        </div>
        <a href="#" className="dashboard-topbar__profile">
          <span className="dashboard-topbar__avatar">{initials}</span>
          <span className="dashboard-topbar__profile-copy">
            <strong>{user.name}</strong>
            <small className="dashboard-topbar__profile-status">
              <span>{user.email}</span>
              <span className="dashboard-topbar__profile-separator">/</span>
              <span>Admin</span>
            </small>
          </span>
        </a>
      </div>
    </header>
  );
}

Object.assign(window, { DashSidebar, DashTopbar, NAV_ITEMS });
