import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Paperclip, Upload } from "lucide-react";
import { useRef } from "react";

interface PedidoFormProps {
  obra: string;
  pedido: string;
  data: string;
  material: string;
  valor: string;
  nfe: string;
  arquivoNfe: File | null;
  canhoto: File | null;
  tipoOperacao: string;
  dataOperacao: string;
  setObra: (value: string) => void;
  setPedido: (value: string) => void;
  setData: (value: string) => void;
  setMaterial: (value: string) => void;
  setValor: (value: string) => void;
  setNfe: (value: string) => void;
  setArquivoNfe: (file: File | null) => void;
  setCanhoto: (file: File | null) => void;
  setTipoOperacao: (value: string) => void;
  setDataOperacao: (value: string) => void;
  onSubmit: () => void;
}

export const PedidoForm = ({
  obra,
  pedido,
  data,
  material,
  valor,
  nfe,
  arquivoNfe,
  canhoto,
  tipoOperacao,
  dataOperacao,
  setObra,
  setPedido,
  setData,
  setMaterial,
  setValor,
  setNfe,
  setArquivoNfe,
  setCanhoto,
  setTipoOperacao,
  setDataOperacao,
  onSubmit,
}: PedidoFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canhotInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setArquivoNfe(file);
  };

  const handleCanhotChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setCanhoto(file);
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-[calc(var(--radius)-4px)]">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Adicionar Pedido
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select onValueChange={setObra} value={obra}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a Obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Santo Amaro">Santo Amaro</SelectItem>
              <SelectItem value="Pacaembu">Pacaembu</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Nº Pedido" value={pedido} onChange={(e) => setPedido(e.target.value)} />
          <Input placeholder="Valor (R$)" type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input type="date" placeholder="Data do Pedido" value={data} onChange={(e) => setData(e.target.value)} />
          <Select onValueChange={setTipoOperacao} value={tipoOperacao}>
            <SelectTrigger>
              <SelectValue placeholder="Retirada/Entrega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="retirada">📦 Retirada</SelectItem>
              <SelectItem value="entrega">🚚 Entrega</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" placeholder="Data da Operação" value={dataOperacao} onChange={(e) => setDataOperacao(e.target.value)} />
          <Input placeholder="Nº NF-e" value={nfe} onChange={(e) => setNfe(e.target.value)} />
        </div>
        <div className="space-y-2 mt-4">
          <Input placeholder="Materiais (separe por vírgula)" value={material} onChange={(e) => setMaterial(e.target.value)} />
          {material && (
            <div className="grid grid-cols-5 gap-2">
              {material.split(",").map((m, i) => (
                m.trim() && (
                  <Badge key={i} variant="secondary" className="text-xs justify-center">
                    {m.trim()}
                  </Badge>
                )
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/pdf,image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4 mr-2" />
              Anexar NF-e
            </Button>
            {arquivoNfe && (
              <span className="text-sm text-muted-foreground">
                {arquivoNfe.name} ({(arquivoNfe.size / 1024).toFixed(2)} KB)
              </span>
            )}
            
            <input
              type="file"
              ref={canhotInputRef}
              onChange={handleCanhotChange}
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
            />
            <Button type="button" variant="outline" onClick={() => canhotInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Anexar Canhoto
            </Button>
            {canhoto && (
              <span className="text-sm text-muted-foreground">
                {canhoto.name} ({(canhoto.size / 1024).toFixed(2)} KB)
              </span>
            )}
          </div>
          <Button onClick={onSubmit} className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pedido
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
