-- ============================================
-- FIX: system_settings access
-- ============================================

DROP POLICY IF EXISTS "Everyone can read system settings" ON system_settings;
DROP POLICY IF EXISTS "Anyone can read system settings" ON system_settings;

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read system_settings"
  ON system_settings FOR SELECT
  USING (true);
