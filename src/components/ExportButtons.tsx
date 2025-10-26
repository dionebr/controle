import { Button } from "@/components/ui/button";
import { FileSpreadsheet, FileText } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useToast } from "@/hooks/use-toast";

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

interface NotaFiscal {
  id: string;
  numero_nfe: string;
  obra: string;
  data: string;
  valor: number;
  canhoto_url?: string | null;
}

interface ExportButtonsProps {
  pedidos: Pedido[];
  notas: NotaFiscal[];
  totalCredito: number;
  totalPedidos: number;
  saldo: number;
}

export const ExportButtons = ({ pedidos, notas, totalCredito, totalPedidos, saldo }: ExportButtonsProps) => {
  const { toast } = useToast();

  const exportarParaExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Aba de Resumo Financeiro
      const resumoData = [
        ["RESUMO FINANCEIRO"],
        [""],
        ["Item", "Valor (R$)"],
        ["Crédito Disponível", totalCredito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })],
        ["Total em Pedidos", totalPedidos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })],
        ["Saldo Final", saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })],
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      wsResumo["!cols"] = [{ width: 25 }, { width: 20 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      // Aba de Notas Fiscais
      const notasData = [
        ["NOTAS FISCAIS"],
        [""],
        ["Nota Fiscal", "Obra", "Data", "Valor (R$)"],
        ...notas.map((n) => [
          n.numero_nfe,
          n.obra,
          new Date(n.data).toLocaleDateString("pt-BR"),
          n.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
        ]),
        [""],
        ["TOTAL", "", "", notas.reduce((acc, n) => acc + n.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })],
      ];
      const wsNotas = XLSX.utils.aoa_to_sheet(notasData);
      wsNotas["!cols"] = [{ width: 20 }, { width: 20 }, { width: 15 }, { width: 18 }];
      XLSX.utils.book_append_sheet(wb, wsNotas, "Notas Fiscais");

      // Aba de Pedidos - Santo Amaro (formato da interface)
      const pedidosSA = pedidos.filter((p) => p.obra === "Santo Amaro");
      const pedidosSAData = [
        ["OBRA: SANTO AMARO"],
        [""],
        ["NF-e", "Data", "Materiais", "Valor (R$)", "Anexo", "Pedido", "Tipo Operação", "Data Operação"],
        ...pedidosSA.map((p) => [
          p.numero_nfe || "-",
          new Date(p.data).toLocaleDateString("pt-BR"),
          p.materiais.join("\n• ").replace(/^/, "• "), // Lista com bullets
          "R$ " + p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
          p.arquivo_nfe_url ? "📎 Sim" : "-",
          p.numero_pedido,
          p.tipo_operacao ? (p.tipo_operacao === 'retirada' ? '📦 Retirada' : '🚚 Entrega') : "-",
          p.data_operacao ? new Date(p.data_operacao).toLocaleDateString("pt-BR") : "-",
        ]),
        [""],
        ["TOTAL SANTO AMARO", "", "", "R$ " + pedidosSA.reduce((acc, p) => acc + p.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), "", "", "", ""],
      ];
      const wsSA = XLSX.utils.aoa_to_sheet(pedidosSAData);
      wsSA["!cols"] = [
        { width: 15 }, // NF-e
        { width: 12 }, // Data
        { width: 50 }, // Materiais
        { width: 15 }, // Valor
        { width: 10 }, // Anexo
        { width: 15 }, // Pedido
        { width: 15 }, // Tipo
        { width: 15 }  // Data Op
      ];
      XLSX.utils.book_append_sheet(wb, wsSA, "Santo Amaro");

      // Aba de Pedidos - Pacaembu (formato da interface)
      const pedidosPacaembu = pedidos.filter((p) => p.obra === "Pacaembu");
      const pedidosPacaembuData = [
        ["OBRA: PACAEMBU"],
        [""],
        ["Pedido", "NF-e", "Data", "Materiais", "Valor (R$)", "Anexo", "Tipo Operação", "Data Operação"],
        ...pedidosPacaembu.map((p) => [
          p.numero_pedido,
          p.numero_nfe || "-",
          new Date(p.data).toLocaleDateString("pt-BR"),
          p.materiais.join("\n• ").replace(/^/, "• "), // Lista com bullets
          "R$ " + p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
          p.arquivo_nfe_url ? "📎 Sim" : "-",
          p.tipo_operacao ? (p.tipo_operacao === 'retirada' ? '📦 Retirada' : '🚚 Entrega') : "-",
          p.data_operacao ? new Date(p.data_operacao).toLocaleDateString("pt-BR") : "-",
        ]),
        [""],
        ["TOTAL PACAEMBU", "", "", "", "R$ " + pedidosPacaembu.reduce((acc, p) => acc + p.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }), "", "", ""],
      ];
      const wsPacaembu = XLSX.utils.aoa_to_sheet(pedidosPacaembuData);
      wsPacaembu["!cols"] = [
        { width: 15 }, // Pedido
        { width: 15 }, // NF-e  
        { width: 12 }, // Data
        { width: 50 }, // Materiais
        { width: 15 }, // Valor
        { width: 10 }, // Anexo
        { width: 15 }, // Tipo
        { width: 15 }  // Data Op
      ];
      XLSX.utils.book_append_sheet(wb, wsPacaembu, "Pacaembu");

      const hoje = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
      XLSX.writeFile(wb, `Relatorio_Pedidos_${hoje}.xlsx`);

      toast({
        title: "Sucesso!",
        description: "Planilha Excel exportada com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível exportar para Excel.",
      });
    }
  };

  const exportarParaPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      // Título principal
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Controle de Pedidos", pageWidth / 2, yPos, { align: "center" });
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text("Sistema de Gestão Financeira de Obras", pageWidth / 2, yPos, { align: "center" });
      doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth / 2, yPos + 5, { align: "center" });

      // Resetar cor do texto
      doc.setTextColor(0);
      yPos += 15;

      // Resumo Financeiro
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Financeiro", 14, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [["Item", "Valor (R$)"]],
        body: [
          ["Crédito Disponível", `R$ ${totalCredito.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Total em Pedidos", `R$ ${totalPedidos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
          ["Saldo Final", `R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
        ],
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 80, halign: "right", fontStyle: "bold" },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Notas Fiscais
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Notas Fiscais", 14, yPos);
      yPos += 10;

      const notasBody = notas.map((n) => [
        n.numero_nfe,
        n.obra,
        new Date(n.data).toLocaleDateString("pt-BR"),
        `R$ ${n.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      ]);

      notasBody.push([
        { content: "TOTAL", colSpan: 3, styles: { fontStyle: "bold", halign: "right" } } as any,
        {
          content: `R$ ${notas.reduce((acc, n) => acc + n.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          styles: { fontStyle: "bold", fillColor: [220, 252, 231] },
        } as any,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Nota Fiscal", "Obra", "Data", "Valor (R$)"]],
        body: notasBody,
        theme: "grid",
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
          3: { halign: "right" },
        },
      });

      // Nova página para pedidos
      doc.addPage();
      yPos = 20;

      // Pedidos Santo Amaro (formato da interface)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🏗️ Obra: Santo Amaro", 14, yPos);
      yPos += 10;

      const pedidosSA = pedidos.filter((p) => p.obra === "Santo Amaro");
      const pedidosSABody = pedidosSA.map((p) => [
        p.numero_nfe || "-",
        new Date(p.data).toLocaleDateString("pt-BR"),
        p.materiais.map(m => `• ${m}`).join("\n"),
        `R$ ${p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        p.arquivo_nfe_url ? "📎" : "-",
        p.numero_pedido,
        p.tipo_operacao ? (p.tipo_operacao === 'retirada' ? '📦' : '🚚') : "-",
        p.data_operacao ? new Date(p.data_operacao).toLocaleDateString("pt-BR") : "-",
      ]);

      pedidosSABody.push([
        { content: "TOTAL SANTO AMARO", colSpan: 3, styles: { fontStyle: "bold", halign: "right" } } as any,
        {
          content: `R$ ${pedidosSA.reduce((acc, p) => acc + p.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          styles: { fontStyle: "bold", fillColor: [219, 234, 254] },
        } as any,
        { content: "", colSpan: 4 } as any,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["NF-e", "Data", "Materiais", "Valor (R$)", "Anexo", "Pedido", "Tipo", "Data Op."]],
        body: pedidosSABody,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },  // NF-e
          1: { cellWidth: 20 },  // Data
          2: { cellWidth: 60 },  // Materiais
          3: { cellWidth: 25, halign: "right" }, // Valor
          4: { cellWidth: 15, halign: "center" }, // Anexo
          5: { cellWidth: 20 },  // Pedido
          6: { cellWidth: 15, halign: "center" }, // Tipo
          7: { cellWidth: 20 },  // Data Op
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Pedidos Pacaembu (formato da interface)
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("🏗️ Obra: Pacaembu", 14, yPos);
      yPos += 10;

      const pedidosPacaembu = pedidos.filter((p) => p.obra === "Pacaembu");
      const pedidosPacaembuBody = pedidosPacaembu.map((p) => [
        p.numero_pedido,
        p.numero_nfe || "-",
        new Date(p.data).toLocaleDateString("pt-BR"),
        p.materiais.map(m => `• ${m}`).join("\n"),
        `R$ ${p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        p.arquivo_nfe_url ? "📎" : "-",
        p.tipo_operacao ? (p.tipo_operacao === 'retirada' ? '📦' : '🚚') : "-",
        p.data_operacao ? new Date(p.data_operacao).toLocaleDateString("pt-BR") : "-",
      ]);

      pedidosPacaembuBody.push([
        { content: "TOTAL PACAEMBU", colSpan: 4, styles: { fontStyle: "bold", halign: "right" } } as any,
        {
          content: `R$ ${pedidosPacaembu.reduce((acc, p) => acc + p.valor, 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          styles: { fontStyle: "bold", fillColor: [219, 234, 254] },
        } as any,
        { content: "", colSpan: 3 } as any,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Pedido", "NF-e", "Data", "Materiais", "Valor (R$)", "Anexo", "Tipo", "Data Op."]],
        body: pedidosPacaembuBody,
        theme: "grid",
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          0: { cellWidth: 20 },  // Pedido
          1: { cellWidth: 20 },  // NF-e
          2: { cellWidth: 20 },  // Data
          3: { cellWidth: 60 },  // Materiais
          4: { cellWidth: 25, halign: "right" }, // Valor
          5: { cellWidth: 15, halign: "center" }, // Anexo
          6: { cellWidth: 15, halign: "center" }, // Tipo
          7: { cellWidth: 20 },  // Data Op
        },
      });

      const hoje = new Date().toLocaleDateString("pt-BR").replace(/\//g, "-");
      doc.save(`Relatorio_Pedidos_${hoje}.pdf`);

      toast({
        title: "Sucesso!",
        description: "PDF exportado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível exportar para PDF.",
      });
    }
  };

  return (
    <div className="flex gap-4 justify-center">
      <Button onClick={exportarParaExcel} className="gap-2">
        <FileSpreadsheet className="h-4 w-4" />
        Exportar para Excel
      </Button>
      <Button onClick={exportarParaPDF} variant="secondary" className="gap-2">
        <FileText className="h-4 w-4" />
        Exportar para PDF
      </Button>
    </div>
  );
};
