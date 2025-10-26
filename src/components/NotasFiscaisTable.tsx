import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface NotaFiscal {
  id: string;
  numero_nfe: string;
  obra: string;
  data: string;
  valor: number;
  arquivo_url?: string | null;
}

interface NotasFiscaisTableProps {
  notas: NotaFiscal[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const NotasFiscaisTable = ({ notas, onEdit, onDelete }: NotasFiscaisTableProps) => {
  return (
    <div className="overflow-x-auto mt-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-semibold">Nota Fiscal</th>
            <th className="text-left p-3 font-semibold">Obra</th>
            <th className="text-left p-3 font-semibold">Data</th>
            <th className="text-right p-3 font-semibold">Valor (R$)</th>
            <th className="text-center p-3 font-semibold">Anexo</th>
            {(onEdit || onDelete) && (
              <th className="text-center p-3 font-semibold">Ações</th>
            )}
          </tr>
        </thead>
        <tbody>
          {notas.map((n) => {
            const isPdf = n.arquivo_url?.endsWith(".pdf");
            const isImage = n.arquivo_url?.match(/\.(jpg|jpeg|png|webp)$/i);
            
            return (
              <tr key={n.id} className="border-b hover:bg-muted/50 transition-colors">
                <td className="p-3 font-medium">{n.numero_nfe}</td>
                <td className="p-3">
                  <Badge variant="outline">{n.obra}</Badge>
                </td>
                <td className="p-3">{new Date(n.data).toLocaleDateString('pt-BR')}</td>
                <td className="p-3 text-right font-semibold text-success">{n.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="p-3">
                  {n.arquivo_url ? (
                    <div className="flex gap-2 justify-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>Nota Fiscal - {n.numero_nfe}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            {isPdf && (
                              <iframe
                                src={n.arquivo_url}
                                className="w-full h-[600px] border rounded"
                                title="Preview da Nota Fiscal"
                              />
                            )}
                            {isImage && (
                              <img
                                src={n.arquivo_url}
                                alt="Nota Fiscal"
                                className="w-full h-auto rounded"
                              />
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                      >
                        <a href={n.arquivo_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3 mr-1" />
                          Baixar
                        </a>
                      </Button>
                    </div>
                  ) : (
                  <span className="text-muted-foreground text-sm">Sem anexo</span>
                )}
              </td>
              {(onEdit || onDelete) && (
                <td className="p-3">
                  <div className="flex justify-center gap-2">
                    {onEdit && (
                      <Button size="sm" variant="outline" onClick={() => onEdit(n.id)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    )}
                    {onDelete && (
                      <Button size="sm" variant="destructive" onClick={() => onDelete(n.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </td>
              )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
