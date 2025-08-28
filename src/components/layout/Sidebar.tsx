import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  MessageCircle, 
  Flame, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  Bot,
  Users,
  FileText,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useConversations } from '@/hooks/useConversations';

interface MenuItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  description?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  // Query para obter estatísticas em tempo real
  const { data: conversations } = useConversations();
  
  const totalConversations = conversations?.length || 0;
  const hotLeads = conversations?.filter(c => c.lead_temperature === 'hot').length || 0;
  const activeConversations = conversations?.filter(c => c.status === 'active').length || 0;

  const menuGroups: MenuGroup[] = [
    {
      title: 'Atendimento',
      items: [
        {
          title: 'Conversas',
          url: '/conversas',
          icon: MessageCircle,
          badge: totalConversations,
          description: 'Todas as conversas ativas'
        },
        {
          title: 'Leads Quentes',
          url: '/leads-quentes',
          icon: Flame,
          badge: hotLeads,
          description: 'Leads com alta conversão'
        },
        {
          title: 'Bot Inteligente',
          url: '/bot',
          icon: Bot,
          description: 'Configuração do chatbot'
        },
        {
          title: 'Vendedores',
          url: '/vendedores',
          icon: Users,
          description: 'Monitoramento WhatsApp'
        }
      ]
    },
    {
      title: 'Gestão',
      items: [
        {
          title: 'Analytics',
          url: '/analytics',
          icon: BarChart3,
          description: 'Métricas e relatórios'
        },
        {
          title: 'Atendentes',
          url: '/atendentes',
          icon: Users,
          description: 'Gerenciar equipe'
        },
        {
          title: 'Templates',
          url: '/templates',
          icon: FileText,
          description: 'Mensagens pré-definidas'
        }
      ]
    },
    {
      title: 'Sistema',
      items: [
        {
          title: 'Configurações',
          url: '/configuracoes',
          icon: Settings,
          description: 'Configurações gerais'
        },
        {
          title: 'Logs',
          url: '/logs',
          icon: Activity,
          description: 'Logs do sistema'
        }
      ]
    }
  ];

  const isActive = (path: string) => currentPath === path || currentPath.startsWith(path + '/');

  return (
    <div 
      className={cn(
        'h-screen bg-slate-900 border-r border-slate-800 text-white transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-orange-500">Dry</span>
              <span className="text-slate-400">store</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">Sistema de Atendimento</p>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <ChevronLeft className={cn(
            'h-4 w-4 transition-transform',
            collapsed && 'rotate-180'
          )} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {group.title}
              </h3>
            )}
            
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  className={({ isActive: linkActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group',
                      linkActive || isActive(item.url)
                        ? 'bg-orange-500 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    )
                  }
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  
                  {!collapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.title}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <Badge 
                              variant="secondary" 
                              className="ml-2 bg-slate-700 text-slate-200 text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Status Footer */}
      <div className="p-4 border-t border-slate-800">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Conversas Ativas</span>
              <span className="text-green-400 font-semibold">{activeConversations}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Leads Quentes</span>
              <span className="text-orange-400 font-semibold">{hotLeads}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-slate-400">Sistema Online</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <Badge variant="secondary" className="bg-slate-700 text-slate-200 text-xs">
              {activeConversations}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}