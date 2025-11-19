-- ステップ1: テーブル作成（外部キーなし）
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  datetime TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  cost NUMERIC,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_participants (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending', 'undecided')) DEFAULT 'undecided',
  PRIMARY KEY (activity_id, user_id)
);

CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  assignee_id UUID
);

CREATE TABLE member_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL
);

CREATE TABLE template_members (
  template_id UUID NOT NULL REFERENCES member_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  PRIMARY KEY (template_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ステップ2: インデックス
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_activities_group ON activities(group_id);
CREATE INDEX idx_messages_activity ON messages(activity_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- ステップ3: RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ステップ4: プロフィール用ポリシー（最も緩い設定）
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);

-- ステップ5: グループ用ポリシー（最も緩い設定でテスト）
CREATE POLICY "groups_select" ON groups FOR SELECT USING (true);
CREATE POLICY "groups_insert" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "groups_update" ON groups FOR UPDATE USING (true);
CREATE POLICY "groups_delete" ON groups FOR DELETE USING (true);

-- ステップ6: グループメンバー用ポリシー
CREATE POLICY "group_members_select" ON group_members FOR SELECT USING (true);
CREATE POLICY "group_members_insert" ON group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "group_members_delete" ON group_members FOR DELETE USING (true);

-- ステップ7: 遊び用ポリシー
CREATE POLICY "activities_select" ON activities FOR SELECT USING (true);
CREATE POLICY "activities_insert" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "activities_update" ON activities FOR UPDATE USING (true);
CREATE POLICY "activities_delete" ON activities FOR DELETE USING (true);

-- ステップ8: 遊びの参加者用ポリシー
CREATE POLICY "activity_participants_select" ON activity_participants FOR SELECT USING (true);
CREATE POLICY "activity_participants_all" ON activity_participants FOR ALL USING (true) WITH CHECK (true);

-- ステップ9: 持ち物用ポリシー
CREATE POLICY "items_select" ON items FOR SELECT USING (true);
CREATE POLICY "items_all" ON items FOR ALL USING (true) WITH CHECK (true);

-- ステップ10: テンプレート用ポリシー
CREATE POLICY "member_templates_select" ON member_templates FOR SELECT USING (true);
CREATE POLICY "member_templates_insert" ON member_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "member_templates_update" ON member_templates FOR UPDATE USING (true);
CREATE POLICY "member_templates_delete" ON member_templates FOR DELETE USING (true);

CREATE POLICY "template_members_select" ON template_members FOR SELECT USING (true);
CREATE POLICY "template_members_all" ON template_members FOR ALL USING (true) WITH CHECK (true);

-- ステップ11: メッセージ用ポリシー
CREATE POLICY "messages_select" ON messages FOR SELECT USING (true);
CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (true);
