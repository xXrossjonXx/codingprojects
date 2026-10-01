export type Course = { id:string; user_id:string; name:string; short_name:string; weekly_goal_minutes:number; icon:string; accent:string; archived:boolean; display_order:number; created_at?:string };
export type Segment = {start:string; end:string};
export type Session = {id:string;user_id:string;course_id:string;started_at:string;ended_at:string;duration_minutes:number;topic:string;notes:string;productivity_rating:number|null;segments:Segment[];created_at?:string};
export type Timer = {id:string;user_id:string;course_id:string;started_at:string;running_since:string|null;elapsed_ms:number;segments:Segment[];revision:number};
export type Settings = {user_id:string;theme:'light'|'dark';};
export type AuthSession = {access_token:string;refresh_token:string;expires_at:number;user:{id:string;email?:string}};
