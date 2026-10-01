import type {Course, Session} from './types';
import {totalMinutes,weekBounds,shiftWeek} from './time';
export type Period='all'|'3'|'6'|'12';
export function statisticsRange(sessions:Session[],period:Period,now=new Date()){
 const end=new Date(now);end.setHours(0,0,0,0);end.setDate(end.getDate()+1);
 const earliest=sessions.reduce((n,s)=>Math.min(n,Date.parse(s.started_at)),+now);
 const start=period==='all'?new Date(earliest):new Date(now.getFullYear(),now.getMonth()-Number(period)+1,1);
 start.setDate(1);start.setHours(0,0,0,0);
 return {start,end};
}
export function studyStatistics(sessions:Session[],courses:Course[],period:Period,now=new Date()){
 const {start,end}=statisticsRange(sessions,period,now);
 const count=sessions.filter(s=>totalMinutes([s],start,end)>0).length;
 const total=totalMinutes(sessions,start,end);
 const months=(end.getFullYear()-start.getFullYear())*12+end.getMonth()-start.getMonth()+1;
 const yearly=months>36;
 const cursor=yearly?new Date(start.getFullYear(),0,1):new Date(start);
 const buckets:{name:string;minutes:number;hours:number}[]=[];
 while(cursor<end){
  const next=yearly?new Date(cursor.getFullYear()+1,0,1):new Date(cursor.getFullYear(),cursor.getMonth()+1,1);
  const minutes=totalMinutes(sessions,new Date(Math.max(+cursor,+start)),new Date(Math.min(+next,+end)));
  buckets.push({name:yearly?String(cursor.getFullYear()):cursor.toLocaleDateString(undefined,{month:'short',year:'2-digit'}),minutes,hours:Number((minutes/60).toFixed(2))});
  cursor.setTime(+next);
 }
 const currentWeek=weekBounds(now).start;
 const ranked=courses.map(course=>{
  const firstSession=sessions.filter(s=>s.course_id===course.id).reduce((n,s)=>Math.min(n,Date.parse(s.started_at)),+now);
  const created=course.created_at?Date.parse(course.created_at):firstSession;
  // Do not count weeks before a course existed, or partial boundary weeks.
  const eligibleStart=new Date(Math.max(+start,created));
  let week=weekBounds(eligibleStart).start;
  if(+week<+eligibleStart)week=shiftWeek(week,1);
  let completed=0,reached=0;
  while(week<currentWeek){const next=shiftWeek(week,1);completed++;if(course.weekly_goal_minutes>0&&totalMinutes(sessions,week,next,course.id)>=course.weekly_goal_minutes)reached++;week=next;}
  return {...course,minutes:totalMinutes(sessions,start,end,course.id),completed,reached};
 }).sort((a,b)=>b.minutes-a.minutes);
 return {start,end,total,count,average:count?total/count:0,buckets,yearly,ranked};
}
