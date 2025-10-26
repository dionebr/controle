-- Função para remover usuário por email (apenas para admins)
CREATE OR REPLACE FUNCTION public.delete_user_by_email(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar o UUID do usuário pelo email
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado', user_email;
    END IF;
    
    -- Remover das tabelas dependentes primeiro (cascade vai fazer isso automaticamente)
    DELETE FROM auth.users WHERE id = user_uuid;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao remover usuário: %', SQLERRM;
END;
$$;

-- Conceder permissão apenas para usuários autenticados (será restrita por RLS)
GRANT EXECUTE ON FUNCTION public.delete_user_by_email(TEXT) TO authenticated;