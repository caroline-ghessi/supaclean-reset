-- Criar função para configurar perfil de usuário convidado
CREATE OR REPLACE FUNCTION public.handle_invited_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Só executar se o usuário foi confirmado (email_confirmed_at não é nulo)
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    -- Criar perfil se não existir
    INSERT INTO public.profiles (user_id, display_name, email, department)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'department', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Atribuir role se especificado nos metadados
    IF NEW.raw_user_meta_data->>'invited_role' IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role, assigned_by)
      VALUES (
        NEW.id, 
        (NEW.raw_user_meta_data->>'invited_role')::app_role,
        NEW.id
      )
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para usuários convidados que confirmam email
CREATE OR REPLACE TRIGGER on_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL)
  EXECUTE FUNCTION public.handle_invited_user();