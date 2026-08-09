import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3, BookOpenCheck, CreditCard, GraduationCap, Group, Home,
  LogOut, Menu, Plus, Search, Settings, ShieldCheck, Trash2, Users,
  WalletCards, X, CalendarDays, Pencil, CheckCircle2, CircleAlert
} from "lucide-react";
import { supabase } from "./lib/supabase";
import { money, MONTHS, monthName, paymentStatus, statusLabel, todayMonth, todayYear } from "./lib/utils";
import { getGroups, getHomework, getPayments, getSettings, getStudents, getYears, upsertPayment, ensurePaymentPenalty } from "./lib/api";

const menu = [
  ["/", "Dashboard", Home],
  ["/students", "O'quvchilar", Users],
  ["/groups", "Guruhlar", Group],
  ["/homework", "Vazifalar", BookOpenCheck],
  ["/penalties", "Vazifasi bajarilmaganlar", CircleAlert],
  ["/payments", "To'lovlar", CreditCard],
  ["/years", "Yillar", CalendarDays],
  ["/settings", "Sozlamalar", Settings]
];

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return <div className={`toast ${toast.type || "success"}`} onClick={onClose}>{toast.message}</div>;
}

function Modal({ title, children, onClose, wide=false }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className={`modal ${wide ? "modal-wide" : ""}`}>
      <div className="modal-head"><h3>{title}</h3><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>
      {children}
    </div>
  </div>;
}

function Login({ onLogin }) {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function submit(e){
    e.preventDefault(); setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({email,password});
    if(error) setError(error.message);
    else onLogin();
    setLoading(false);
  }
  return <div className="login-page">
    <div className="login-card">
      <div className="brand-mark"><GraduationCap size={28}/></div>
      <h1>Fizika Kursi</h1><p className="muted">Admin boshqaruv paneli</p>
      <form onSubmit={submit} className="form-stack">
        <label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com"/></label>
        <label>Parol<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-btn full" disabled={loading}>{loading ? "Kirilmoqda..." : "Kirish"}</button>
      </form>
    </div>
  </div>;
}

function App() {
  const [session,setSession]=useState(null);
  const [checking,setChecking]=useState(true);
  const [toast,setToast]=useState(null);
  const [data,setData]=useState({students:[],groups:[],years:[],payments:[],homework:[],settings:{penalty_amount:50000}});
  const [refresh,setRefresh]=useState(0);
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setChecking(false)});
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s));
    return ()=>subscription.unsubscribe();
  },[]);
  useEffect(()=>{
    if(!session)return;
    Promise.all([getStudents(),getGroups(),getYears(),getPayments(),getHomework(),getSettings()])
      .then(([students,groups,years,payments,homework,settings])=>setData({students,groups,years,payments,homework,settings}))
      .catch(e=>notify(e.message,"error"));
  },[session,refresh]);
  function notify(message,type="success"){setToast({message,type});setTimeout(()=>setToast(null),3000)}
  if(checking) return <div className="loading-screen">Yuklanmoqda...</div>;
  if(!session) return <Login onLogin={()=>setRefresh(x=>x+1)}/>;
  return <Shell data={data} refresh={()=>setRefresh(x=>x+1)} notify={notify}/>;
}

