import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PedidoForm } from "@/components/PedidoForm";
import { NotaFiscalForm } from "@/components/NotaFiscalForm";
import { PedidosTable } from "@/components/PedidosTable";
import { NotasFiscaisTable } from "@/components/NotasFiscaisTable";
import { FinancialCard } from "@/components/FinancialCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { TrendingUp, TrendingDown, AlertCircle, LogOut, User, Shield, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  arquivo_url?: string | null;
  canhoto_url?: string | null;
}

const Index = () => {
  const { toast } = useToast();
  const { playAddSound } = useNotificationSound();
  const { user, isAdmin, userRole, signOut, loading } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [obraSelecionada, setObraSelecionada] = useState<string>("Santo Amaro");

  // Form states - Pedidos
  const [obra, setObra] = useState("");
  const [pedido, setPedido] = useState("");
  const [data, setData] = useState("");
  const [material, setMaterial] = useState("");
  const [valor, setValor] = useState("");
  const [nfePedido, setNfePedido] = useState("");
  const [arquivoNfePedido, setArquivoNfePedido] = useState<File | null>(null);
  const [canhotoPedido, setCanhotoPedido] = useState<File | null>(null);
  const [tipoOperacao, setTipoOperacao] = useState("");
  const [dataOperacao, setDataOperacao] = useState("");

  // Form states - Notas
  const [nfe, setNfe] = useState("");
  const [dataNfe, setDataNfe] = useState("");
  const [valorNfe, setValorNfe] = useState("");
  const [obraNota, setObraNota] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  // Carregar dados do banco
  useEffect(() => {
    carregarPedidos();
    carregarNotas();
  }, []);

  const carregarPedidos = async () => {
    const { data, error } = await supabase.from("pedidos").select("*").order("data", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar pedidos", description: error.message });
    } else {
      setPedidos(data || []);
    }
  };

  const carregarNotas = async () => {
    const { data, error } = await supabase.from("notas_fiscais").select("*").order("data", { ascending: false });
    if (error) {
      toast({ variant: "destructive", title: "Erro ao carregar notas", description: error.message });
    } else {
      setNotas(data || []);
    }
  };

  const adicionarPedido = async () => {
    if (!obra || !pedido || !data || !material || !valor) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos!" });
      return;
    }

    let arquivoNfeUrl: string | null = null;
    let canhotoUrl: string | null = null;

    // Upload do arquivo NFe se existir
    if (arquivoNfePedido) {
      const fileExt = arquivoNfePedido.name.split(".").pop();
      const fileName = `nfe_${pedido}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage.from("notas-fiscais").upload(filePath, arquivoNfePedido);

      if (uploadError) {
        toast({ variant: "destructive", title: "Erro ao fazer upload da NF-e", description: uploadError.message });
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("notas-fiscais").getPublicUrl(filePath);
      arquivoNfeUrl = publicUrl;
    }

    // Upload do canhoto se existir
    if (canhotoPedido) {
      const fileExt = canhotoPedido.name.split(".").pop();
      const fileName = `canhoto_${pedido}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage.from("notas-fiscais").upload(filePath, canhotoPedido);

      if (uploadError) {
        toast({ variant: "destructive", title: "Erro ao fazer upload do canhoto", description: uploadError.message });
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("notas-fiscais").getPublicUrl(filePath);
      canhotoUrl = publicUrl;
    }

    const { error } = await supabase.from("pedidos").insert({
      obra,
      numero_pedido: pedido,
      numero_nfe: nfePedido || null,
      arquivo_nfe_url: arquivoNfeUrl,
      canhoto_url: canhotoUrl,
      data,
      materiais: material.split(",").map((m) => m.trim()),
      valor: parseFloat(valor),
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao adicionar pedido", description: error.message });
    } else {
      toast({ title: "Sucesso!", description: "Pedido adicionado com sucesso." });
      playAddSound(); // Tocar som de notificação
      setObra("");
      setPedido("");
      setData("");
      setMaterial("");
      setValor("");
      setNfePedido("");
      setArquivoNfePedido(null);
      setCanhotoPedido(null);
      carregarPedidos();
    }
  };

  const excluirPedido = async (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    
    // Excluir arquivo NFe do storage se existir
    if (pedido?.arquivo_nfe_url) {
      const fileName = pedido.arquivo_nfe_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("notas-fiscais").remove([fileName]);
      }
    }

    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir pedido", description: error.message });
    } else {
      toast({ title: "Sucesso!", description: "Pedido excluído com sucesso." });
      carregarPedidos();
    }
  };

  const alterarPedido = (id: string) => {
    const p = pedidos.find((pedido) => pedido.id === id);
    if (!p) return;
    setObra(p.obra);
    setPedido(p.numero_pedido);
    setData(p.data);
    setMaterial(p.materiais.join(", "));
    setValor(p.valor.toString());
    setNfePedido(p.numero_nfe || "");
    setArquivoNfePedido(null);
    excluirPedido(id);
  };

  const adicionarNota = async () => {
    if (!nfe || !dataNfe || !valorNfe || !obraNota) {
      toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos da nota!" });
      return;
    }

    let arquivoUrl: string | null = null;

    // Upload do arquivo se existir
    if (arquivo) {
      const fileExt = arquivo.name.split(".").pop();
      const fileName = `${nfe}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage.from("notas-fiscais").upload(filePath, arquivo);

      if (uploadError) {
        toast({ variant: "destructive", title: "Erro ao fazer upload", description: uploadError.message });
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("notas-fiscais").getPublicUrl(filePath);
      arquivoUrl = publicUrl;
    }

    const { error } = await supabase.from("notas_fiscais").insert({
      numero_nfe: nfe,
      obra: obraNota,
      data: dataNfe,
      valor: parseFloat(valorNfe),
      arquivo_url: arquivoUrl,
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao adicionar nota", description: error.message });
    } else {
      toast({ title: "Sucesso!", description: "Nota fiscal adicionada com sucesso." });
      playAddSound(); // Tocar som de notificação
      setNfe("");
      setDataNfe("");
      setValorNfe("");
      setObraNota("");
      setArquivo(null);
      carregarNotas();
    }
  };

  const excluirNota = async (id: string) => {
    const nota = notas.find((n) => n.id === id);
    
    // Excluir arquivo do storage se existir
    if (nota?.arquivo_url) {
      const fileName = nota.arquivo_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("notas-fiscais").remove([fileName]);
      }
    }

    const { error } = await supabase.from("notas_fiscais").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir nota", description: error.message });
    } else {
      toast({ title: "Sucesso!", description: "Nota fiscal excluída com sucesso." });
      carregarNotas();
    }
  };

  const alterarNota = (id: string) => {
    const n = notas.find((nota) => nota.id === id);
    if (!n) return;
    setNfe(n.numero_nfe);
    setDataNfe(n.data);
    setValorNfe(n.valor.toString());
    setObraNota(n.obra);
    setArquivo(null);
    excluirNota(id);
  };

  // Cálculos separados por obra
  const totalPedidosPorObra = (obraNome: string) =>
    pedidos.filter((p) => p.obra === obraNome).reduce((acc, p) => acc + p.valor, 0);
    
  const totalCreditoPorObra = (obraNome: string) =>
    notas.filter((n) => n.obra === obraNome).reduce((acc, n) => acc + n.valor, 0);
    
  const saldoPorObra = (obraNome: string) => 
    totalCreditoPorObra(obraNome) - totalPedidosPorObra(obraNome);

  // Totais gerais (soma de todas as obras)
  const totalPedidos = pedidos.reduce((acc, p) => acc + p.valor, 0);
  const totalCredito = notas.reduce((acc, n) => acc + n.valor, 0);
  const saldoGeral = totalCredito - totalPedidos;

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
        ["Saldo Final", saldoGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })],
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

      // Aba de Pedidos - Santo Amaro
      const pedidosSA = pedidos.filter((p) => p.obra === "Santo Amaro");
      const pedidosSAData = [
        ["OBRA: SANTO AMARO"],
        [""],
        ["NF-e", "Data", "Materiais", "Valor (R$)", "Anexo", "Pedido", "Tipo Operação", "Data Operação"],
        ...pedidosSA.map((p) => [
          p.numero_nfe || "-",
          new Date(p.data).toLocaleDateString("pt-BR"),
          p.materiais.join("\n• ").replace(/^/, "• "),
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
        { width: 15 }, { width: 12 }, { width: 50 }, { width: 15 }, { width: 10 }, { width: 15 }, { width: 15 }, { width: 15 }
      ];
      XLSX.utils.book_append_sheet(wb, wsSA, "Santo Amaro");

      // Aba de Pedidos - Pacaembu
      const pedidosPacaembu = pedidos.filter((p) => p.obra === "Pacaembu");
      const pedidosPacaembuData = [
        ["OBRA: PACAEMBU"],
        [""],
        ["Pedido", "NF-e", "Data", "Materiais", "Valor (R$)", "Anexo", "Tipo Operação", "Data Operação"],
        ...pedidosPacaembu.map((p) => [
          p.numero_pedido,
          p.numero_nfe || "-",
          new Date(p.data).toLocaleDateString("pt-BR"),
          p.materiais.join("\n• ").replace(/^/, "• "),
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
        { width: 15 }, { width: 15 }, { width: 12 }, { width: 50 }, { width: 15 }, { width: 10 }, { width: 15 }, { width: 15 }
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
          ["Saldo Final", `R$ ${saldoGeral.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`],
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

      // Pedidos Santo Amaro
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("OBRA: SANTO AMARO", 14, yPos);
      yPos += 10;

      const pedidosSA = pedidos.filter((p) => p.obra === "Santo Amaro");
      const pedidosSABody = pedidosSA.map((p) => [
        p.numero_nfe || "-",
        new Date(p.data).toLocaleDateString("pt-BR"),
        p.materiais.map(m => `- ${m}`).join("\n"),
        `R$ ${p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        p.arquivo_nfe_url ? "Sim" : "-",
        p.numero_pedido,
        p.tipo_operacao ? (p.tipo_operacao === 'retirada' ? 'Retirada' : 'Entrega') : "-",
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
          0: { cellWidth: 20 }, 1: { cellWidth: 20 }, 2: { cellWidth: 60 }, 3: { cellWidth: 25, halign: "right" },
          4: { cellWidth: 15, halign: "center" }, 5: { cellWidth: 20 }, 6: { cellWidth: 15, halign: "center" }, 7: { cellWidth: 20 },
        },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Pedidos Pacaembu
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("OBRA: PACAEMBU", 14, yPos);
      yPos += 10;

      const pedidosPacaembu = pedidos.filter((p) => p.obra === "Pacaembu");
      const pedidosPacaembuBody = pedidosPacaembu.map((p) => [
        p.numero_pedido,
        p.numero_nfe || "-",
        new Date(p.data).toLocaleDateString("pt-BR"),
        p.materiais.map(m => `- ${m}`).join("\n"),
        `R$ ${p.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        p.arquivo_nfe_url ? "Sim" : "-",
        p.tipo_operacao ? (p.tipo_operacao === 'retirada' ? 'Retirada' : 'Entrega') : "-",
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
          0: { cellWidth: 20 }, 1: { cellWidth: 20 }, 2: { cellWidth: 20 }, 3: { cellWidth: 60 }, 4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 15, halign: "center" }, 6: { cellWidth: 15, halign: "center" }, 7: { cellWidth: 20 },
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

  // Lista das obras disponíveis
  const obrasDisponiveis = ["Santo Amaro", "Pacaembu"];

  const hoje = new Date();
  const dia = hoje.getDate();
  const observacao = dia >= 1 && dia <= 18 
    ? "Período de faturamento: até o dia 18 deste mês." 
    : "Fora do período de faturamento (1 a 18).";
  const dentroDoPeríodo = dia >= 1 && dia <= 18;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Controle de Pedidos
              </h1>
              <p className="text-muted-foreground">Sistema de Gestão Financeira de Obras</p>
            </div>
            
            {user ? (
              <Card className="w-full md:w-auto">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isAdmin ? (
                        <Shield className="h-5 w-5 text-primary" />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="text-sm">
                        <p className="font-medium">{user.email}</p>
                        <p className="text-muted-foreground capitalize">
                          {userRole === 'admin' ? 'Administrador' : 'Usuário'}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <FileText className="h-4 w-4" />
                          Relatórios
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportarParaExcel}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Exportar para Excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportarParaPDF}>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar para PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={signOut}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button
                variant="outline"
                onClick={() => window.location.href = '/auth'}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                Login Admin
              </Button>
            )}
          </div>
        </header>

        <Alert variant={dentroDoPeríodo ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{observacao}</AlertDescription>
        </Alert>

        {!user && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você está visualizando o sistema em modo público. Para gerenciar pedidos e notas fiscais, faça login como administrador.
            </AlertDescription>
          </Alert>
        )}

        {user && !isAdmin && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você está visualizando os dados em modo somente leitura. Apenas administradores podem fazer alterações.
            </AlertDescription>
          </Alert>
        )}

        {isAdmin && (
          <PedidoForm
            obra={obra}
            pedido={pedido}
            data={data}
            material={material}
            valor={valor}
            nfe={nfePedido}
            arquivoNfe={arquivoNfePedido}
            canhoto={canhotoPedido}
            tipoOperacao={tipoOperacao}
            dataOperacao={dataOperacao}
            setObra={setObra}
            setPedido={setPedido}
            setData={setData}
            setMaterial={setMaterial}
            setValor={setValor}
            setNfe={setNfePedido}
            setArquivoNfe={setArquivoNfePedido}
            setCanhoto={setCanhotoPedido}
            setTipoOperacao={setTipoOperacao}
            setDataOperacao={setDataOperacao}
            onSubmit={adicionarPedido}
          />
        )}

        {/* Resumo por Obra - Cards Customizados */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Santo Amaro */}
          <Card className="overflow-hidden shadow-lg border-l-4 border-l-green-500">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-5">
                <div className="text-center">
                  <h3 className="text-2xl font-extrabold tracking-tight">🏗️ Santo Amaro</h3>
                  <p className="text-green-100 text-base font-medium mt-1">Resumo Financeiro</p>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center px-2">
                    <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold mb-2">Crédito</p>
                    <p className="text-lg font-black text-green-600 whitespace-nowrap">
                      R$ {totalCreditoPorObra("Santo Amaro").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold mb-2">Pedidos</p>
                    <p className="text-lg font-black text-blue-600 whitespace-nowrap">
                      R$ {totalPedidosPorObra("Santo Amaro").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold mb-2">Saldo</p>
                    <p className={`text-lg font-black whitespace-nowrap ${saldoPorObra("Santo Amaro") >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {saldoPorObra("Santo Amaro").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pacaembu */}
          <Card className="overflow-hidden shadow-lg border-l-4 border-l-red-500">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-5">
                <div className="text-center">
                  <h3 className="text-2xl font-extrabold tracking-tight">🏗️ Pacaembu</h3>
                  <p className="text-red-100 text-base font-medium mt-1">Resumo Financeiro</p>
                </div>
              </div>
              <div className="p-4 bg-white">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center px-2">
                    <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold mb-2">Crédito</p>
                    <p className="text-lg font-black text-green-600 whitespace-nowrap">
                      R$ {totalCreditoPorObra("Pacaembu").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold mb-2">Pedidos</p>
                    <p className="text-lg font-black text-blue-600 whitespace-nowrap">
                      R$ {totalPedidosPorObra("Pacaembu").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-center px-2">
                    <p className="text-sm text-gray-600 uppercase tracking-wider font-semibold mb-2">Saldo</p>
                    <p className={`text-lg font-black whitespace-nowrap ${saldoPorObra("Pacaembu") >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {saldoPorObra("Pacaembu").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>





        {isAdmin && (
          <NotaFiscalForm
            nfe={nfe}
            dataNfe={dataNfe}
            valorNfe={valorNfe}
            obra={obraNota}
            arquivo={arquivo}
            setNfe={setNfe}
            setDataNfe={setDataNfe}
            setValorNfe={setValorNfe}
            setObra={setObraNota}
            setArquivo={setArquivo}
            onSubmit={adicionarNota}
          />
        )}

        <NotasFiscaisTable 
          notas={notas} 
          onEdit={isAdmin ? alterarNota : undefined} 
          onDelete={isAdmin ? excluirNota : undefined} 
        />

        <div className="grid md:grid-cols-2 gap-6">
          <PedidosTable
            obraNome="Santo Amaro"
            pedidos={pedidos.filter((p) => p.obra === "Santo Amaro")}
            onEdit={isAdmin ? alterarPedido : undefined}
            onDelete={isAdmin ? excluirPedido : undefined}
            total={totalPedidosPorObra("Santo Amaro")}
          />
          <PedidosTable
            obraNome="Pacaembu"
            pedidos={pedidos.filter((p) => p.obra === "Pacaembu")}
            onEdit={isAdmin ? alterarPedido : undefined}
            onDelete={isAdmin ? excluirPedido : undefined}
            total={totalPedidosPorObra("Pacaembu")}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
