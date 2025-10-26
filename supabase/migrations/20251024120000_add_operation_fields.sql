-- Adicionar novos campos para melhorar o sistema
-- Executar no SQL Editor do Supabase

-- Adicionar campos para pedidos
ALTER TABLE public.pedidos 
ADD COLUMN tipo_operacao text CHECK (tipo_operacao IN ('retirada', 'entrega')),
ADD COLUMN data_operacao date;

-- Adicionar campo para anexo de canhoto nas notas fiscais
ALTER TABLE public.notas_fiscais 
ADD COLUMN canhoto_url text;

-- Comentários para documentação
COMMENT ON COLUMN public.pedidos.tipo_operacao IS 'Tipo da operação: retirada ou entrega';
COMMENT ON COLUMN public.pedidos.data_operacao IS 'Data da operação (retirada ou entrega)';
COMMENT ON COLUMN public.notas_fiscais.canhoto_url IS 'URL do arquivo do canhoto da nota fiscal';