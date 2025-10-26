import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PedidoForm } from "@/components/PedidoForm";
import { NotaFiscalForm } from "@/components/NotaFiscalForm";
import { PedidosTable } from "@/components/PedidosTable";
import { NotasFiscaisTable } from "@/components/NotasFiscaisTable";
import { FinancialCard } from "@/components/FinancialCard";
import { ExportButtons } from "@/components/ExportButtons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, TrendingDown, AlertCircle, LogOut, User, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  const [tipoOperacao, setTipoOperacao] = useState("");
  const [dataOperacao, setDataOperacao] = useState("");

  // Form states - Notas
  const [nfe, setNfe] = useState("");
  const [dataNfe, setDataNfe] = useState("");
  const [valorNfe, setValorNfe] = useState("");
  const [obraNota, setObraNota] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [canhoto, setCanhoto] = useState<File | null>(null);

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

    const { error } = await supabase.from("pedidos").insert({
      obra,
      numero_pedido: pedido,
      numero_nfe: nfePedido || null,
      arquivo_nfe_url: arquivoNfeUrl,
      data,
      materiais: material.split(",").map((m) => m.trim()),
      valor: parseFloat(valor),
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao adicionar pedido", description: error.message });
    } else {
      toast({ title: "Sucesso!", description: "Pedido adicionado com sucesso." });
      setObra("");
      setPedido("");
      setData("");
      setMaterial("");
      setValor("");
      setNfePedido("");
      setArquivoNfePedido(null);
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
            tipoOperacao={tipoOperacao}
            dataOperacao={dataOperacao}
            setObra={setObra}
            setPedido={setPedido}
            setData={setData}
            setMaterial={setMaterial}
            setValor={setValor}
            setNfe={setNfePedido}
            setArquivoNfe={setArquivoNfePedido}
            setTipoOperacao={setTipoOperacao}
            setDataOperacao={setDataOperacao}
            onSubmit={adicionarPedido}
          />
        )}

        {/* Resumo Geral Simplificado */}
        <div className="grid md:grid-cols-3 gap-4">
          <FinancialCard title="💰 Crédito Total" value={totalCredito} icon={Wallet} variant="success" />
          <FinancialCard title="📦 Pedidos Total" value={totalPedidos} icon={TrendingUp} variant="primary" />
          <FinancialCard title="💸 Saldo Geral" value={saldoGeral} icon={TrendingDown} variant="default" />
        </div>

        {/* Resumo por Obra - Compacto */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Santo Amaro */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🏗️ Santo Amaro
                <span className={`text-sm px-2 py-1 rounded ${saldoPorObra("Santo Amaro") >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  R$ {saldoPorObra("Santo Amaro").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <p className="text-green-600 font-medium">Crédito</p>
                  <p className="font-bold">R$ {totalCreditoPorObra("Santo Amaro").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-600 font-medium">Pedidos</p>
                  <p className="font-bold">R$ {totalPedidosPorObra("Santo Amaro").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 font-medium">% Total</p>
                  <p className="font-bold">{totalCredito > 0 ? ((totalCreditoPorObra("Santo Amaro") / totalCredito * 100).toFixed(1)) : 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pacaembu */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                🏗️ Pacaembu
                <span className={`text-sm px-2 py-1 rounded ${saldoPorObra("Pacaembu") >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  R$ {saldoPorObra("Pacaembu").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="text-center">
                  <p className="text-green-600 font-medium">Crédito</p>
                  <p className="font-bold">R$ {totalCreditoPorObra("Pacaembu").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center">
                  <p className="text-blue-600 font-medium">Pedidos</p>
                  <p className="font-bold">R$ {totalPedidosPorObra("Pacaembu").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 font-medium">% Total</p>
                  <p className="font-bold">{totalCredito > 0 ? ((totalCreditoPorObra("Pacaembu") / totalCredito * 100).toFixed(1)) : 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <ExportButtons
          pedidos={pedidos}
          notas={notas}
          totalCredito={totalCredito}
          totalPedidos={totalPedidos}
          saldo={saldoGeral}
        />

        {isAdmin && (
          <NotaFiscalForm
            nfe={nfe}
            dataNfe={dataNfe}
            valorNfe={valorNfe}
            obra={obraNota}
            arquivo={arquivo}
            canhoto={canhoto}
            setNfe={setNfe}
            setDataNfe={setDataNfe}
            setValorNfe={setValorNfe}
            setObra={setObraNota}
            setArquivo={setArquivo}
            setCanhoto={setCanhoto}
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
