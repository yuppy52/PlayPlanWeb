export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
}

export interface Activity {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  datetime: string;
  location: string;
  cost?: number;
  created_by: string;
  created_at: string;
}

export interface ActivityParticipant {
  activity_id: string;
  user_id: string;
  status: 'attending' | 'not_attending' | 'undecided';
  profile?: Profile;
}

export interface Item {
  id: string;
  activity_id: string;
  name: string;
  assignee_id?: string;
  assignee?: Profile;
}

export interface MemberTemplate {
  id: string;
  group_id: string;
  name: string;
  created_by: string;
}

export interface TemplateMember {
  template_id: string;
  user_id: string;
  profile?: Profile;
}

export interface Message {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}
