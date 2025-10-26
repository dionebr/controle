-- Adicionar as novas colunas na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS tipo_operacao TEXT CHECK (tipo_operacao IN ('retirada', 'entrega')),
ADD COLUMN IF NOT EXISTS data_operacao DATE,
ADD COLUMN IF NOT EXISTS canhoto_url TEXT;

-- Adicionar comentários para documentação
COMMENT ON COLUMN public.pedidos.tipo_operacao IS 'Tipo da operação: retirada ou entrega';
COMMENT ON COLUMN public.pedidos.data_operacao IS 'Data da operação (retirada ou entrega)';
COMMENT ON COLUMN public.pedidos.canhoto_url IS 'URL do arquivo do canhoto do pedido';