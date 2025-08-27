import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminIndex() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to prompts page as default admin page
    navigate('/admin/prompts');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecionando...</h1>
        <p className="text-muted-foreground">Carregando painel administrativo</p>
      </div>
    </div>
  );
}