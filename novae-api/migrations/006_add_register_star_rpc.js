export const up = (pgm) => {
  pgm.sql(`
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
  pgm.sql('DROP FUNCTION IF EXISTS register_novae_star_with_worlds(JSONB, JSONB)')
}