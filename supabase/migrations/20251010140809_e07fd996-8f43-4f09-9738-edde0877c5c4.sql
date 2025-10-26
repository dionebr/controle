-- Criar tabela de pedidos
CREATE TABLE public.pedidos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  obra text NOT NULL,
  numero_pedido text NOT NULL,
  data date NOT NULL,
  materiais text[] NOT NULL,
  valor numeric(10, 2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Criar tabela de notas fiscais devolvidas
CREATE TABLE public.notas_fiscais (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_nfe text NOT NULL,
  data date NOT NULL,
  valor numeric(10, 2) NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acesso público (sem autenticação)
CREATE POLICY "Permitir leitura de pedidos" ON public.pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de pedidos" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de pedidos" ON public.pedidos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de pedidos" ON public.pedidos FOR DELETE USING (true);

CREATE POLICY "Permitir leitura de notas" ON public.notas_fiscais FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de notas" ON public.notas_fiscais FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de notas" ON public.notas_fiscais FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de notas" ON public.notas_fiscais FOR DELETE USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notas_fiscais_updated_at
BEFORE UPDATE ON public.notas_fiscais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();