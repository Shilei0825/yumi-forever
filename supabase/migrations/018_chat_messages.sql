-- Chat messages for customer support widget
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  profile_id UUID REFERENCES profiles(id),
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot', 'admin')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX idx_chat_messages_unread ON chat_messages(is_read) WHERE is_read = false AND sender = 'user';

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own messages
CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  USING (profile_id = auth.uid() OR sender = 'bot' OR sender = 'admin');

-- Users can insert messages
CREATE POLICY "Users can send chat messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);

-- Admin can read all messages
CREATE POLICY "Admin can read all chat messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admin can update messages (mark as read, reply)
CREATE POLICY "Admin can update chat messages"
  ON chat_messages FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