function Shell({data,refresh,notify}) {
  const [open,setOpen]=useState(false);
  const [profileOpen,setProfileOpen]=useState(false);
  const location=useLocation();
  const navigate=useNavigate();
  const current=menu.find(x=>x[0]===location.pathname)?.[1] || "Dashboard";
  async function logout(){await supabase.auth.signOut();navigate("/");}
  return <div className="app-shell">
    <aside className={`sidebar ${open?"open":""}`}>
      <div className="side-brand"><div className="brand-mark small"><GraduationCap size={20}/></div><div><b>Pulsar</b><span>Admin panel</span></div><button className="mobile-close icon-btn" onClick={()=>setOpen(false)}><X size={18}/></button></div>
      <nav>{menu.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==="/"} onClick={()=>setOpen(false)} className={({isActive})=>isActive?"active":""}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <button className="logout" onClick={logout}><LogOut size={18}/> Chiqish</button>
    </aside>
    <main className="main">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={()=>setOpen(true)}><Menu/></button>
        <div><h2>{current}</h2><p>{new Date().toLocaleDateString("uz-UZ",{day:"numeric",month:"long",year:"numeric"})}</p></div>
        <div className="top-actions">
          <button className="avatar" onClick={()=>setProfileOpen(!profileOpen)}><ShieldCheck size={18}/></button>
          {profileOpen && <div className="profile-pop"><b>Administrator</b><span>Admin hisob</span><button onClick={logout}>Chiqish</button></div>}
        </div>
      </header>
      <div className="content">
        <Routes>
          <Route path="/" element={<Dashboard data={data}/>}/>
          <Route path="/students" element={<Students data={data} refresh={refresh} notify={notify}/>}/>
          <Route path="/groups" element={<Groups data={data} refresh={refresh} notify={notify}/>}/>
          <Route path="/homework" element={<Homework data={data} refresh={refresh} notify={notify}/>}/>
          <Route path="/penalties" element={<Penalties data={data} refresh={refresh} notify={notify}/>}/>
          <Route path="/payments" element={<Payments data={data} refresh={refresh} notify={notify}/>}/>
          <Route path="/years" element={<Years data={data} refresh={refresh} notify={notify}/>}/>
          <Route path="/settings" element={<SettingsPage data={data} refresh={refresh} notify={notify}/>}/>
          <Route path="*" element={<Navigate to="/"/>}/>
        </Routes>
      </div>
    </main>
    <Toast toast={null}/>
  </div>
}

function PageHead({title,desc,button,onClick}) {
  return <div className="page-head"><div><h1>{title}</h1>{desc&&<p>{desc}</p>}</div>{button&&<button className="primary-btn" onClick={onClick}><Plus size={18}/>{button}</button>}</div>
}

function Dashboard({data}) {
  const y=todayYear(),m=todayMonth();
  const current=data.payments.filter(p=>p.year===y&&p.month===m);
  const paid=current.filter(p=>p.status==="paid").length;
  const unpaid=data.students.length-paid;
  const failed=data.homework.filter(h=>h.year===y&&h.month===m&&!h.completed).length;
  const collected=current.reduce((s,p)=>s+Number(p.paid_amount||0),0);
  const due=data.students.reduce((s,st)=>{
    const p=current.find(x=>x.student_id===st.id);
    return s+(p?Number(p.base_amount)+Number(p.additional_amount):Number(st.monthly_fee||0));
  },0);
  return <><PageHead title="Dashboard" desc={`${MONTHS[m-1]} ${y} holati`}/>
    <div className="stats-grid">
      <Stat title="Jami o'quvchilar" value={data.students.length} icon={<Users/>}/>
      <Stat title="Shu oy to'laganlar" value={paid} icon={<CheckCircle2/>}/>
      <Stat title="To'lov qilmaganlar" value={unpaid} icon={<WalletCards/>}/>
      <Stat title="Vazifasi to'liq bajarilmaganlar" value={failed} icon={<BookOpenCheck/>}/>
      <Stat title="Shu oy yig'ilgan pul" value={money(collected)} icon={<CreditCard/>} big/>
      <Stat title="To'lanishi kerak" value={money(due)} icon={<BarChart3/>} big/>
    </div>
    <div className="panel">
      <div className="panel-head"><h3>Joriy oy to'lovlari</h3><span className="muted">{current.length} ta yozuv</span></div>
      <div className="progress-wrap"><div className="progress"><span style={{width:`${data.students.length?Math.min(100,paid/data.students.length*100):0}%`}}/></div><b>{data.students.length?Math.round(paid/data.students.length*100):0}% to'langan</b></div>
    </div>
  </>
}
function Stat({title,value,icon,big}) {return <div className="stat-card"><div className="stat-icon">{icon}</div><span>{title}</span><strong className={big?"small-value":""}>{value}</strong></div>}

