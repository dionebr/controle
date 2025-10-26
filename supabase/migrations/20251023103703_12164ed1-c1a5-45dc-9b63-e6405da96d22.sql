-- Criar bucket para notas fiscais
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notas-fiscais',
  'notas-fiscais',
  true,
  5242880,
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Adicionar coluna para armazenar URL do arquivo
ALTER TABLE public.notas_fiscais
ADD COLUMN arquivo_url TEXT;

-- Políticas de storage para notas fiscais
CREATE POLICY "Permitir upload de notas fiscais"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'notas-fiscais');

CREATE POLICY "Permitir visualização de notas fiscais"
ON storage.objects
FOR SELECT
USING (bucket_id = 'notas-fiscais');

CREATE POLICY "Permitir exclusão de notas fiscais"
ON storage.objects
FOR DELETE
USING (bucket_id = 'notas-fiscais');