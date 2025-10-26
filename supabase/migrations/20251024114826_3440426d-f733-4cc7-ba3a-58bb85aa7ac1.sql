-- Atualizar usuário dsouzalima438@gmail.com para admin
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Buscar o UUID do usuário pelo email no profiles
    SELECT id INTO user_uuid 
    FROM public.profiles 
    WHERE email = 'dsouzalima438@gmail.com';
    
    IF user_uuid IS NOT NULL THEN
        -- Atualizar role para admin
        UPDATE public.user_roles 
        SET role = 'admin' 
        WHERE user_id = user_uuid;
        
        RAISE NOTICE 'Usuário dsouzalima438@gmail.com atualizado para admin!';
    ELSE
        RAISE NOTICE 'Usuário dsouzalima438@gmail.com não encontrado.';
    END IF;
END $$;