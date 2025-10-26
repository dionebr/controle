-- MIGRAÇÃO: Adicionar novos campos para sistema de pedidos
-- Data: 24/10/2025
-- Autor: Sistema

-- 1. Adicionar campos na tabela de pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS tipo_operacao text CHECK (tipo_operacao IN ('retirada', 'entrega')),
ADD COLUMN IF NOT EXISTS data_operacao date;

-- 2. Adicionar campo de canhoto na tabela de notas fiscais  
ALTER TABLE public.notas_fiscais 
ADD COLUMN IF NOT EXISTS canhoto_url text;

-- 3. Adicionar comentários para documentação
COMMENT ON COLUMN public.pedidos.tipo_operacao IS 'Tipo da operação: retirada ou entrega';
COMMENT ON COLUMN public.pedidos.data_operacao IS 'Data da operação (retirada ou entrega)';
COMMENT ON COLUMN public.notas_fiscais.canhoto_url IS 'URL do arquivo do canhoto da nota fiscal';

-- 4. Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pedidos' 
AND column_name IN ('tipo_operacao', 'data_operacao');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notas_fiscais' 
AND column_name = 'canhoto_url';