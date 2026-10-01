'use client';
import {useState} from 'react';
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,CartesianGrid} from 'recharts';
import {duration} from '@/lib/studoy/time';
import {studyStatistics,type Period} from '@/lib/studoy/statistics';
import type {Study} from '@/lib/studoy/use-study';
import {Blank,Meter,Picker} from './controls';
export function Insights({study}:{study:Study}){
 const [period,setPeriod]=useState<Period>('all');
 const stats=studyStatistics(study.sessions,study.courses,period);
 const through=new Date(+stats.end-1);
 return <>
 <div className="stats-toolbar"><Picker label="Statistics date range" value={period} onChange={value=>setPeriod(value as Period)} options={[{value:'all',label:'All time'},{value:'12',label:'Last 12 months'},{value:'6',label:'Last 6 months'},{value:'3',label:'Last 3 months'}]}/><span className="muted small">{stats.start.toLocaleDateString(undefined,{month:'short',year:'numeric'})} – {through.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span></div>
 <div className="stats-grid"><div className="panel"><span className="eyebrow">TOTAL STUDY TIME</span><strong className="stat-value">{duration(stats.total)}</strong><p>{stats.count} sessions</p></div><div className="panel"><span className="eyebrow">AVERAGE PER SESSION</span><strong className="stat-value">{duration(stats.average)}</strong><p>Time within selected range</p></div><div className="panel"><span className="eyebrow">MOST STUDIED COURSE</span><strong className="stat-course">{stats.ranked[0]?.minutes?stats.ranked[0].name:'No sessions yet'}</strong><p>{duration(stats.ranked[0]?.minutes||0)} studied</p></div></div>
 <section className="panel chart-panel"><h2>Hours by {stats.yearly?'year':'month'}</h2><div className="chart" role="img" aria-label={stats.buckets.map(b=>`${b.name}: ${b.hours} hours`).join(', ')}><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.buckets} margin={{top:20,right:10,left:-20,bottom:5}}><CartesianGrid vertical={false} stroke="var(--border)"/><XAxis dataKey="name" axisLine={false} tickLine={false} minTickGap={25} tick={{fill:'var(--muted-foreground)',fontSize:12}}/><YAxis axisLine={false} tickLine={false} unit="h" tick={{fill:'var(--muted-foreground)',fontSize:12}}/><Tooltip contentStyle={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6}}/><Bar dataKey="hours" name="Hours" fill="#737373" radius={[3,3,0,0]} maxBarSize={48}/></BarChart></ResponsiveContainer></div></section>
 <section className="panel chart-panel"><h2>Time by course</h2>{stats.ranked.filter(c=>c.minutes>0).map(c=><div className="summary-row" key={c.id}><div><strong>{c.name}{c.archived?' (archived)':''}</strong><span>{duration(c.minutes)}</span></div><Meter label={`${c.name} share of study time`} color={c.accent} value={stats.total?c.minutes/stats.total*100:0}/></div>)}{!stats.count&&<Blank title="No sessions in this range" detail="Choose a different range or log a session."/>}</section>
 <section className="panel"><h2>Weekly goal consistency</h2><p className="muted small">Completed weeks in this range since each course was added. Compared with current goals.</p>{stats.ranked.filter(c=>!c.archived||c.minutes>0).map(c=><div className="consistency-row" key={c.id}><span className="session-dot" style={{background:c.accent}}/><strong>{c.name}</strong><span>{!c.weekly_goal_minutes?'No target':!c.completed?'No full weeks yet':`${c.reached} / ${c.completed} weeks`}</span></div>)}</section>
 </>;
}
