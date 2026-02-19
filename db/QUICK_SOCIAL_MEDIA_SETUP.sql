-- ============================================
-- QUICK START: Social Media Links Setup
-- ============================================
-- 
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- Go to: Supabase Dashboard → Your Project → SQL Editor → New Query
-- Then paste everything below and click RUN
--

-- Create social_media_links table
CREATE TABLE IF NOT EXISTS social_media_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform TEXT NOT NULL UNIQUE,
  url TEXT,
  icon_emoji TEXT,
  active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_platform CHECK (platform IN ('Facebook', 'Instagram', 'TikTok', 'Telegram', 'WhatsApp'))
);

-- Insert default platforms
INSERT INTO social_media_links (platform, icon_emoji, active, display_order) VALUES
  ('Facebook', '👍', FALSE, 1),
  ('Instagram', '📸', FALSE, 2),
  ('TikTok', '🎵', FALSE, 3),
  ('Telegram', '✈️', FALSE, 4),
  ('WhatsApp', '💬', FALSE, 5)
ON CONFLICT (platform) DO NOTHING;

-- Create audit log table
CREATE TABLE IF NOT EXISTS social_media_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES social_media_links(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  action TEXT CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ACTIVATE', 'DEACTIVATE')),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_media_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active links
CREATE POLICY "Anyone can view active social media links"
  ON social_media_links FOR SELECT
  USING (active = TRUE);

-- Policy: Admins view all links
CREATE POLICY "Admins can view all social media links"
  ON social_media_links FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- Policy: Admins update links
CREATE POLICY "Admins can update social media links"
  ON social_media_links FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- Policy: Admins delete links
CREATE POLICY "Admins can delete social media links"
  ON social_media_links FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- Policy: Admins insert links
CREATE POLICY "Admins can insert social media links"
  ON social_media_links FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- Enable RLS on audit table
ALTER TABLE social_media_audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins view audit logs
CREATE POLICY "Admins can view social media audit logs"
  ON social_media_audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = TRUE)
  );

-- Create audit trigger function
CREATE OR REPLACE FUNCTION log_social_media_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO social_media_audit_log (link_id, admin_id, action, new_value, old_value)
  VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'CREATE'
      WHEN TG_OP = 'DELETE' THEN 'DELETE'
      WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
    END,
    to_jsonb(NEW),
    to_jsonb(OLD)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS social_media_audit_trigger ON social_media_links;
CREATE TRIGGER social_media_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON social_media_links
  FOR EACH ROW
  EXECUTE FUNCTION log_social_media_change();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_social_media_active ON social_media_links(active);
CREATE INDEX IF NOT EXISTS idx_social_media_display_order ON social_media_links(display_order);
CREATE INDEX IF NOT EXISTS idx_audit_log_link_id ON social_media_audit_log(link_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON social_media_audit_log(admin_id);

-- ============================================
-- DONE! 
-- Make sure your admin user has is_admin = TRUE
-- Then go to Admin Dashboard > Social Media Links
-- ============================================
