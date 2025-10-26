import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserInfo {
  profiles: any[];
  roles: any[];
  profileError: any;
  roleError: any;
}

const AdminUserManagement = () => {
  const [email, setEmail] = useState('dsouzalima438@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [message, setMessage] = useState('');

  const checkUser = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      // Verificar se usuário existe na tabela profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase());

      // Verificar na tabela user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('*')
        .in('user_id', profileData?.map((p: any) => p.id) || []);

      setUserInfo({
        profiles: profileData,
        roles: roleData,
        profileError,
        roleError
      });

      if (profileData && profileData.length > 0) {
        setMessage(`Usuário encontrado! ${profileData.length} registro(s) na tabela profiles.`);
      } else {
        setMessage('Usuário não encontrado nas tabelas públicas.');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      setMessage('Erro ao verificar usuário: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!userInfo?.profiles || userInfo.profiles.length === 0) {
      toast.error('Nenhum usuário encontrado para excluir');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const userId = userInfo.profiles[0].id;

      // Tentar excluir das tabelas dependentes primeiro
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (roleError) {
        console.warn('Erro ao remover roles:', roleError);
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        throw profileError;
      }

      // Tentar usar a API administrativa (pode não funcionar devido a RLS)
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);
        if (authError) {
          console.warn('Erro na API admin:', authError);
        }
      } catch (adminError) {
        console.warn('API admin não disponível:', adminError);
      }

      toast.success('Usuário removido das tabelas públicas!');
      setMessage('Usuário removido com sucesso das tabelas públicas. Agora tente se cadastrar novamente.');
      setUserInfo(null);
      
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao remover usuário: ' + (error?.message || 'Erro desconhecido'));
      setMessage('Erro ao remover: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  const executeSQL = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Executar função SQL personalizada
      const { data, error } = await supabase.rpc('delete_user_by_email', {
        user_email: email
      });

      if (error) {
        throw error;
      }

      toast.success('Usuário removido via função SQL!');
      setMessage('Usuário removido com sucesso via SQL!');
      
    } catch (error: any) {
      console.error('Erro SQL:', error);
      toast.error('Função SQL não disponível: ' + (error?.message || 'Erro desconhecido'));
      setMessage('Função SQL não funcionou: ' + (error?.message || 'Erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Gerenciamento de Usuários - ADMIN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Email do usuário"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={checkUser} 
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? 'Verificando...' : 'Verificar Usuário'}
            </Button>

            <Button 
              onClick={deleteUser} 
              disabled={isLoading || !userInfo?.profiles}
              variant="destructive"
            >
              {isLoading ? 'Removendo...' : 'Remover das Tabelas'}
            </Button>

            <Button 
              onClick={executeSQL} 
              disabled={isLoading}
              variant="secondary"
            >
              {isLoading ? 'Executando...' : 'Função SQL'}
            </Button>
          </div>

          {message && (
            <Alert>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {userInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h3 className="font-semibold mb-2">Informações do Usuário:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            </div>
          )}

          <Alert>
            <AlertDescription>
              <strong>Instruções:</strong><br/>
              1. Clique em "Verificar Usuário" primeiro<br/>
              2. Se encontrar o usuário, clique em "Remover das Tabelas"<br/>
              3. Tente "Função SQL" se a remoção normal não funcionar<br/>
              4. Depois vá para /auth e tente se cadastrar novamente
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;