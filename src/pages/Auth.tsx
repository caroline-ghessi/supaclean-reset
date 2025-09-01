import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, Bot, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }

    // Verificar se há erro na URL (ex: erro de convite)
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      if (error === 'access_denied' && errorDescription?.includes('Email link is invalid')) {
        setError('O link de convite expirou ou já foi usado. Solicite um novo convite.');
      } else {
        setError(errorDescription || 'Erro no processo de autenticação.');
      }
    }
  }, [user, navigate, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await signIn(email, password);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos. Verifique suas credenciais.');
      } else if (error.message.includes('Email not confirmed')) {
        setError('Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.');
      } else {
        setError(error.message);
      }
    } else {
      navigate('/');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await signUp(email, password);
    
    if (error) {
      if (error.message.includes('User already registered')) {
        setError('Este email já está cadastrado. Use a aba "Entrar" para fazer login.');
      } else {
        setError(error.message);
      }
    } else {
      setMessage('Verifique seu email para confirmar a conta e então faça login.');
    }
    
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setResetMessage(`Erro: ${error.message}`);
      } else {
        setResetMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch (err) {
      setResetMessage('Erro ao enviar email de recuperação. Tente novamente.');
    }

    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">DryStore AI</h1>
          <p className="text-gray-600 mt-2">Sistema de Atendimento Inteligente</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
            <CardDescription>
              Entre com suas credenciais ou crie uma nova conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                  
                  <div className="text-center">
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-sm text-muted-foreground hover:text-primary"
                      onClick={() => setShowResetForm(true)}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {message && (
                    <Alert>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Conta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {showResetForm && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowResetForm(false)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar
                  </Button>
                  <h3 className="font-medium">Recuperar Senha</h3>
                </div>
                
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  {resetMessage && (
                    <Alert variant={resetMessage.includes('Erro') ? 'destructive' : 'default'}>
                      <AlertDescription>{resetMessage}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={resetLoading}>
                    {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enviar Email de Recuperação
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-600 mt-4">
          <p>Para demonstração, você pode desabilitar "Confirm email" nas configurações do Supabase para acelerar o teste.</p>
        </div>
      </div>
    </div>
  );
}