-- Grant base privileges to authenticated role.
-- RLS policies (migration 006) control which rows are actually accessible.
-- These grants just allow operations to be attempted at all.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant read to anon role.
-- Only entries with is_public_showcase=TRUE are visible via RLS policy.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;