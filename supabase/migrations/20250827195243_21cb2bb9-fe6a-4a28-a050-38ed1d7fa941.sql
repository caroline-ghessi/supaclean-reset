-- Drop all views first (they depend on tables)
DROP VIEW IF EXISTS public.seller_dashboard CASCADE;
DROP VIEW IF EXISTS public.sellers_basic_info CASCADE;
DROP VIEW IF EXISTS public.conversations_with_last_message CASCADE;

-- Drop all tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS public.user_registrations CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.quality_analyses CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;
DROP TABLE IF EXISTS public.sellers CASCADE;
DROP TABLE IF EXISTS public.seller_performance_metrics CASCADE;
DROP TABLE IF EXISTS public.whapi_logs CASCADE;
DROP TABLE IF EXISTS public.message_queue CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.seller_specialties CASCADE;
DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.integrations CASCADE;
DROP TABLE IF EXISTS public.system_logs CASCADE;
DROP TABLE IF EXISTS public.data_access_logs CASCADE;
DROP TABLE IF EXISTS public.client_types CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.security_rate_limits CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.whapi_configurations CASCADE;
DROP TABLE IF EXISTS public.seller_skills CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS public.remove_message_queue_crons() CASCADE;
DROP FUNCTION IF EXISTS public.get_whapi_token_secret_name(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_integration_config_secure(text) CASCADE;
DROP FUNCTION IF EXISTS public.mask_phone_number(text, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role_safe(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.set_message_direction() CASCADE;
DROP FUNCTION IF EXISTS public.audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS public.reset_conversations_batch(integer) CASCADE;
DROP FUNCTION IF EXISTS public.approve_user_access(uuid, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_old_data() CASCADE;
DROP FUNCTION IF EXISTS public.log_rls_access_failure(text, text, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.get_masked_customer_phone(text) CASCADE;
DROP FUNCTION IF EXISTS public.handle_audit_access_attempt() CASCADE;
DROP FUNCTION IF EXISTS public.create_message_queue_cron() CASCADE;
DROP FUNCTION IF EXISTS public.audit_security_event(text, text, uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.audit_access_attempt(uuid, text, boolean, text, text[], timestamp with time zone) CASCADE;
DROP FUNCTION IF EXISTS public.log_data_access(text, uuid, text[]) CASCADE;
DROP FUNCTION IF EXISTS public.get_conversation_with_logging(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.process_caroline_message() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_invalid_queue_messages() CASCADE;
DROP FUNCTION IF EXISTS public.log_admin_action() CASCADE;
DROP FUNCTION IF EXISTS public.request_user_access(text, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.check_rate_limit(uuid, text, integer, integer) CASCADE;
DROP FUNCTION IF EXISTS public.log_customer_data_access() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_customer_data(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_seller_data(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.mask_phone_for_role(text, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.audit_sensitive_data_access(text, uuid, text[]) CASCADE;
DROP FUNCTION IF EXISTS public.get_masked_phone(text) CASCADE;
DROP FUNCTION IF EXISTS public.can_access_unassigned_conversations(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_message_queue() CASCADE;
DROP FUNCTION IF EXISTS public.get_seller_dashboard_safe() CASCADE;
DROP FUNCTION IF EXISTS public.get_sellers_basic_info_safe() CASCADE;
DROP FUNCTION IF EXISTS public.log_sensitive_view_access() CASCADE;
DROP FUNCTION IF EXISTS public.get_dashboard_stats() CASCADE;
DROP FUNCTION IF EXISTS public.get_seller_conversations(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.process_message_queue() CASCADE;
DROP FUNCTION IF EXISTS public.update_whapi_configurations_updated_at() CASCADE;

-- Drop custom enum types
DROP TYPE IF EXISTS public.app_role CASCADE;

-- Clean storage bucket contents (keep the bucket but remove all files)
DELETE FROM storage.objects WHERE bucket_id = 'whatsapp-media';