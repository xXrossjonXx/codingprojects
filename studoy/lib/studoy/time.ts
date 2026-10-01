import type { Session, Timer } from './types';
export function weekBounds(date = new Date()) { const start = new Date(date); start.setHours(0,0,0,0); start.setDate(start.getDate() - (start.getDay()+6)%7); const end=new Date(start); end.setDate(end.getDate()+7); return {start,end}; }
export function shiftWeek(date:Date, offset:number) { const d=new Date(date); d.setDate(d.getDate()+7*offset); return d; }
export function minutesInRange(s:Session,start:Date,end:Date) { const intervals=s.segments?.length?s.segments:[{start:s.started_at,end:s.ended_at}]; let total=0,overlap=0; for(const part of intervals){const a=Date.parse(part.start),b=Date.parse(part.end);total+=Math.max(0,b-a);overlap+=Math.max(0,Math.min(b,+end)-Math.max(a,+start));} return total>0?s.duration_minutes*overlap/total:0; }
export function totalMinutes(sessions:Session[],start:Date,end:Date,courseId?:string){return sessions.filter(s=>!courseId||s.course_id===courseId).reduce((n,s)=>n+minutesInRange(s,start,end),0);}
export function progress(done:number,goal:number){return {remaining:Math.max(0,goal-done),percent:goal>0?Math.round(done/goal*100):0,complete:goal>0&&done>=goal};}
export function duration(minutes:number){const m=Math.round(Math.max(0,minutes));return m>=60?`${Math.floor(m/60)}h${m%60?' '+m%60+'m':''}`:`${m}m`;}
export function timerMs(t:Timer,now=Date.now()){return t.elapsed_ms+(t.running_since?Math.max(0,now-Date.parse(t.running_since)):0);}
export function clock(ms:number){const s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');}
export function localDate(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
export function validateDuration(n:number){if(!Number.isFinite(n)||n<=0||n>1440)throw new Error('Enter a duration between 1 and 1,440 minutes.');}
