export const up = (pgm) => {
  pgm.sql(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;

    CREATE TABLE IF NOT EXISTS novae_stars (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      github_username text NOT NULL UNIQUE,
      display_name text,
      avatar_url text,
      bio text,
      position_x float NOT NULL,
      position_z float NOT NULL,
      star_color text DEFAULT '#ffdd44',
      star_size float DEFAULT 1.0,
      star_type text DEFAULT 'main_sequence' CHECK (star_type IN ('dwarf', 'main_sequence', 'giant', 'supergiant', 'nebula')),
      total_repos integer DEFAULT 0,
      total_commits integer DEFAULT 0,
      followers integer DEFAULT 0,
      primary_language text,
      account_age_days integer DEFAULT 0,
      status text NOT NULL DEFAULT 'main_sequence' CHECK (status IN ('main_sequence', 'supernova', 'nebula')),
      supernova_at timestamptz,
      supernova_scheduled_delete timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_seen timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS novae_worlds (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      novae_star_id uuid NOT NULL REFERENCES novae_stars(id) ON DELETE CASCADE,
      github_username text NOT NULL,
      repo_name text NOT NULL,
      repo_full_name text NOT NULL,
      description text,
      language text,
      html_url text NOT NULL,
      commit_count integer DEFAULT 0,
      stars_count integer DEFAULT 0,
      forks_count integer DEFAULT 0,
      contributor_count integer DEFAULT 0,
      world_type text DEFAULT 'planet',
      orbit_radius float NOT NULL,
      orbit_speed float NOT NULL,
      orbit_offset float NOT NULL,
      is_collab boolean DEFAULT false,
      collab_username text,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS novae_binaries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      novae_star_a_id uuid NOT NULL REFERENCES novae_stars(id) ON DELETE CASCADE,
      novae_star_b_id uuid NOT NULL REFERENCES novae_stars(id) ON DELETE CASCADE,
      shared_repo_full_name text NOT NULL,
      novae_world_id uuid NOT NULL REFERENCES novae_worlds(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_novae_binaries_pair
      ON novae_binaries (novae_star_a_id, novae_star_b_id);
    CREATE INDEX IF NOT EXISTS idx_novae_stars_position
      ON novae_stars (position_x, position_z);
    CREATE INDEX IF NOT EXISTS idx_novae_worlds_orbit
      ON novae_worlds (novae_star_id, orbit_radius);
    CREATE INDEX IF NOT EXISTS idx_novae_stars_status
      ON novae_stars (status);

    ALTER TABLE novae_stars ENABLE ROW LEVEL SECURITY;
    ALTER TABLE novae_worlds ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE novae_stars, novae_worlds FROM anon, authenticated;

    CREATE OR REPLACE FUNCTION register_novae_star_with_worlds(
      novae_star_payload JSONB,
      worlds_payload JSONB
    )
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      persisted_novae_star novae_stars;
      persisted_novae_worlds JSONB;
    BEGIN
      INSERT INTO novae_stars (
        github_username, display_name, avatar_url, bio, position_x, position_z,
        star_color, star_size, star_type, total_repos, total_commits, followers,
        primary_language, account_age_days, last_seen
      )
      VALUES (
        novae_star_payload->>'github_username',
        novae_star_payload->>'display_name',
        novae_star_payload->>'avatar_url',
        novae_star_payload->>'bio',
        (novae_star_payload->>'position_x')::FLOAT,
        (novae_star_payload->>'position_z')::FLOAT,
        novae_star_payload->>'star_color',
        (novae_star_payload->>'star_size')::FLOAT,
        novae_star_payload->>'star_type',
        (novae_star_payload->>'total_repos')::INT,
        (novae_star_payload->>'total_commits')::INT,
        (novae_star_payload->>'followers')::INT,
        novae_star_payload->>'primary_language',
        (novae_star_payload->>'account_age_days')::INT,
        (novae_star_payload->>'last_seen')::TIMESTAMPTZ
      )
      ON CONFLICT (github_username) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url,
        bio = EXCLUDED.bio,
        star_color = EXCLUDED.star_color,
        star_size = EXCLUDED.star_size,
        star_type = EXCLUDED.star_type,
        total_repos = EXCLUDED.total_repos,
        total_commits = EXCLUDED.total_commits,
        followers = EXCLUDED.followers,
        primary_language = EXCLUDED.primary_language,
        account_age_days = EXCLUDED.account_age_days,
        last_seen = EXCLUDED.last_seen
      RETURNING * INTO persisted_novae_star;

      DELETE FROM novae_worlds WHERE novae_star_id = persisted_novae_star.id;

      INSERT INTO novae_worlds (
        novae_star_id, github_username, repo_name, repo_full_name, description,
        language, html_url, commit_count, stars_count, forks_count,
        contributor_count, world_type, orbit_radius, orbit_speed, orbit_offset,
        is_collab, collab_username
      )
      SELECT
        persisted_novae_star.id, world_data.github_username, world_data.repo_name,
        world_data.repo_full_name, world_data.description,
        world_data.language, world_data.html_url, world_data.commit_count,
        world_data.stars_count, world_data.forks_count,
        world_data.contributor_count, world_data.world_type,
        world_data.orbit_radius, world_data.orbit_speed,
        world_data.orbit_offset, world_data.is_collab,
        world_data.collab_username
      FROM jsonb_to_recordset(worlds_payload) AS world_data(
        github_username TEXT,
        repo_name TEXT,
        repo_full_name TEXT,
        description TEXT,
        language TEXT,
        html_url TEXT,
        commit_count INT,
        stars_count INT,
        forks_count INT,
        contributor_count INT,
        world_type TEXT,
        orbit_radius FLOAT,
        orbit_speed FLOAT,
        orbit_offset FLOAT,
        is_collab BOOLEAN,
        collab_username TEXT
      );

      SELECT COALESCE(
        jsonb_agg(to_jsonb(world) ORDER BY world.orbit_radius),
        '[]'::JSONB
      )
      INTO persisted_novae_worlds
      FROM novae_worlds AS world
      WHERE world.novae_star_id = persisted_novae_star.id;

      RETURN jsonb_build_object(
        'novae_star', to_jsonb(persisted_novae_star),
        'novae_worlds', persisted_novae_worlds
      );
    END;
    $$;

    REVOKE ALL ON FUNCTION register_novae_star_with_worlds(JSONB, JSONB) FROM PUBLIC;
    GRANT EXECUTE ON FUNCTION register_novae_star_with_worlds(JSONB, JSONB)
      TO service_role;
  `)
}

export const down = (pgm) => {
  pgm.sql(`
    DROP FUNCTION IF EXISTS register_novae_star_with_worlds(JSONB, JSONB);
    DROP TABLE IF EXISTS novae_binaries CASCADE;
    DROP TABLE IF EXISTS novae_worlds CASCADE;
    DROP TABLE IF EXISTS novae_stars CASCADE;
  `)
}