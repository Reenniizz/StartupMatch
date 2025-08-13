-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  last_message text,
  last_message_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_user2_id_fkey FOREIGN KEY (user2_id) REFERENCES auth.users(id),
  CONSTRAINT conversations_user1_id_fkey FOREIGN KEY (user1_id) REFERENCES auth.users(id)
);
CREATE TABLE public.group_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying DEFAULT 'member'::character varying,
  joined_at timestamp without time zone DEFAULT now(),
  CONSTRAINT group_memberships_pkey PRIMARY KEY (id),
  CONSTRAINT group_memberships_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.group_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text NOT NULL,
  message_type character varying DEFAULT 'text'::character varying,
  file_url text,
  reply_to uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT group_messages_pkey PRIMARY KEY (id),
  CONSTRAINT group_messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.groups(id),
  CONSTRAINT group_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT group_messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.group_messages(id)
);
CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  description text,
  category character varying NOT NULL,
  avatar_url text,
  cover_url text,
  is_private boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  member_limit integer DEFAULT 100,
  tags ARRAY,
  created_by uuid NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.private_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  message_type character varying DEFAULT 'text'::character varying,
  file_url text,
  read_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT private_messages_pkey PRIMARY KEY (id),
  CONSTRAINT private_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id),
  CONSTRAINT private_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id)
);
CREATE TABLE public.user_experience (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name character varying NOT NULL,
  position character varying NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  is_current boolean DEFAULT false,
  location character varying,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_experience_pkey PRIMARY KEY (id),
  CONSTRAINT user_experience_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  objective_type character varying NOT NULL,
  priority integer DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_objectives_pkey PRIMARY KEY (id),
  CONSTRAINT user_objectives_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  username character varying NOT NULL,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  avatar_url text,
  role character varying NOT NULL,
  company character varying,
  industry character varying NOT NULL,
  location character varying NOT NULL,
  experience_years integer DEFAULT 0,
  availability_hours integer DEFAULT 40,
  bio text,
  headline character varying,
  linkedin_url text,
  github_url text,
  portfolio_url text,
  twitter_url text,
  profile_visibility character varying DEFAULT 'public'::character varying CHECK (profile_visibility::text = ANY (ARRAY['public'::character varying, 'private'::character varying, 'connections'::character varying]::text[])),
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  profile_completed_at timestamp without time zone,
  last_active_at timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_name character varying NOT NULL,
  project_description text,
  project_url text,
  project_status character varying DEFAULT 'active'::character varying CHECK (project_status::text = ANY (ARRAY['active'::character varying, 'completed'::character varying, 'paused'::character varying]::text[])),
  start_date date,
  end_date date,
  technologies ARRAY,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_projects_pkey PRIMARY KEY (id),
  CONSTRAINT user_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_skills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_name character varying NOT NULL,
  skill_level integer CHECK (skill_level >= 1 AND skill_level <= 10),
  skill_category character varying DEFAULT 'other'::character varying,
  is_primary boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT user_skills_pkey PRIMARY KEY (id),
  CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);