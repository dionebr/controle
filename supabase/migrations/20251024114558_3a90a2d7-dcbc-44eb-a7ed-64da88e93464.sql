-- Remover usuário dsouzalima438@gmail.com
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar o UUID do usuário
    SELECT id INTO user_uuid 
    FROM auth.users 
    WHERE email = 'dsouzalima438@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Remover de user_roles primeiro
        DELETE FROM public.user_roles WHERE user_id = user_uuid;
        
        -- Remover de profiles
        DELETE FROM public.profiles WHERE id = user_uuid;
        
        -- Remover de auth.users
        DELETE FROM auth.users WHERE id = user_uuid;
        
        RAISE NOTICE 'Usuário dsouzalima438@gmail.com removido com sucesso!';
    ELSE
        RAISE NOTICE 'Usuário dsouzalima438@gmail.com não encontrado.';
    END IF;
END $$;