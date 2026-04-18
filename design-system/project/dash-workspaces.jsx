// Marvel's Fit Studios — Dashboard Workspaces
// Requires: window components from dash-components + dash-sidebar

// ─── OVERVIEW ────────────────────────────────────────────────────────
function WorkspaceOverview({ onNavigate }) {
  const { stats, upcomingSessions, activity, quickActions, snapshot } = DASH_DATA;
  const statIcons = { members: Icons.users, coaches: Icons.shield, sessions: Icons.dumbbell, revenue: Icons.dollar };

  return (
    <div className="dashboard-stack">
      {/* KPI cards */}
      <div className="dashboard-kpi-grid">
        {stats.map(s => (
          <StatCard key={s.id} label={s.label} value={s.value} change={s.change} detail={s.detail} tone={s.tone} icon={statIcons[s.id]}/>
        ))}
      </div>

      <SurfaceNote
        eyebrow="Today's focus"
        title="7 members need billing attention before the weekend."
        description="Scan capacity alerts and onboarding gaps, then resolve billing watch before sessions start."
        items={[
          '2 sessions today already have coach coverage confirmed.',
          '9 members still in the onboarding queue waiting for placement.',
          '1 group session tomorrow is at full capacity — overflow handling recommended.',
        ]}
      />

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        {/* Upcoming sessions */}
        <Panel accent>
          <div className="dashboard-panel__header">
            <div>
              <span className="mv-eyebrow">Upcoming</span>
              <h2 style={{marginTop:6}}>Sessions today & tomorrow</h2>
              <p style={{marginTop:4}}>Live schedule view. Tap a session to manage it.</p>
            </div>
            <MvBtn variant="outline" size="sm" onClick={() => onNavigate('sessions')}>All sessions</MvBtn>
          </div>
          <div className="dashboard-session-list">
            {upcomingSessions.map(s => {
              const statusTone = s.status === 'Waitlist forming' ? 'warning' : s.status === 'On track' ? 'success' : 'neutral';
              const fill = Math.round((s.bookedSeats / s.capacity) * 100);
              return (
                <article key={s.id} className="dashboard-session-card dashboard-session-card--admin">
                  <div className="dashboard-session-card__topline">
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6,flexWrap:'wrap'}}>
                        <StatusBadge label={s.type} tone={s.type==='Private'?'accent':'neutral'}/>
                        <StatusBadge label={s.status} tone={statusTone}/>
                      </div>
                      <strong style={{display:'block',fontSize:'1rem',letterSpacing:'-.01em',color:'#fff'}}>{s.name}</strong>
                      <span style={{fontSize:'.82rem',color:'rgba(255,255,255,.55)',marginTop:2,display:'block'}}>{s.coachName} · {s.location}</span>
                    </div>
                    <div className="dashboard-session-card__time-block">
                      <span>{s.dayLabel}</span>
                      <strong>{s.timeLabel}</strong>
                    </div>
                  </div>
                  {s.type === 'Group' && (
                    <div style={{marginTop:12}}>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'.75rem',color:'rgba(255,255,255,.5)',marginBottom:6}}>
                        <span>{s.bookedSeats} / {s.capacity} booked</span>
                        <span>{fill}%</span>
                      </div>
                      <div style={{height:6,background:'rgba(255,255,255,.08)',borderRadius:999,overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${fill}%`,background: fill >= 100 ? 'var(--mv-warning)' : 'linear-gradient(90deg,var(--mv-primary),#ff6b6f)',borderRadius:999,transition:'width .4s ease'}}/>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </Panel>

        <div style={{display:'grid',gap:16,gridAutoRows:'min-content'}}>
          {/* Activity feed */}
          <Panel>
            <div className="dashboard-panel__header">
              <div>
                <span className="mv-eyebrow">Activity</span>
                <h2 style={{marginTop:6}}>Recent updates</h2>
              </div>
            </div>
            <div style={{display:'grid',gap:0}}>
              {activity.map((item, i) => {
                const dotColors = { success:'var(--mv-success)', warning:'var(--mv-warning)', neutral:'rgba(255,255,255,.3)' };
                return (
                  <div key={item.id} style={{
                    display:'grid',gridTemplateColumns:'20px 1fr auto',gap:10,alignItems:'flex-start',
                    padding:'12px 0',borderBottom: i < activity.length-1 ? '1px solid rgba(255,255,255,.06)' : 'none',
                  }}>
                    <span style={{width:8,height:8,borderRadius:'50%',background:dotColors[item.tone],marginTop:5,flexShrink:0}}/>
                    <div style={{minWidth:0}}>
                      <strong style={{display:'block',fontSize:'.88rem',color:'#fff',lineHeight:1.3}}>{item.title}</strong>
                      <p style={{fontSize:'.8rem',marginTop:3,lineHeight:1.5}}>{item.description}</p>
                    </div>
                    <span style={{fontSize:'.72rem',color:'rgba(255,255,255,.38)',whiteSpace:'nowrap',fontFamily:'var(--font-mono,monospace)',letterSpacing:'.04em'}}>{item.timeLabel}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Quick actions */}
          <Panel accent>
            <div className="dashboard-panel__header">
              <div>
                <span className="mv-eyebrow">Quick actions</span>
                <h2 style={{marginTop:6}}>Common tasks</h2>
              </div>
            </div>
            <div style={{display:'grid',gap:8}}>
              {quickActions.map(qa => (
                <div key={qa.id} style={{
                  display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,
                  padding:'12px 14px',border:'1px solid rgba(255,255,255,.07)',borderRadius:14,
                  background:'rgba(255,255,255,.03)',
                }}>
                  <div style={{minWidth:0}}>
                    <strong style={{display:'block',fontSize:'.9rem',color:'#fff'}}>{qa.label}</strong>
                    <p style={{fontSize:'.78rem',marginTop:2}}>{qa.description}</p>
                  </div>
                  <MvBtn variant={qa.emphasis==='primary'?'primary':'outline'} size="sm" onClick={() => onNavigate(qa.href)}>
                    {qa.ctaLabel}
                  </MvBtn>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* Studio snapshot */}
      <Panel>
        <div className="dashboard-panel__header">
          <div><span className="mv-eyebrow">Studio snapshot</span><h2 style={{marginTop:6}}>Right now</h2></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14}}>
          {snapshot.map(s => (
            <div key={s.id} style={{padding:'16px 18px',border:'1px solid rgba(255,255,255,.07)',borderRadius:16,background:'rgba(255,255,255,.03)'}}>
              <div style={{fontSize:'.72rem',fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:'rgba(255,255,255,.48)',marginBottom:8}}>{s.label}</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:'2rem',fontWeight:700,letterSpacing:'-.04em',color:'#fff',lineHeight:1}}>{s.value}</div>
              <p style={{fontSize:'.8rem',marginTop:8,lineHeight:1.5}}>{s.description}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ─── CLIENTS ─────────────────────────────────────────────────────────
function WorkspaceClients() {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [memberFilter, setMemberFilter] = React.useState('All');
  const [selectedId, setSelectedId] = React.useState(DASH_DATA.clients[0]?.id);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editClient, setEditClient] = React.useState(null);

  const filtered = DASH_DATA.clients.filter(c => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || [c.fullName, c.email, c.phone, c.assignedCoach].join(' ').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchMember = memberFilter === 'All' || c.membership === memberFilter;
    return matchSearch && matchStatus && matchMember;
  });

  const selected = filtered.find(c => c.id === selectedId) || filtered[0];
  const paymentBilling = DASH_DATA.clients.filter(c => c.paymentStatus !== 'Paid').length;
  const unassigned = DASH_DATA.clients.filter(c => c.assignedCoach === 'Unassigned').length;
  const awaiting = DASH_DATA.clients.filter(c => c.nextSession === 'Awaiting first session').length;

  const clientStatusTone = s => ({ Active:'success', Pending:'warning', Paused:'neutral' }[s] || 'neutral');
  const payTone = s => ({ Paid:'success', 'Due soon':'warning', Unpaid:'accent' }[s] || 'neutral');

  function openEdit(client) { setEditClient(client); setModalOpen(true); }
  function openNew() { setEditClient(null); setModalOpen(true); }

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <div className="dashboard-page-header">
        <div>
          <div className="dashboard-page-header__eyebrow">Admin clients</div>
        </div>
        <div className="dashboard-page-header__actions">
          <MvBtn variant="primary" onClick={openNew}>{Icons.plus} Add Client</MvBtn>
        </div>
      </div>

      <SurfaceNote
        eyebrow="Client roster"
        title={paymentBilling > 0 ? `${paymentBilling} clients need billing attention in this view.` : 'Billing is clear — focus on coach coverage and session readiness.'}
        description="Scan billing attention first, then resolve missing coach assignment or first-session readiness."
        items={[
          `${filtered.filter(c=>c.status==='Active').length} active clients currently in this filtered roster.`,
          `${unassigned} clients still need a coach assignment.`,
          `${awaiting} clients are still waiting for a first session.`,
        ]}
      />

      <div className="dashboard-mini-grid">
        <MiniStat tone={paymentBilling > 0 ? 'warning' : 'success'} label="Billing attention" value={paymentBilling} description="Due soon or unpaid."/>
        <MiniStat tone={unassigned > 0 ? 'accent' : 'success'}     label="Unassigned coach"  value={unassigned}     description="Need coach coverage."/>
        <MiniStat tone={awaiting > 0 ? 'accent' : 'success'}        label="Awaiting session"  value={awaiting}       description="No first session booked yet."/>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.35fr) 320px',gap:16,alignItems:'start'}}>
        {/* Table panel */}
        <Panel accent dense>
          <Toolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name, email, coach…">
            <DashSelect label="Status"     value={statusFilter} onChange={setStatusFilter} options={['All','Active','Pending','Paused']}/>
            <DashSelect label="Membership" value={memberFilter} onChange={setMemberFilter} options={['All','Group Membership','Private Coaching','Hybrid']}/>
          </Toolbar>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
            {[`${filtered.filter(c=>c.status==='Active').length} active`, `${paymentBilling} billing watch`, `${unassigned} unassigned`].map(t => (
              <span key={t} style={{padding:'0 10px',minHeight:26,display:'inline-flex',alignItems:'center',borderRadius:999,background:'rgba(255,255,255,.04)',color:'#ccc',fontSize:'.74rem',fontWeight:700}}>{t}</span>
            ))}
          </div>
          {filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'32px 0',color:'rgba(255,255,255,.4)',fontSize:'.9rem'}}>No clients match these filters.</div>
          ) : (
            <div style={{overflowX:'auto'}}>
              <table className="dashboard-table" style={{width:'100%',borderCollapse:'collapse',fontSize:'.86rem'}}>
                <thead>
                  <tr style={{borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                    {['Client','Membership','Payment','Coach','Actions'].map(h => (
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'.7rem',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.42)',whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      style={{
                        borderBottom:'1px solid rgba(255,255,255,.05)',cursor:'pointer',
                        background: selectedId === c.id ? 'rgba(230,36,41,.07)' : 'transparent',
                        transition:'background .15s ease',
                      }}>
                      <td style={{padding:'12px 10px'}}>
                        <strong style={{display:'block',color:'#fff'}}>{c.fullName}</strong>
                        <span style={{color:'rgba(255,255,255,.48)',fontSize:'.78rem'}}>{c.email}</span>
                      </td>
                      <td style={{padding:'12px 10px'}}>
                        <StatusBadge label={c.membership} tone="neutral"/>
                        <span style={{display:'block',fontSize:'.76rem',color:'rgba(255,255,255,.4)',marginTop:4}}>Since {c.joinedDate}</span>
                      </td>
                      <td style={{padding:'12px 10px'}}>
                        <StatusBadge label={c.paymentStatus} tone={payTone(c.paymentStatus)}/>
                        <strong style={{display:'block',color:'#fff',fontSize:'.84rem',marginTop:4}}>{c.paymentAmount}</strong>
                      </td>
                      <td style={{padding:'12px 10px'}}>
                        <span style={{color:'rgba(255,255,255,.8)',fontSize:'.84rem'}}>{c.assignedCoach}</span>
                        <StatusBadge label={c.status} tone={clientStatusTone(c.status)}/>
                      </td>
                      <td style={{padding:'12px 10px'}}>
                        <div className="dashboard-row-actions" style={{display:'flex',gap:6}}>
                          <button className="dashboard-inline-button" onClick={e=>{e.stopPropagation();setSelectedId(c.id)}}>{Icons.eye} View</button>
                          <button className="dashboard-inline-button" onClick={e=>{e.stopPropagation();openEdit(c)}}>{Icons.edit} Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Detail panel */}
        {selected ? (
          <Panel dense style={{position:'sticky',top:'calc(var(--nav-height,78px) + 16px)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:14,paddingBottom:14,borderBottom:'1px solid rgba(255,255,255,.07)'}}>
              <div style={{minWidth:0}}>
                <span className="mv-eyebrow" style={{marginBottom:6,display:'block'}}>Client detail</span>
                <h2 style={{fontSize:'1.1rem',letterSpacing:'-.02em',color:'#fff'}}>{selected.fullName}</h2>
                <p style={{fontSize:'.82rem',marginTop:4,lineHeight:1.4}}>{selected.progressNote}</p>
              </div>
              <StatusBadge label={selected.status} tone={clientStatusTone(selected.status)}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              {[
                { label:'Coach',   value: selected.assignedCoach },
                { label:'Payment', value: selected.paymentStatus, tone: payTone(selected.paymentStatus) },
                { label:'Membership', value: selected.membership },
                { label:'Amount', value: selected.paymentAmount },
              ].map(({label, value, tone}) => (
                <div key={label} style={{padding:'10px 12px',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,background:'rgba(255,255,255,.02)'}}>
                  <div style={{fontSize:'.68rem',fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',marginBottom:4}}>{label}</div>
                  {tone ? <StatusBadge label={value} tone={tone}/> : <strong style={{color:'#fff',fontSize:'.9rem'}}>{value}</strong>}
                </div>
              ))}
            </div>
            <div style={{padding:'12px 14px',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,background:'rgba(255,255,255,.02)',marginBottom:14}}>
              <div style={{fontSize:'.68rem',fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',marginBottom:6}}>Next session</div>
              <strong style={{color:'#fff',fontSize:'.88rem'}}>{selected.nextSession}</strong>
            </div>
            <div style={{padding:'12px 14px',border:'1px solid rgba(255,255,255,.06)',borderRadius:14,background:'rgba(255,255,255,.02)',marginBottom:14}}>
              <div style={{fontSize:'.68rem',fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:'rgba(255,255,255,.4)',marginBottom:4}}>Contact</div>
              <div style={{fontSize:'.84rem',color:'#ccc'}}>{selected.email}</div>
              <div style={{fontSize:'.84rem',color:'#ccc',marginTop:2}}>{selected.phone}</div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <MvBtn variant="primary" size="sm" style={{flex:1}} onClick={() => openEdit(selected)}>{Icons.edit} Edit Client</MvBtn>
            </div>
          </Panel>
        ) : null}
      </div>

      <DashModal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editClient ? 'Edit client' : 'Add client'}
        description={editClient ? 'Admin · Clients' : 'Admin · Clients'}
        footer={<>
          <MvBtn variant="outline" onClick={() => setModalOpen(false)}>Cancel</MvBtn>
          <MvBtn variant="primary" onClick={() => setModalOpen(false)}>{editClient ? 'Save client' : 'Create client'}</MvBtn>
        </>}
      >
        <div style={{display:'grid',gap:14}}>
          {[
            {label:'Full name',    placeholder: editClient?.fullName || 'Enter full name',     type:'text'},
            {label:'Email',        placeholder: editClient?.email    || 'email@example.com',   type:'email'},
            {label:'Phone',        placeholder: editClient?.phone    || '+20 1XX XXX XXXX',    type:'tel'},
          ].map(f => (
            <label key={f.label} style={{display:'grid',gap:6,fontSize:'.86rem',fontWeight:700,color:'rgba(255,255,255,.7)'}}>
              {f.label}
              <input type={f.type} defaultValue={editClient ? f.placeholder : ''} placeholder={editClient ? '' : f.placeholder}
                className="dashboard-input" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'0 14px',minHeight:46,color:'#fff',fontSize:'.9rem'}}/>
            </label>
          ))}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            {['Status','Membership'].map(f => (
              <label key={f} style={{display:'grid',gap:6,fontSize:'.86rem',fontWeight:700,color:'rgba(255,255,255,.7)'}}>
                {f}
                <select className="dashboard-select" defaultValue={f==='Status' ? editClient?.status : editClient?.membership}>
                  {f==='Status'
                    ? ['Active','Pending','Paused'].map(o=><option key={o}>{o}</option>)
                    : ['Group Membership','Private Coaching','Hybrid'].map(o=><option key={o}>{o}</option>)
                  }
                </select>
              </label>
            ))}
          </div>
          <label style={{display:'grid',gap:6,fontSize:'.86rem',fontWeight:700,color:'rgba(255,255,255,.7)'}}>
            Payment status
            <div style={{display:'flex',gap:8}}>
              {['Paid','Due soon','Unpaid'].map(s => (
                <button key={s} type="button"
                  style={{flex:1,minHeight:38,border:'1px solid rgba(255,255,255,.12)',borderRadius:999,
                    background: editClient?.paymentStatus===s ? 'var(--mv-primary)' : 'rgba(255,255,255,.04)',
                    color:'#fff',fontSize:'.76rem',fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',cursor:'pointer'}}>
                  {s}
                </button>
              ))}
            </div>
          </label>
        </div>
      </DashModal>
    </div>
  );
}

// ─── SESSIONS ────────────────────────────────────────────────────────
function WorkspaceSessions() {
  const [view, setView] = React.useState('group');
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('All');
  const [modalOpen, setModalOpen] = React.useState(false);

  const statuses = ['All','Scheduled','Waitlist','Draft','Completed','Canceled'];

  const filteredGroup = DASH_DATA.groupSessions.filter(s => {
    const q = search.trim().toLowerCase();
    const mq = !q || [s.title, s.coachName, s.location].join(' ').toLowerCase().includes(q);
    const ms = statusFilter === 'All' || s.status === statusFilter;
    return mq && ms;
  });
  const filteredPrivate = DASH_DATA.privateSessions.filter(s => {
    const q = search.trim().toLowerCase();
    const mq = !q || [s.title, s.coachName, s.clientName, s.focus].join(' ').toLowerCase().includes(q);
    const ms = statusFilter === 'All' || s.status === statusFilter;
    return mq && ms;
  });

  const atCap   = DASH_DATA.groupSessions.filter(s => s.status === 'Waitlist').length;
  const drafts  = (view === 'group' ? DASH_DATA.groupSessions : DASH_DATA.privateSessions).filter(s => s.status === 'Draft').length;
  const unassigned = DASH_DATA.privateSessions.filter(s => s.clientName === 'Unassigned').length;

  const sessionStatusTone = s => ({ Scheduled:'success', Waitlist:'warning', Draft:'neutral', Completed:'neutral', Canceled:'accent' }[s] || 'neutral');

  return (
    <div className="dashboard-stack dashboard-stack--dense">
      <div className="dashboard-page-header">
        <div><div className="dashboard-page-header__eyebrow">Admin sessions</div></div>
        <div className="dashboard-page-header__actions">
          <MvBtn variant="primary" onClick={() => setModalOpen(true)}>{Icons.plus} Create Session</MvBtn>
        </div>
      </div>

      <SurfaceNote
        eyebrow={view === 'group' ? 'Group schedule' : 'Private schedule'}
        title={view === 'group'
          ? atCap > 0 ? `${atCap} group sessions are already at capacity in this view.` : 'Group schedule is balanced — focus on coach timing and room coverage.'
          : unassigned > 0 ? `${unassigned} private sessions still need a client assignment.` : 'Private schedule is clear — focus on coach timing and follow-through.'}
        description={view === 'group'
          ? 'Use this board to catch seat pressure, move drafts to scheduled, and rebalance groups before members arrive.'
          : 'Use this board to close assignment gaps, keep coaches aligned, and confirm private sessions before the day starts.'}
        items={view === 'group'
          ? [`${filteredGroup.length} visible group sessions.`, `${filteredGroup.reduce((t,s)=>t+s.enrolled,0)} bookings placed.`, `${drafts} drafts need confirmation.`]
          : [`${filteredPrivate.length} visible private sessions.`, `${filteredPrivate.filter(s=>s.clientName!=='Unassigned').length} sessions have a client assigned.`, `${unassigned} still need assignment.`]
        }
      />

      <div className="dashboard-mini-grid">
        {view === 'group' ? <>
          <MiniStat tone={atCap > 0 ? 'warning' : 'success'} label="At capacity" value={atCap} description="Need overflow or another group."/>
          <MiniStat tone="neutral" label="Total booked" value={DASH_DATA.groupSessions.reduce((t,s)=>t+s.enrolled,0)} description="Across visible group sessions."/>
          <MiniStat tone={drafts > 0 ? 'warning' : 'success'} label="Drafts" value={drafts} description="Not fully confirmed yet."/>
        </> : <>
          <MiniStat tone={unassigned > 0 ? 'warning' : 'success'} label="Needs client" value={unassigned} description="Still missing assignment."/>
          <MiniStat tone={drafts > 0 ? 'accent' : 'success'} label="Drafts" value={drafts} description="Still need confirmation."/>
          <MiniStat tone="success" label="Assigned" value={DASH_DATA.privateSessions.filter(s=>s.clientName!=='Unassigned').length} description="Client coverage locked in."/>
        </>}
      </div>

      <Panel accent dense>
        {/* Segmented control */}
        <div style={{display:'flex',gap:4,padding:4,background:'rgba(255,255,255,.04)',borderRadius:14,marginBottom:14,width:'fit-content'}}>
          {['group','private'].map(v => (
            <button key={v} type="button" onClick={() => setView(v)} style={{
              padding:'8px 20px',borderRadius:10,border:'none',cursor:'pointer',
              fontWeight:800,fontSize:'.8rem',letterSpacing:'.06em',textTransform:'uppercase',
              background: view===v ? 'linear-gradient(135deg,var(--mv-primary),#ff4f54)' : 'transparent',
              color: view===v ? '#fff' : 'rgba(255,255,255,.55)',
              boxShadow: view===v ? '0 8px 20px rgba(230,36,41,.3)' : 'none',
              transition:'all .18s ease',
            }}>{v === 'group' ? 'Group sessions' : 'Private sessions'}</button>
          ))}
        </div>

        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12}}>
          {(view === 'group'
            ? [`${filteredGroup.length} sessions`, `${new Set(filteredGroup.map(s=>s.coachName)).size} coaches`, `${filteredGroup.reduce((t,s)=>t+Math.max(s.capacity-s.enrolled,0),0)} open spots`]
            : [`${filteredPrivate.length} sessions`, `${new Set(filteredPrivate.map(s=>s.coachName)).size} coaches`, `${filteredPrivate.filter(s=>s.clientName!=='Unassigned').length} assigned`]
          ).map(t => (
            <span key={t} style={{padding:'0 10px',minHeight:26,display:'inline-flex',alignItems:'center',borderRadius:999,background:'rgba(255,255,255,.04)',color:'#ccc',fontSize:'.74rem',fontWeight:700}}>{t}</span>
          ))}
        </div>

        <Toolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder={view==='group' ? 'Search session, coach, location…' : 'Search client, coach, focus…'}>
          <DashSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statuses}/>
        </Toolbar>

        {view === 'group' ? (
          <div style={{overflowX:'auto'}}>
            <table className="dashboard-table" style={{width:'100%',borderCollapse:'collapse',fontSize:'.86rem'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                  {['Session','When','Location','Coach','Seats','Status',''].map(h => (
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'.7rem',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.42)',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGroup.map(s => {
                  const fill = Math.round((s.enrolled/s.capacity)*100);
                  return (
                    <tr key={s.id} style={{borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                      <td style={{padding:'12px 10px'}}><strong style={{color:'#fff'}}>{s.title}</strong></td>
                      <td style={{padding:'12px 10px',whiteSpace:'nowrap'}}>
                        <strong style={{display:'block',color:'#fff',fontSize:'.9rem'}}>{s.dayLabel}</strong>
                        <span style={{fontSize:'.78rem',color:'rgba(255,255,255,.45)',fontFamily:'monospace'}}>{s.timeLabel}</span>
                      </td>
                      <td style={{padding:'12px 10px',color:'rgba(255,255,255,.65)',fontSize:'.84rem'}}>{s.location}</td>
                      <td style={{padding:'12px 10px',color:'rgba(255,255,255,.8)',fontSize:'.84rem'}}>{s.coachName}</td>
                      <td style={{padding:'12px 10px',minWidth:100}}>
                        <div style={{fontSize:'.78rem',color:'rgba(255,255,255,.55)',marginBottom:4}}>{s.enrolled}/{s.capacity}</div>
                        <div style={{height:4,background:'rgba(255,255,255,.08)',borderRadius:999,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${fill}%`,background:fill>=100?'var(--mv-warning)':'linear-gradient(90deg,var(--mv-primary),#ff6b6f)',borderRadius:999}}/>
                        </div>
                      </td>
                      <td style={{padding:'12px 10px'}}><StatusBadge label={s.status} tone={sessionStatusTone(s.status)}/></td>
                      <td style={{padding:'12px 10px'}}>
                        <button className="dashboard-inline-button">{Icons.edit} Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table className="dashboard-table" style={{width:'100%',borderCollapse:'collapse',fontSize:'.86rem'}}>
              <thead>
                <tr style={{borderBottom:'1px solid rgba(255,255,255,.08)'}}>
                  {['Session','When','Client','Coach','Focus','Status',''].map(h => (
                    <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'.7rem',fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:'rgba(255,255,255,.42)',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPrivate.map(s => (
                  <tr key={s.id} style={{borderBottom:'1px solid rgba(255,255,255,.05)'}}>
                    <td style={{padding:'12px 10px'}}><strong style={{color:'#fff'}}>{s.title}</strong></td>
                    <td style={{padding:'12px 10px',whiteSpace:'nowrap'}}>
                      <strong style={{display:'block',color:'#fff'}}>{s.dayLabel}</strong>
                      <span style={{fontSize:'.78rem',color:'rgba(255,255,255,.45)',fontFamily:'monospace'}}>{s.timeLabel}</span>
                    </td>
                    <td style={{padding:'12px 10px'}}>
                      {s.clientName === 'Unassigned'
                        ? <StatusBadge label="Unassigned" tone="accent"/>
                        : <span style={{color:'rgba(255,255,255,.8)',fontSize:'.84rem'}}>{s.clientName}</span>
                      }
                    </td>
                    <td style={{padding:'12px 10px',color:'rgba(255,255,255,.8)',fontSize:'.84rem'}}>{s.coachName}</td>
                    <td style={{padding:'12px 10px',color:'rgba(255,255,255,.55)',fontSize:'.82rem',maxWidth:160}}>{s.focus}</td>
                    <td style={{padding:'12px 10px'}}><StatusBadge label={s.status} tone={sessionStatusTone(s.status)}/></td>
                    <td style={{padding:'12px 10px'}}>
                      <button className="dashboard-inline-button">{Icons.edit} Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <DashModal open={modalOpen} onClose={() => setModalOpen(false)}
        title="Create session" description="Admin · Sessions"
        footer={<>
          <MvBtn variant="outline" onClick={() => setModalOpen(false)}>Cancel</MvBtn>
          <MvBtn variant="primary" onClick={() => setModalOpen(false)}>Create Session</MvBtn>
        </>}
      >
        <div style={{display:'grid',gap:14}}>
          {[
            {label:'Session title', placeholder:'e.g. Strength Foundations', type:'text'},
            {label:'Location',      placeholder:'e.g. Floor A',               type:'text'},
            {label:'Date & time',   placeholder:'',                            type:'datetime-local'},
          ].map(f => (
            <label key={f.label} style={{display:'grid',gap:6,fontSize:'.86rem',fontWeight:700,color:'rgba(255,255,255,.7)'}}>
              {f.label}
              <input type={f.type} placeholder={f.placeholder}
                className="dashboard-input" style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.1)',borderRadius:12,padding:'0 14px',minHeight:46,color:'#fff',fontSize:'.9rem'}}/>
            </label>
          ))}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
            <label style={{display:'grid',gap:6,fontSize:'.86rem',fontWeight:700,color:'rgba(255,255,255,.7)'}}>
              Type
              <select className="dashboard-select"><option>Group</option><option>Private</option></select>
            </label>
            <label style={{display:'grid',gap:6,fontSize:'.86rem',fontWeight:700,color:'rgba(255,255,255,.7)'}}>
              Coach
              <select className="dashboard-select">
                {DASH_DATA.coaches.map(c => <option key={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>
        </div>
      </DashModal>
    </div>
  );
}

// ─── COACHES ─────────────────────────────────────────────────────────
function WorkspaceCoaches() {
  const statusTone = s => ({ 'On floor':'success', 'Session':'accent', 'Break':'warning', 'Off today':'neutral' }[s] || 'neutral');
  return (
    <div className="dashboard-stack">
      <div className="dashboard-page-header">
        <div><div className="dashboard-page-header__eyebrow">Admin coaches</div></div>
        <MvBtn variant="primary">{Icons.plus} Add Coach</MvBtn>
      </div>
      <SurfaceNote eyebrow="Coach coverage" title="All 6 coaches accounted for today." description="Review session load and client assignment balance across the coaching team."
        items={['4 coaches currently active on the floor or in session.','1 coach on break — floor coverage maintained.','1 coach off today — sessions redistributed.']}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
        {DASH_DATA.coaches.map(c => (
          <Panel key={c.id}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:14}}>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <span style={{width:44,height:44,borderRadius:'50%',background:'linear-gradient(135deg,var(--mv-primary),#ff4f54)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontWeight:800,color:'#fff',fontSize:'.9rem',flexShrink:0}}>
                  {c.name.split(' ').map(p=>p[0]).join('').slice(0,2)}
                </span>
                <div>
                  <strong style={{display:'block',color:'#fff',fontSize:'.98rem'}}>{c.name}</strong>
                  <span style={{fontSize:'.76rem',color:'rgba(255,255,255,.48)',letterSpacing:'.1em',textTransform:'uppercase'}}>{c.role}</span>
                </div>
              </div>
              <StatusBadge label={c.status} tone={statusTone(c.status)}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {[{k:'Sessions',v:c.sessions},{k:'Clients',v:c.clients}].map(({k,v}) => (
                <div key={k} style={{padding:'10px 12px',border:'1px solid rgba(255,255,255,.06)',borderRadius:12,background:'rgba(255,255,255,.02)'}}>
                  <div style={{fontSize:'.66rem',fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:'rgba(255,255,255,.38)',marginBottom:4}}>{k} this week</div>
                  <strong style={{fontFamily:'var(--font-display)',fontSize:'1.6rem',color:'#fff',letterSpacing:'-.04em'}}>{v}</strong>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { WorkspaceOverview, WorkspaceClients, WorkspaceSessions, WorkspaceCoaches });
