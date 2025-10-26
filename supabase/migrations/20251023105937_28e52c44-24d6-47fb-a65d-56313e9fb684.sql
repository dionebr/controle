-- Adicionar colunas para NF-e na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN numero_nfe TEXT,
ADD COLUMN arquivo_nfe_url TEXT;

-- Adicionar coluna obra na tabela notas_fiscais
ALTER TABLE public.notas_fiscais 
ADD COLUMN obra TEXT NOT NULL DEFAULT 'Santo Amaro';