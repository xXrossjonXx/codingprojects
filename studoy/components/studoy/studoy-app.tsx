'use client';
import {useEffect,useState} from 'react';
import {Plus,Play,Pause,Check,LogOut,Timer as TimerIcon} from 'lucide-react';
import {useStudy} from '@/lib/studoy/use-study';
import {clock,timerMs,weekBounds} from '@/lib/studoy/time';
import type {Course,Session,Timer} from '@/lib/studoy/types';
import {Home} from './dashboard';
import {History} from './history';
import {AccountForm,CourseForm,SessionForm} from './forms';
import {Picker} from './controls';
function ActiveTimer({timer,course,study,onFinish}:{timer:Timer;course?:Course;study:ReturnType<typeof useStudy>;onFinish:(t:Timer)=>void}){const [now,setNow]=useState(()=>Date.now());useEffect(()=>{const interval=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(interval);},[]);return <div className="active-timer"><div className="timer-symbol"><TimerIcon size={22}/></div><div className="timer-course"><small>{timer.running_since?'Running':'Paused'}</small><strong>{course?.name}</strong></div><span className="clock">{clock(timerMs(timer,now))}</span><button className="btn timer-pause" disabled={study.busy} onClick={()=>void study.timerAction(timer.running_since?'pause':'resume').catch(()=>{})}>{timer.running_since?<Pause size={16}/>:<Play size={16}/>}<span>{timer.running_since?'Pause':'Resume'}</span></button><button className="btn timer-finish" disabled={study.busy} onClick={async()=>{try{const t=timer.running_since?await study.timerAction('pause'):timer;onFinish(t);}catch{}}}><Check size={16}/>Finish</button></div>;}
export default function StudoyApp(){const study=useStudy();const [page,setPage]=useState('Home'),[account,setAccount]=useState(false),[courseForm,setCourseForm]=useState<{course?:Course}|null>(null),[sessionForm,setSessionForm]=useState<{courseId?:string;session?:Session;finishing?:Timer}|null>(null);const {start,end}=weekBounds();const sunday=new Date(+end-1);const requireAccount=(fn:()=>void)=>{if(!study.signed)setAccount(true);else fn();};
 useEffect(()=>{type Context={registerTool:(tool:object,options:{signal:AbortSignal})=>void|Promise<void>};const context=(document as Document&{modelContext?:Context}).modelContext;if(!context)return;const lifecycle=new AbortController();void Promise.resolve(context.registerTool({name:'get_study_overview',description:'Read visible course goals and saved study sessions. Sample data is explicitly marked.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},execute:()=>({sample:!study.signed,courses:study.courses,sessions:study.sessions,activeTimer:study.timer})},{signal:lifecycle.signal})).catch(()=>{});return()=>lifecycle.abort();},[study.signed,study.courses,study.sessions,study.timer]);

 const go=(name:string)=>{setPage(name);window.scrollTo({top:0});};
 const editCourse=(course?:Course)=>requireAccount(()=>setCourseForm({course}));
 const archiveCourse=(course:Course)=>requireAccount(()=>{if(study.timer?.course_id===course.id){study.setError('Finish this course’s timer before archiving.');return;}void study.saveCourse({...course,archived:!course.archived}).catch(()=>{});});
 return <>
 <header className="app-header"><button className="brand" onClick={()=>go('Home')}>Studoy <span className="brand-pronunciation">(like duh doy)</span></button><nav aria-label="Main navigation">{['Home','History','Settings'].map(name=><button key={name} aria-current={page===name?'page':undefined} onClick={()=>go(name)}>{name}</button>)}</nav></header>
 <main className="main-content"><div className="page-heading"><div><h1>{page}</h1>{page==='Home'&&<p>{start.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – {sunday.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</p>}</div>{page!=='Settings'&&<button className="btn primary" onClick={()=>requireAccount(()=>study.courses.some(c=>!c.archived)?setSessionForm({}):setCourseForm({}))}><Plus size={16}/>Log session</button>}</div>
 {!study.signed&&<div className="demo-banner"><span>Sample data · Connect an account to save your sessions.</span><button className="text-button" onClick={()=>setAccount(true)}>Connect</button></div>}
 {study.error&&<div role="alert" className="error-banner"><span>{study.error}</span><button className="text-button" onClick={()=>void study.connect()}>Refresh</button><button aria-label="Dismiss error" onClick={()=>study.setError('')}>×</button></div>}
 {!study.ready?<p className="muted">Loading…</p>:<>
 {page==='Home'&&<Home study={study} onLog={id=>requireAccount(()=>setSessionForm({courseId:id}))} onTimer={id=>requireAccount(()=>{if(study.timer){study.setError('Finish your active timer before starting another.');return;}void study.timerAction('start',id).catch(()=>{});})} onCourse={editCourse} onArchive={archiveCourse} onReorder={(course,direction)=>requireAccount(()=>void study.reorder(course,direction).catch(()=>{}))}/>}
 {page==='History'&&<History study={study} onEdit={session=>requireAccount(()=>setSessionForm({session}))}/>}
 {page==='Settings'&&<div className="settings-stack"><section className="panel"><h2>Appearance</h2><Picker label="Theme" value={study.theme} onChange={v=>void study.changeTheme(v as 'light'|'dark').catch(()=>{})} options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'}]}/></section><section className="panel"><h2>Account</h2><p className="muted">{study.signed?study.client?.session?.user.email:'No account connected.'}</p>{study.signed?<button className="btn" onClick={()=>void study.logout()}><LogOut size={16}/>Sign out</button>:<button className="btn" onClick={()=>setAccount(true)}>Connect Supabase & sign in</button>}</section><section className="panel"><h2>Time & goals</h2><p className="muted">Monday–Sunday · {Intl.DateTimeFormat().resolvedOptions().timeZone}</p><p className="muted small">History uses current course goals. Paused time is excluded.</p></section><details className="setup-details"><summary>Database setup</summary><a className="btn" href="/studoy-setup.sql" download>Download SQL migration</a></details></div>}
 </>}
 </main>
 {study.timer&&<ActiveTimer timer={study.timer} course={study.courses.find(c=>c.id===study.timer?.course_id)} study={study} onFinish={finishing=>setSessionForm({finishing})}/>}
 {account&&<AccountForm study={study} close={()=>setAccount(false)}/>}
 {courseForm&&<CourseForm study={study} {...courseForm} close={()=>setCourseForm(null)}/>}
 {sessionForm&&<SessionForm study={study} {...sessionForm} close={()=>setSessionForm(null)}/>}
 </>;
}
