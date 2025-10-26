-- Criar tabela pedidos se não existir
CREATE TABLE IF NOT EXISTS public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra TEXT NOT NULL,
  numero_pedido TEXT NOT NULL,
  numero_nfe TEXT,
  arquivo_nfe_url TEXT,
  data DATE NOT NULL,
  materiais TEXT[] NOT NULL,
  valor NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela notas_fiscais se não existir
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_nfe TEXT NOT NULL,
  obra TEXT NOT NULL DEFAULT 'Santo Amaro'::text,
  data DATE NOT NULL,
  valor NUMERIC NOT NULL,
  arquivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem e criar novas
DROP POLICY IF EXISTS "Permitir leitura de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir inserção de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir atualização de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir exclusão de pedidos" ON public.pedidos;

DROP POLICY IF EXISTS "Permitir leitura de notas" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir inserção de notas" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir atualização de notas" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir exclusão de notas" ON public.notas_fiscais;

-- Políticas RLS para pedidos (acesso público)
CREATE POLICY "Permitir leitura de pedidos" ON public.pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de pedidos" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de pedidos" ON public.pedidos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de pedidos" ON public.pedidos FOR DELETE USING (true);

-- Políticas RLS para notas_fiscais (acesso público)
CREATE POLICY "Permitir leitura de notas" ON public.notas_fiscais FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de notas" ON public.notas_fiscais FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de notas" ON public.notas_fiscais FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de notas" ON public.notas_fiscais FOR DELETE USING (true);

-- Criar trigger para atualizar updated_at automaticamente em pedidos
DROP TRIGGER IF EXISTS update_pedidos_updated_at ON public.pedidos;
CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar trigger para atualizar updated_at automaticamente em notas_fiscais
DROP TRIGGER IF EXISTS update_notas_fiscais_updated_at ON public.notas_fiscais;
CREATE TRIGGER update_notas_fiscais_updated_at
  BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();