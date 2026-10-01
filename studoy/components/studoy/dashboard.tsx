'use client';
import {Check,MoreHorizontal,Play,Plus} from 'lucide-react';
import {DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuSeparator} from '@/components/ui/dropdown-menu';
import type {Study} from '@/lib/studoy/use-study';
import type {Course} from '@/lib/studoy/types';
import {duration,progress,totalMinutes,weekBounds} from '@/lib/studoy/time';
import {Blank,Meter} from './controls';
type Props={study:Study;onLog:(id?:string)=>void;onTimer:(id:string)=>void;onCourse:(course?:Course)=>void;onArchive:(course:Course)=>void;onReorder:(course:Course,direction:number)=>void};
export function Home({study,onLog,onTimer,onCourse,onArchive,onReorder}:Props){
 const {start,end}=weekBounds();
 const active=study.courses.filter(c=>!c.archived),archived=study.courses.filter(c=>c.archived);
 const done=totalMinutes(study.sessions,start,end),goal=active.reduce((n,c)=>n+c.weekly_goal_minutes,0);
 const remaining=active.reduce((n,c)=>n+Math.max(0,c.weekly_goal_minutes-totalMinutes(study.sessions,start,end,c.id)),0);
 return <>

 <div className="section-heading"><h2>Courses</h2><button className="text-button" onClick={()=>onCourse()}><Plus size={16}/>Add course</button></div>
 <div className="course-list">{active.map((c,i)=>{const n=totalMinutes(study.sessions,start,end,c.id),p=progress(n,c.weekly_goal_minutes);return <article className="course-row" key={c.id}>
 <div className="course-main"><h3><span className="course-mark" style={{background:c.accent}}/>{c.name}</h3><p>{duration(n)} / {duration(c.weekly_goal_minutes)} <span>· {p.complete?'Goal complete':c.weekly_goal_minutes?`${duration(p.remaining)} remaining`:'No target'}</span></p><Meter value={p.percent} color={c.accent} label={`${c.name} weekly progress`}/></div>
 <span className="course-percent">{p.complete&&<Check size={14}/>} {p.percent}%</span>
 <div className="course-actions"><button className="btn" disabled={study.busy} onClick={()=>onTimer(c.id)}><Play size={14}/>Start timer</button><button className="btn" onClick={()=>onLog(c.id)}><Plus size={14}/>Log</button>
 <DropdownMenu><DropdownMenuTrigger asChild><button className="icon-button" aria-label={`Manage ${c.name}`}><MoreHorizontal size={19}/></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={()=>onCourse(c)}>Edit course & goal</DropdownMenuItem><DropdownMenuItem disabled={i===0||study.busy} onSelect={()=>onReorder(c,-1)}>Move up</DropdownMenuItem><DropdownMenuItem disabled={i===active.length-1||study.busy} onSelect={()=>onReorder(c,1)}>Move down</DropdownMenuItem><DropdownMenuSeparator/><DropdownMenuItem disabled={study.busy} onSelect={()=>onArchive(c)}>Archive course</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
 </div></article>;})}</div>
 {!active.length&&<Blank title="No courses yet" detail="Add a course and set its weekly study goal."><button className="btn primary" onClick={()=>onCourse()}>Add course</button></Blank>}

 {!!archived.length&&<details className="archived-courses"><summary>Archived courses ({archived.length})</summary>{archived.map(c=><div className="archived-row" key={c.id}><span>{c.name}</span><button className="text-button" disabled={study.busy} onClick={()=>onArchive(c)}>Restore</button></div>)}</details>}
 <div className="section-heading"><h2>This week</h2></div>
 <section className="week-summary" aria-label="Weekly progress"><div className="summary-metrics"><div><span>Completed</span><strong>{duration(done)} <small>/ {duration(goal)}</small></strong></div><div><span>Remaining</span><strong>{duration(remaining)}</strong></div><div><span>Sessions</span><strong>{study.sessions.filter(s=>totalMinutes([s],start,end)>0).length}</strong></div></div><Meter value={progress(done,goal).percent} label="Overall weekly progress"/></section>
 </>;
}
