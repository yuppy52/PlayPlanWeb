-- プロフィールテーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- グループテーブル
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- グループメンバーテーブル
CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- 遊びテーブル
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  datetime TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  cost NUMERIC,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 遊びの参加者テーブル
CREATE TABLE activity_participants (
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('attending', 'not_attending', 'undecided')) DEFAULT 'undecided',
  PRIMARY KEY (activity_id, user_id)
);

-- 持ち物テーブル
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- いつめんテンプレートテーブル
CREATE TABLE member_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- いつめんメンバーテーブル
CREATE TABLE template_members (
  template_id UUID NOT NULL REFERENCES member_templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, user_id)
);

-- チャットメッセージテーブル
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_activities_group ON activities(group_id);
CREATE INDEX idx_messages_activity ON messages(activity_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- プロフィール用のRLSポリシー
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- グループ用のRLSポリシー
CREATE POLICY "Groups are viewable by members"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups"
  ON groups FOR DELETE
  USING (auth.uid() = created_by);

-- グループメンバー用のRLSポリシー
CREATE POLICY "Group members are viewable by group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- 遊び用のRLSポリシー
CREATE POLICY "Activities are viewable by group members"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = activities.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create activities"
  ON activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = activities.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Activity creators can update activities"
  ON activities FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Activity creators can delete activities"
  ON activities FOR DELETE
  USING (auth.uid() = created_by);

-- 遊びの参加者用のRLSポリシー
CREATE POLICY "Activity participants are viewable by group members"
  ON activity_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN group_members gm ON gm.group_id = a.group_id
      WHERE a.id = activity_participants.activity_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can manage their participation"
  ON activity_participants FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 持ち物用のRLSポリシー
CREATE POLICY "Items are viewable by group members"
  ON items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN group_members gm ON gm.group_id = a.group_id
      WHERE a.id = items.activity_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can manage items"
  ON items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN group_members gm ON gm.group_id = a.group_id
      WHERE a.id = items.activity_id AND gm.user_id = auth.uid()
    )
  );

-- いつめんテンプレート用のRLSポリシー
CREATE POLICY "Templates are viewable by group members"
  ON member_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = member_templates.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create templates"
  ON member_templates FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = member_templates.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Template creators can update templates"
  ON member_templates FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Template creators can delete templates"
  ON member_templates FOR DELETE
  USING (auth.uid() = created_by);

-- いつめんメンバー用のRLSポリシー
CREATE POLICY "Template members are viewable by group members"
  ON template_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM member_templates mt
      JOIN group_members gm ON gm.group_id = mt.group_id
      WHERE mt.id = template_members.template_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Template creators can manage template members"
  ON template_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM member_templates mt
      WHERE mt.id = template_members.template_id AND mt.created_by = auth.uid()
    )
  );

-- メッセージ用のRLSポリシー
CREATE POLICY "Messages are viewable by group members"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities a
      JOIN group_members gm ON gm.group_id = a.group_id
      WHERE a.id = messages.activity_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM activities a
      JOIN group_members gm ON gm.group_id = a.group_id
      WHERE a.id = messages.activity_id AND gm.user_id = auth.uid()
    )
  );

-- メッセージのリアルタイム更新を有効化
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
