-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
-- Moepictures - A cute and moe anime image board ❤          -
-- Copyright © 2026 Moebytes <moebytes.com>                  - 
-- Licensed under CC BY-NC 4.0. See license.txt for details. - 
-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 

CREATE TABLE IF NOT EXISTS "server cache" (
    "resource" text PRIMARY KEY,
    "revision" text NOT NULL
);

INSERT INTO "server cache" ("resource", "revision")
VALUES ('*', gen_random_uuid()::text) ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION invalidate_server_cache() RETURNS trigger AS $$
BEGIN
    INSERT INTO public."server cache" ("resource", "revision")
    VALUES (TG_TABLE_NAME, gen_random_uuid()::text)
    ON CONFLICT ("resource") DO UPDATE SET "revision" = EXCLUDED."revision";
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE resource record;
BEGIN
    FOR resource IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
        AND tablename NOT IN ('server cache', 'sessions')
    LOOP
        INSERT INTO "server cache" ("resource", "revision")
        VALUES (resource.tablename, gen_random_uuid()::text) ON CONFLICT DO NOTHING;
        EXECUTE format('CREATE OR REPLACE TRIGGER server_cache_invalidation
            AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.%I
            FOR EACH STATEMENT EXECUTE FUNCTION invalidate_server_cache()', resource.tablename);
    END LOOP;
END;
$$;