-- Reload the schema cache to ensure PostgREST sees the latest table columns
NOTIFY pgrst, 'reload config';
