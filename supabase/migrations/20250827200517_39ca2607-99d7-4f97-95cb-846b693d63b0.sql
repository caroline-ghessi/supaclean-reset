-- First, check what tables exist in public schema
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all views in public schema
    FOR r IN (SELECT viewname FROM pg_views WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.viewname) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions in public schema
    FOR r IN (SELECT routine_name, specific_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all procedures in public schema
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'PROCEDURE') LOOP
        EXECUTE 'DROP PROCEDURE IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all custom types in public schema
    FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') AND typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
    
    -- Drop all sequences in public schema
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(r.sequence_name) || ' CASCADE';
    END LOOP;
    
    -- Drop all triggers (they should be dropped with tables, but just in case)
    FOR r IN (SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.' || quote_ident(r.event_object_table) || ' CASCADE';
    END LOOP;
END$$;

-- Clean all storage buckets content (keep buckets but remove all files)
DELETE FROM storage.objects;

-- Remove any RLS policies that might be lingering
-- (These should be dropped with tables, but just to be thorough)

-- Reset any schema permissions to default
-- No need to touch auth, storage, or other system schemas