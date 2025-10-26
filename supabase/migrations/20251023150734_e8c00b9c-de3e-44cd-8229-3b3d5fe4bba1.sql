-- Atualizar políticas RLS para permitir visualização pública (sem autenticação)

-- Pedidos: permitir SELECT sem autenticação
DROP POLICY IF EXISTS "Todos podem visualizar pedidos" ON public.pedidos;
CREATE POLICY "Qualquer pessoa pode visualizar pedidos"
ON public.pedidos
FOR SELECT
USING (true);

-- Notas Fiscais: permitir SELECT sem autenticação
DROP POLICY IF EXISTS "Todos podem visualizar notas" ON public.notas_fiscais;
CREATE POLICY "Qualquer pessoa pode visualizar notas"
ON public.notas_fiscais
FOR SELECT
USING (true);

-- User Roles: permitir SELECT sem autenticação (para verificar se é admin)
DROP POLICY IF EXISTS "Usuários podem ver roles" ON public.user_roles;
CREATE POLICY "Qualquer pessoa pode visualizar roles"
ON public.user_roles
FOR SELECT
USING (true);