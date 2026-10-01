-- Run once in the Supabase SQL Editor. No service-role key is needed by the app.
create table public.profiles (id uuid primary key references auth.users on delete cascade, display_name text not null default '', created_at timestamptz not null default now());
create table public.courses (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 name text not null check(length(trim(name)) between 1 and 120), short_name text not null default '',
 weekly_goal_minutes integer not null default 0 check(weekly_goal_minutes between 0 and 10080),
 icon text not null default '∑', accent text not null default '#8271c9', archived boolean not null default false,
 display_order integer not null default 0, created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.study_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade,
 course_id uuid not null, started_at timestamptz not null, ended_at timestamptz not null,
 duration_minutes numeric not null check(duration_minutes > 0 and duration_minutes <= 1440),
 topic text not null default '', notes text not null default '', productivity_rating integer check(productivity_rating between 1 and 5),
 segments jsonb not null default '[]', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(course_id,user_id) references public.courses(id,user_id), check(ended_at>started_at), check(jsonb_typeof(segments)='array')
);
create index sessions_owner_date on public.study_sessions(user_id,started_at);
create table public.active_timers (
 id uuid not null default gen_random_uuid() unique, user_id uuid primary key references auth.users on delete cascade,
 course_id uuid not null, started_at timestamptz not null default now(), running_since timestamptz default now(),
 elapsed_ms double precision not null default 0 check(elapsed_ms>=0), segments jsonb not null default '[]', revision integer not null default 0,
 foreign key(course_id,user_id) references public.courses(id,user_id)
);
create table public.user_settings (user_id uuid primary key references auth.users on delete cascade, theme text not null default 'light' check(theme in ('light','dark')));
create table public.assessments (
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users on delete cascade,course_id uuid not null,
 title text not null,date date not null,score numeric not null check(score>=0),maximum_score numeric not null check(maximum_score>0),notes text not null default '',
 foreign key(course_id,user_id) references public.courses(id,user_id),check(score<=maximum_score)
);
-- Ownership is enforced by PostgreSQL, not just the browser. Composite keys prevent
-- sessions, timers or assessments referencing a different user's course.
alter table public.profiles enable row level security;
create policy own_profile on public.profiles for all to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
do $$ declare t text; begin foreach t in array array['courses','study_sessions','active_timers','user_settings','assessments'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('create policy own_rows on public.%I for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()))',t);
 end loop;end $$;
grant select,insert,update,delete on public.profiles,public.courses,public.study_sessions,public.active_timers,public.user_settings,public.assessments to authenticated;
create function public.touch_session() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
create trigger touch_session before update on public.study_sessions for each row execute function public.touch_session();
-- Server timestamp + row lock: one running timer per account, including across tabs.
create function public.timer_action(p_action text,p_course uuid default null,p_revision integer default null) returns public.active_timers
language plpgsql security invoker set search_path=public as $$
declare t public.active_timers; stamp timestamptz:=clock_timestamp(); begin
 if auth.uid() is null then raise exception 'Sign in first.'; end if;
 if p_action='start' then
  if not exists(select 1 from courses where id=p_course and user_id=auth.uid() and not archived) then raise exception 'Choose an active course.'; end if;
  insert into active_timers(user_id,course_id,started_at,running_since) values(auth.uid(),p_course,stamp,stamp) returning * into t; return t;
 end if;
 select * into t from active_timers where user_id=auth.uid() for update;
 if t.id is null then raise exception 'No active timer. Refresh and try again.'; end if;
 if t.revision is distinct from p_revision then raise exception 'Timer changed on another device. Refresh and try again.'; end if;
 if p_action='pause' and t.running_since is not null then
  t.elapsed_ms:=t.elapsed_ms+greatest(0,extract(epoch from (stamp-t.running_since))*1000);
  t.segments:=t.segments||jsonb_build_array(jsonb_build_object('start',t.running_since,'end',stamp));t.running_since:=null;
 elsif p_action='resume' and t.running_since is null then t.running_since:=stamp;
 else raise exception 'Timer state changed. Refresh and try again.';end if;
 update active_timers set elapsed_ms=t.elapsed_ms,segments=t.segments,running_since=t.running_since,revision=revision+1 where user_id=auth.uid() returning * into t;return t;
end $$;
-- A retry with the same session UUID returns the saved session. Session insertion
-- and timer removal commit together, so no time is lost between the two writes.
create function public.finish_timer(p_timer uuid,p_revision integer,p_session uuid,p_duration numeric,p_topic text,p_notes text,p_rating integer) returns public.study_sessions
language plpgsql security invoker set search_path=public as $$
declare t public.active_timers; s public.study_sessions; begin
 select * into s from study_sessions where id=p_session and user_id=auth.uid(); if s.id is not null then return s; end if;
 select * into t from active_timers where id=p_timer and user_id=auth.uid() for update;
 if t.id is null or t.revision<>p_revision or t.running_since is not null then raise exception 'Timer changed. Refresh and finish again.';end if;
 insert into study_sessions(id,user_id,course_id,started_at,ended_at,duration_minutes,topic,notes,productivity_rating,segments)
 values(p_session,auth.uid(),t.course_id,t.started_at,greatest(t.started_at+interval '1 millisecond',(t.segments->-1->>'end')::timestamptz),p_duration,p_topic,p_notes,p_rating,t.segments) returning * into s;
 delete from active_timers where user_id=auth.uid();return s;
end $$;
revoke all on function public.timer_action(text,uuid,integer),public.finish_timer(uuid,integer,uuid,numeric,text,text,integer) from public;
grant execute on function public.timer_action(text,uuid,integer),public.finish_timer(uuid,integer,uuid,numeric,text,text,integer) to authenticated;
