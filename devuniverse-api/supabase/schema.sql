CREATE TABLE planets (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  github_username  TEXT    UNIQUE NOT NULL,
  display_name     TEXT,
  avatar_url       TEXT,
  position_x       FLOAT   NOT NULL,
  position_z       FLOAT   NOT NULL,
  primary_language TEXT,
  total_stars      INT     DEFAULT 0,
  repo_count       INT     DEFAULT 0,
  followers        INT     DEFAULT 0,
  account_age_days INT     DEFAULT 0,
  languages_json   JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  last_seen        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_position ON planets (position_x, position_z);

ALTER TABLE planets ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE planets FROM anon, authenticated;
GRANT SELECT ON TABLE planets TO anon, authenticated;

CREATE POLICY "Public planets are readable"
  ON planets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT, UPDATE, or DELETE policy is created. The service_role used only
-- by the backend bypasses RLS; anon and authenticated clients remain read-only.
