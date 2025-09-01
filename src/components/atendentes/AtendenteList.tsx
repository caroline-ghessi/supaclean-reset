import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAtendentes, type Atendente } from '@/hooks/useAtendentes';
import { User, MessageCircle, Clock, Star, Shield, Users, UserCheck } from 'lucide-react';

interface AtendenteListProps {
  onSelectAtendente: (atendente: Atendente) => void;
  selectedAtendente: Atendente | null;
}

export function AtendenteList({ onSelectAtendente, selectedAtendente }: AtendenteListProps) {
  const { atendentes, isLoading, updateAtendente, updateRole, isUpdating } = useAtendentes();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (atendente: Atendente, isActive: boolean) => {
    setUpdatingId(atendente.id);
    try {
      await updateAtendente({
        id: atendente.id,
        updates: { is_active: isActive }
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRoleChange = async (atendente: Atendente, role: 'admin' | 'supervisor' | 'atendente') => {
    setUpdatingId(atendente.id);
    try {
      await updateRole({
        userId: atendente.user_id,
        role
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'supervisor':
        return <Users className="h-4 w-4" />;
      case 'atendente':
        return <UserCheck className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'destructive' as const;
      case 'supervisor':
        return 'default' as const;
      case 'atendente':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!atendentes.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum atendente encontrado</h3>
          <p className="text-sm text-muted-foreground text-center">
            Adicione novos atendentes para começar a gerenciar sua equipe.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {atendentes.map((atendente) => (
        <Card 
          key={atendente.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedAtendente?.id === atendente.id ? 'ring-2 ring-primary shadow-md' : ''
          }`}
          onClick={() => onSelectAtendente(atendente)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={atendente.avatar_url} />
                  <AvatarFallback>
                    {atendente.display_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{atendente.display_name}</h3>
                  <p className="text-sm text-muted-foreground">{atendente.email}</p>
                  {atendente.department && (
                    <p className="text-xs text-muted-foreground">{atendente.department}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={getRoleBadgeVariant(atendente.role)} className="gap-1">
                  {getRoleIcon(atendente.role)}
                  {atendente.role?.charAt(0).toUpperCase() + atendente.role?.slice(1)}
                </Badge>
                <Badge variant={atendente.is_active ? 'default' : 'secondary'}>
                  {atendente.is_active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">{atendente.stats?.total_conversations || 0}</p>
                  <p className="text-xs text-muted-foreground">Conversas</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{atendente.stats?.avg_response_time || 0}min</p>
                  <p className="text-xs text-muted-foreground">Tempo Médio</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">{atendente.stats?.quality_score || 0}%</p>
                  <p className="text-xs text-muted-foreground">Qualidade</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={atendente.is_active}
                    onCheckedChange={(checked) => handleStatusChange(atendente, checked)}
                    disabled={updatingId === atendente.id}
                  />
                  <span className="text-sm">Ativo</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Select
                  value={atendente.role}
                  onValueChange={(role: 'admin' | 'supervisor' | 'atendente') => 
                    handleRoleChange(atendente, role)
                  }
                  disabled={updatingId === atendente.id}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="atendente">Atendente</SelectItem>
                    <SelectItem value="supervisor">Supervisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}