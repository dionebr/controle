import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Edit, Trash2, FileText, Download, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

interface Pedido {
  id: string;
  obra: string;
  numero_pedido: string;
  numero_nfe?: string | null;
  arquivo_nfe_url?: string | null;
  canhoto_url?: string | null;
  data: string;
  materiais: string[];
  valor: number;
  tipo_operacao?: 'retirada' | 'entrega' | null;
  data_operacao?: string | null;
}

interface PedidosTableProps {
  obraNome: string;
  pedidos: Pedido[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  total: number;
}

export const PedidosTable = ({ obraNome, pedidos, onEdit, onDelete, total }: PedidosTableProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (url: string) => {
    setPreviewUrl(url);
    setIsPreviewOpen(true);
  };

  const handleDownload = (url: string, nfe: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `nfe_${nfe}`;
    link.click();
  };

  return (
    <>
      <Card className="shadow-card">
        <CardHeader className="bg-secondary">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Obra: {obraNome}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Pedido</th>
                  <th className="text-left p-3 font-semibold">NF-e</th>
                  <th className="text-left p-3 font-semibold">Data</th>
                  <th className="text-left p-3 font-semibold">Materiais</th>
                  <th className="text-right p-3 font-semibold">Valor (R$)</th>
                  <th className="text-center p-3 font-semibold">Anexo</th>
                  {(onEdit || onDelete) && (
                    <th className="text-center p-3 font-semibold">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-3 font-medium">{p.numero_pedido}</td>
                    <td className="p-3">{p.numero_nfe || "-"}</td>
                    <td className="p-3">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 max-w-md">
                        {p.materiais.map((m, i) => (
                          <Badge key={i} variant="secondary" className="text-xs whitespace-nowrap">
                            {m}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-right font-semibold">{p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="p-3">
                      {p.arquivo_nfe_url ? (
                        <div className="flex justify-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handlePreview(p.arquivo_nfe_url!)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDownload(p.arquivo_nfe_url!, p.numero_nfe || p.numero_pedido)}>
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">-</div>
                      )}
                    </td>
                    {(onEdit || onDelete) && (
                      <td className="p-3">
                        <div className="flex justify-center gap-2">
                          {onEdit && (
                            <Button size="sm" variant="outline" onClick={() => onEdit(p.id)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Editar
                            </Button>
                          )}
                          {onDelete && (
                            <Button size="sm" variant="destructive" onClick={() => onDelete(p.id)}>
                              <Trash2 className="h-3 w-3 mr-1" />
                              Excluir
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-end">
            <div className="text-lg font-bold">
              Total: <span className="text-primary">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Preview NF-e</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(90vh-100px)]">
            {previewUrl && (
              previewUrl.endsWith('.pdf') ? (
                <iframe src={previewUrl} className="w-full h-[600px]" title="Preview PDF" />
              ) : (
                <img src={previewUrl} alt="Preview" className="w-full h-auto" />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
