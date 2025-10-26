import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FileText, Plus, Upload } from "lucide-react";
import { useRef } from "react";

interface NotaFiscalFormProps {
  nfe: string;
  dataNfe: string;
  valorNfe: string;
  obra: string;
  arquivo: File | null;
  canhoto: File | null;
  setNfe: (value: string) => void;
  setDataNfe: (value: string) => void;
  setValorNfe: (value: string) => void;
  setObra: (value: string) => void;
  setArquivo: (file: File | null) => void;
  setCanhoto: (file: File | null) => void;
  onSubmit: () => void;
}

export const NotaFiscalForm = ({
  nfe,
  dataNfe,
  valorNfe,
  obra,
  arquivo,
  canhoto,
  setNfe,
  setDataNfe,
  setValorNfe,
  setObra,
  setArquivo,
  setCanhoto,
  onSubmit,
}: NotaFiscalFormProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canhotInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivo(file);
    }
  };

  const handleCanhotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCanhoto(file);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="bg-gradient-success text-success-foreground rounded-t-[calc(var(--radius)-4px)]">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Notas Fiscais Devolvidas (Crédito)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Select onValueChange={setObra} value={obra}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a Obra" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Santo Amaro">Santo Amaro</SelectItem>
              <SelectItem value="Pacaembu">Pacaembu</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Nº NF-e" value={nfe} onChange={(e) => setNfe(e.target.value)} />
          <Input type="date" value={dataNfe} onChange={(e) => setDataNfe(e.target.value)} />
          <Input placeholder="Valor (R$)" type="number" step="0.01" value={valorNfe} onChange={(e) => setValorNfe(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Upload Nota Fiscal */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              {arquivo ? arquivo.name : "📄 Anexar Nota Fiscal"}
            </Button>
            {arquivo && (
              <span className="text-xs text-muted-foreground block mt-1">
                {(arquivo.size / 1024).toFixed(0)} KB
              </span>
            )}
          </div>

          {/* Upload Canhoto */}
          <div>
            <input
              ref={canhotInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleCanhotChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => canhotInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {canhoto ? canhoto.name : "📸 Anexar Canhoto"}
            </Button>
            {canhoto && (
              <span className="text-xs text-muted-foreground block mt-1">
                {(canhoto.size / 1024).toFixed(0)} KB
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onSubmit} className="bg-gradient-success">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Nota
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
