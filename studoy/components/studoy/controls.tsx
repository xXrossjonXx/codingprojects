'use client';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {Empty,EmptyHeader,EmptyTitle,EmptyDescription} from '@/components/ui/empty';
export function Picker({value,onChange,options,label}:{value:string;onChange:(s:string)=>void;options:{value:string;label:string}[];label:string}){return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="picker"><SelectValue placeholder={label}/></SelectTrigger><SelectContent>{options.map(o=><SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>;}
export function Meter({value,color,label}:{value:number;color?:string;label:string}){return <div style={{'--meter-color':color||'var(--primary)'} as React.CSSProperties}><Progress value={Math.min(100,Math.max(0,value))} aria-label={label} className="meter"/></div>;}
export function Blank({title,detail,children}:{title:string;detail:string;children?:React.ReactNode}){return <Empty className="blank"><EmptyHeader><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{detail}</EmptyDescription></EmptyHeader>{children}</Empty>;}