function Students({data,refresh,notify}) {
  const [search,setSearch]=useState(""); const [modal,setModal]=useState(null); const [view,setView]=useState(null);
  const filtered=data.students.filter(s=>`${s.first_name} ${s.last_name} ${s.phone||""}`.toLowerCase().includes(search.toLowerCase()));
  async function remove(s){if(!confirm(`${s.first_name} ${s.last_name} o'chirilsinmi?`))return; const {error}=await supabase.from("students").delete().eq("id",s.id); if(error)notify(error.message,"error");else{notify("O'quvchi o'chirildi");refresh()}}
  return <><PageHead title="O'quvchilar" desc={`${data.students.length} nafar o'quvchi`} button="O'quvchi qo'shish" onClick={()=>setModal({})}/>
    <div className="toolbar"><div className="search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Ism yoki familiya bo'yicha qidiring..."/></div></div>
    <div className="table-panel"><table><thead><tr><th>O'quvchi</th><th>Telefon</th><th>Guruh</th><th>Oylik</th><th>Boshlagan sana</th><th></th></tr></thead>
    <tbody>{filtered.map(s=><tr key={s.id}><td><b>{s.first_name} {s.last_name}</b></td><td>{s.phone||"-"}</td><td>{s.course_groups?.name||"-"}</td><td>{money(s.monthly_fee)}</td><td>{s.started_at||"-"}</td><td><div className="row-actions"><button className="text-btn" onClick={()=>setView(s)}>Ko'rish</button><button className="icon-btn" onClick={()=>setModal(s)}><Pencil size={16}/></button><button className="icon-btn danger" onClick={()=>remove(s)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table>{!filtered.length&&<Empty text="O'quvchilar topilmadi."/>}</div>
    {modal&&<StudentModal student={modal.id?modal:null} data={data} refresh={refresh} notify={notify} onClose={()=>setModal(null)}/>}
    {view&&<StudentView student={view} data={data} onClose={()=>setView(null)}/>}
  </>
}
function StudentModal({student,data,refresh,notify,onClose}) {
  const [form,setForm]=useState({first_name:student?.first_name||"",last_name:student?.last_name||"",phone:student?.phone||"",group_id:student?.group_id||"",monthly_fee:student?.monthly_fee||"",started_at:student?.started_at||""});
  const [loading,setLoading]=useState(false);
  const save=async e=>{e.preventDefault();setLoading(true);const payload={...form,monthly_fee:Number(form.monthly_fee||0),group_id:form.group_id||null};
    const q=student?supabase.from("students").update(payload).eq("id",student.id):supabase.from("students").insert(payload);
    const {error}=await q;if(error)notify(error.message,"error");else{notify(student?"O'quvchi yangilandi":"O'quvchi qo'shildi");refresh();onClose()}setLoading(false)};
  return <Modal title={student?"O'quvchini tahrirlash":"Yangi o'quvchi"} onClose={onClose}><form onSubmit={save} className="form-grid">
    <label>Ism<input required value={form.first_name} onChange={e=>setForm({...form,first_name:e.target.value})}/></label>
    <label>Familiya<input required value={form.last_name} onChange={e=>setForm({...form,last_name:e.target.value})}/></label>
    <label>Telefon<input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+998 90 123 45 67"/></label>
    <label>Guruh<select value={form.group_id} onChange={e=>setForm({...form,group_id:e.target.value})}><option value="">Guruh tanlang</option>{data.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
    <label>Oylik to'lov (so'm)<input required type="number" min="0" value={form.monthly_fee} onChange={e=>setForm({...form,monthly_fee:e.target.value})}/></label>
    <label>Boshlagan sana<input type="date" value={form.started_at} onChange={e=>setForm({...form,started_at:e.target.value})}/></label>
    <div className="modal-actions"><button type="button" className="ghost-btn" onClick={onClose}>Bekor qilish</button><button className="primary-btn" disabled={loading}>{loading?"Saqlanmoqda...":"Saqlash"}</button></div>
  </form></Modal>
}
function StudentView({student,data,onClose}) {
  const payments=data.payments.filter(p=>p.student_id===student.id);
  const homework=data.homework.filter(h=>h.student_id===student.id);
  return <Modal wide title={`${student.first_name} ${student.last_name}`} onClose={onClose}>
    <div className="detail-grid"><div><span>Telefon</span><b>{student.phone||"-"}</b></div><div><span>Guruh</span><b>{student.course_groups?.name||"-"}</b></div><div><span>Oylik</span><b>{money(student.monthly_fee)}</b></div><div><span>Boshlagan sana</span><b>{student.started_at||"-"}</b></div></div>
    <h4>12 oylik to'lovlar</h4><div className="months-grid">{MONTHS.map((name,i)=>{const p=payments.find(x=>x.month===i+1&&x.year===todayYear());const st=p?.status||"unpaid";return <div className={`month-card ${st}`} key={name}><span>{name}</span><b>{statusLabel[st]}</b><small>{p?money(p.paid_amount):"0 so'm"}</small></div>})}</div>
    <h4>Vazifalar</h4><div className="mini-list">{homework.slice(0,12).map(h=><div key={h.id}><span>{h.year} · {monthName(h.month)} · {h.task_number}-vazifa</span><b className={h.completed?"ok":"bad"}>{h.completed?"Bajarilgan":"Bajarilmagan"}</b></div>)}</div>
  </Modal>
}

function Groups({data,refresh,notify}) {
  const [name,setName]=useState(""); const [editing,setEditing]=useState(null);
  async function save(e){e.preventDefault();const q=editing?supabase.from("course_groups").update({name}).eq("id",editing):supabase.from("course_groups").insert({name});const {error}=await q;if(error)notify(error.message,"error");else{notify("Guruh saqlandi");setName("");setEditing(null);refresh()}}
  async function del(g){if(!confirm(`${g.name} o'chirilsinmi?`))return;const {error}=await supabase.from("course_groups").delete().eq("id",g.id);if(error)notify(error.message,"error");else{notify("Guruh o'chirildi");refresh()}}
  return <><PageHead title="Guruhlar" desc="Kurs guruhlarini boshqaring"/>
    <div className="split"><div className="panel"><h3>{editing?"Guruhni tahrirlash":"Yangi guruh"}</h3><form className="inline-form" onSubmit={save}><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Masalan: Fizika 1-guruh"/><button className="primary-btn">{editing?"Yangilash":"Qo'shish"}</button>{editing&&<button type="button" className="ghost-btn" onClick={()=>{setEditing(null);setName("")}}>Bekor</button>}</form></div></div>
    <div className="cards-grid">{data.groups.map(g=><div className="group-card" key={g.id}><div className="group-icon"><Group/></div><div><b>{g.name}</b><span>{data.students.filter(s=>s.group_id===g.id).length} nafar o'quvchi</span></div><div className="row-actions"><button className="icon-btn" onClick={()=>{setEditing(g.id);setName(g.name)}}><Pencil size={16}/></button><button className="icon-btn danger" onClick={()=>del(g)}><Trash2 size={16}/></button></div></div>)}</div>
  </>
}

function Homework({data,refresh,notify}) {
  const [year,setYear]=useState(todayYear());const [month,setMonth]=useState(todayMonth());const [group,setGroup]=useState("");
  const rows=data.students.filter(s=>!group||s.group_id===group).map(s=>({student:s,tasks:[1,2,3].map(n=>data.homework.find(h=>h.student_id===s.id&&h.year===year&&h.month===month&&h.task_number===n))}));
  async function toggle(student,task,existing){
    const completed=!existing?.completed;
    const payload={student_id:student.id,year,month,task_number:task,completed,updated_at:new Date().toISOString()};
    const {error}=await supabase.from("homework").upsert(payload,{onConflict:"student_id,year,month,task_number"});
    if(error){notify(error.message,"error");return}
    const failedBefore=rows.find(r=>r.student.id===student.id)?.tasks.filter(t=>t&&!t.completed).length||0;
    const failedAfter=failedBefore+(completed?-1:1);
    if(failedAfter>=3){try{await ensurePaymentPenalty(student,year,month,Number(data.settings.penalty_amount||0))}catch(e){notify(e.message,"error")}}
    refresh();
  }
  return <><PageHead title="Vazifalar" desc="Har oy 3 ta asosiy vazifani nazorat qiling"/>
    <div className="filters"><select value={year} onChange={e=>setYear(Number(e.target.value))}>{data.years.map(y=><option key={y.id}>{y.year}</option>)}</select><select value={month} onChange={e=>setMonth(Number(e.target.value))}>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select><select value={group} onChange={e=>setGroup(e.target.value)}><option value="">Barcha guruhlar</option>{data.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
    <div className="table-panel"><table><thead><tr><th>O'quvchi</th><th>Guruh</th><th>1-vazifa</th><th>2-vazifa</th><th>3-vazifa</th><th>Jami bajarilmagan</th></tr></thead><tbody>{rows.map(r=>{const failed=r.tasks.filter(t=>t&&!t.completed).length;return <tr key={r.student.id}><td><b>{r.student.first_name} {r.student.last_name}</b></td><td>{r.student.course_groups?.name||"-"}</td>{r.tasks.map((t,i)=><td key={i}><button className={`status-toggle ${t?.completed?"done":"notdone"}`} onClick={()=>toggle(r.student,i+1,t)}>{t?.completed?"✓ Bajarilgan":"× Bajarilmagan"}</button></td>)}<td><span className={`badge ${failed>=3?"red":failed?"yellow":"green"}`}>{failed}</span></td></tr>})}</tbody></table>{!rows.length&&<Empty text="O'quvchi yo'q."/>}</div>
  </>
}

function Penalties({data}) {
  const y=todayYear();
  const grouped={};
  data.homework.filter(h=>h.year===y).forEach(h=>{
    const s=data.students.find(x=>x.id===h.student_id);
    if(!s) return;
    const k=`${s.id}-${h.year}-${h.month}`;
    if(!grouped[k]) grouped[k]={student:s,year:h.year,month:h.month,failed:0};
    if(!h.completed) grouped[k].failed++;
  });
  const list=Object.values(grouped).filter(x=>x.failed>=3);
  return <><PageHead title="Vazifasi bajarilmaganlar" desc="Bir oyda 3 ta vazifa to'liq bajarilmagan holatlar"/>
    <div className="table-panel"><table><thead><tr><th>O'quvchi</th><th>Guruh</th><th>Oy</th><th>Bajarilmagan</th><th>Asosiy</th><th>Qo'shimcha</th><th>Jami</th></tr></thead><tbody>{list.map((r,i)=><tr key={i}><td><b>{r.student.first_name} {r.student.last_name}</b></td><td>{r.student.course_groups?.name||"-"}</td><td>{monthName(r.month)} {r.year}</td><td><span className="badge red">{r.failed} ta</span></td><td>{money(r.student.monthly_fee)}</td><td>{money(data.settings.penalty_amount)}</td><td><b>{money(Number(r.student.monthly_fee)+Number(data.settings.penalty_amount))}</b></td></tr>)}</tbody></table>{!list.length&&<Empty text="Hozircha 3 ta bajarilmagan vazifaga yetgan o'quvchi yo'q."/>}</div>
  </>
}

function Payments({data,refresh,notify}) {
  const [year,setYear]=useState("");const [month,setMonth]=useState("");const [group,setGroup]=useState("");const [status,setStatus]=useState("");
  const [modal,setModal]=useState(null);
  const list=data.students.flatMap(s=>data.years.flatMap(y=>Array.from({length:12},(_,i)=>{const p=data.payments.find(x=>x.student_id===s.id&&x.year===y.year&&x.month===i+1);return {student:s,year:y.year,month:i+1,p}}))).filter(x=>(!year||x.year===Number(year))&&(!month||x.month===Number(month))&&(!group||x.student.group_id===group)&&(!status||(x.p?.status||"unpaid")===status));
  return <><PageHead title="To'lovlar" desc="Yillar va oylar bo'yicha to'lovlarni nazorat qiling"/>
    <div className="filters"><select value={year} onChange={e=>setYear(e.target.value)}><option value="">Barcha yillar</option>{data.years.map(y=><option key={y.id}>{y.year}</option>)}</select><select value={month} onChange={e=>setMonth(e.target.value)}><option value="">Barcha oylar</option>{MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}</select><select value={group} onChange={e=>setGroup(e.target.value)}><option value="">Barcha guruhlar</option>{data.groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">Barcha holatlar</option><option value="paid">To'langan</option><option value="partial">Qisman</option><option value="unpaid">To'lanmagan</option></select></div>
    <div className="table-panel"><table><thead><tr><th>O'quvchi</th><th>Oy</th><th>Asosiy</th><th>Qo'shimcha</th><th>Jami</th><th>Holat</th><th>Sana</th><th></th></tr></thead><tbody>{list.map(x=>{const p=x.p;const add=Number(p?.additional_amount||0);const base=Number(p?.base_amount??x.student.monthly_fee);const due=base+add;return <tr key={`${x.student.id}-${x.year}-${x.month}`}><td><b>{x.student.first_name} {x.student.last_name}</b></td><td>{monthName(x.month)} {x.year}</td><td>{money(base)}</td><td>{money(add)}</td><td><b>{money(due)}</b></td><td><span className={`badge ${p?.status==="paid"?"green":p?.status==="partial"?"yellow":"red"}`}>{statusLabel[p?.status||"unpaid"]}</span></td><td>{p?.paid_at?new Date(p.paid_at).toLocaleDateString("uz-UZ"):"-"}</td><td><button className="text-btn" onClick={()=>setModal({student:x.student,year:x.year,month:x.month,p})}>To'lov</button></td></tr>})}</tbody></table></div>
    {modal&&<PaymentModal item={modal} data={data} refresh={refresh} notify={notify} onClose={()=>setModal(null)}/>}
  </>
}
function PaymentModal({item,data,refresh,notify,onClose}) {
  const [amount,setAmount]=useState(item.p?.paid_amount||"");const [loading,setLoading]=useState(false);
  async function save(e){e.preventDefault();setLoading(true);try{await upsertPayment(item.student,item.year,item.month,amount,item.p?.additional_amount||0);notify("To'lov saqlandi");refresh();onClose()}catch(e){notify(e.message,"error")}setLoading(false)}
  return <Modal title={`${item.student.first_name} ${item.student.last_name} · ${monthName(item.month)} ${item.year}`} onClose={onClose}><form className="form-stack" onSubmit={save}>
    <div className="detail-grid"><div><span>Asosiy</span><b>{money(item.p?.base_amount??item.student.monthly_fee)}</b></div><div><span>Qo'shimcha</span><b>{money(item.p?.additional_amount||0)}</b></div><div><span>Jami</span><b>{money(Number(item.p?.base_amount??item.student.monthly_fee)+Number(item.p?.additional_amount||0))}</b></div></div>
    <label>To'langan summa (so'm)<input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)}/></label>
    <div className="modal-actions"><button type="button" className="ghost-btn" onClick={onClose}>Bekor qilish</button><button className="primary-btn" disabled={loading}>{loading?"Saqlanmoqda...":"Saqlash"}</button></div>
  </form></Modal>
}

function Years({data,refresh,notify}) {
  const [year,setYear]=useState("");
  async function add(e){e.preventDefault();const n=Number(year);if(!n)return;const {error}=await supabase.from("academic_years").insert({year:n});if(error)notify(error.message,"error");else{notify("Yil qo'shildi");setYear("");refresh()}}
  async function del(y){if(!confirm(`${y.year} yilini o'chirasizmi?`))return;const {error}=await supabase.from("academic_years").delete().eq("id",y.id);if(error)notify(error.message,"error");else{notify("Yil o'chirildi");refresh()}}
  return <><PageHead title="Yillar" desc="To'lov va vazifalar uchun yillarni boshqaring"/>
    <div className="panel"><form className="inline-form" onSubmit={add}><input type="number" min="2000" max="2100" value={year} onChange={e=>setYear(e.target.value)} placeholder="Masalan: 2029"/><button className="primary-btn"><Plus size={18}/> Yangi yil</button></form></div>
    <div className="year-list">{data.years.map(y=><div className="year-row" key={y.id}><b>{y.year}</b><button className="icon-btn danger" onClick={()=>del(y)}><Trash2 size={17}/></button></div>)}</div>
  </>
}
function SettingsPage({data,refresh,notify}) {
  const [penalty,setPenalty]=useState(data.settings.penalty_amount||50000);
  async function save(e){e.preventDefault();const {error}=await supabase.from("settings").update({penalty_amount:Number(penalty),updated_at:new Date().toISOString()}).eq("id",true);if(error)notify(error.message,"error");else{notify("Sozlamalar saqlandi");refresh()}}
  return <><PageHead title="Sozlamalar" desc="Kurs hisob-kitob qoidalarini boshqaring"/>
    <div className="panel settings-panel"><div className="setting-line"><div><h3>Uy vazifasi jarimasi</h3><p>Bir oyda 3 ta vazifa to'liq bajarilmasa, o'quvchining oylik to'loviga qo'shiladigan summa.</p></div><form onSubmit={save} className="setting-form"><input type="number" min="0" value={penalty} onChange={e=>setPenalty(e.target.value)}/><span>so'm</span><button className="primary-btn">Saqlash</button></form></div></div>
  </>
}
function Empty({text}){return <div className="empty"><BookOpenCheck size={28}/><p>{text}</p></div>}

export default App;