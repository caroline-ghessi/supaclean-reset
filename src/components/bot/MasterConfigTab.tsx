import { useEffect, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSystemConfigs, useUpdateSystemConfig } from '@/hooks/useSystemConfigs';
import { Save } from 'lucide-react';

export function MasterConfigTab() {
  const masterConfigKeys = [
    'master_agent_welcome_message',
    'master_agent_fallback_message',
    'master_agent_buffer_time',
    'master_agent_min_confidence',
    'master_agent_collect_name',
    'master_agent_show_buttons',
    'master_agent_multi_category'
  ];

  const { data: configs } = useSystemConfigs(masterConfigKeys);
  const { mutate: updateConfig, isPending } = useUpdateSystemConfig();

  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  useEffect(() => {
    if (configs) {
      const values: Record<string, any> = {};
      configs.forEach(config => {
        let value = config.value;
        // Parse JSON strings for text values
        if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
          value = JSON.parse(value);
        }
        values[config.key] = value;
      });
      setLocalValues(values);
    }
  }, [configs]);

  const handleSave = (key: string, value: any) => {
    updateConfig({ key, value });
  };

  const getConfigValue = (key: string, defaultValue: any = '') => {
    return localValues[key] !== undefined ? localValues[key] : defaultValue;
  };

  const updateLocalValue = (key: string, value: any) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Mensagem de Boas-vindas */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">
          Mensagem de Boas-vindas (Primeira Interação)
        </Label>
        <div className="space-y-3">
          <Textarea
            className="w-full h-32 p-4 text-sm resize-none"
            value={getConfigValue('master_agent_welcome_message')}
            onChange={(e) => updateLocalValue('master_agent_welcome_message', e.target.value)}
            placeholder="Digite a mensagem de boas-vindas..."
          />
          <Button
            onClick={() => handleSave('master_agent_welcome_message', getConfigValue('master_agent_welcome_message'))}
            disabled={isPending}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Mensagem
          </Button>
        </div>
      </div>

      {/* Mensagem quando não entende */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-2 block">
          Mensagem quando não consegue classificar
        </Label>
        <div className="space-y-3">
          <Textarea
            className="w-full h-24 p-4 text-sm resize-none"
            value={getConfigValue('master_agent_fallback_message')}
            onChange={(e) => updateLocalValue('master_agent_fallback_message', e.target.value)}
            placeholder="Digite a mensagem para quando não entender..."
          />
          <Button
            onClick={() => handleSave('master_agent_fallback_message', getConfigValue('master_agent_fallback_message'))}
            disabled={isPending}
            size="sm"
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Mensagem
          </Button>
        </div>
      </div>

      {/* Configurações de Comportamento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Tempo de espera para classificar
          </Label>
          <Select
            value={getConfigValue('master_agent_buffer_time', '60').toString()}
            onValueChange={(value) => {
              updateLocalValue('master_agent_buffer_time', parseInt(value));
              handleSave('master_agent_buffer_time', parseInt(value));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 segundos</SelectItem>
              <SelectItem value="60">60 segundos (recomendado)</SelectItem>
              <SelectItem value="90">90 segundos</SelectItem>
              <SelectItem value="120">120 segundos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground mb-2 block">
            Confiança mínima para rotear
          </Label>
          <Select
            value={getConfigValue('master_agent_min_confidence', '70').toString()}
            onValueChange={(value) => {
              updateLocalValue('master_agent_min_confidence', parseInt(value));
              handleSave('master_agent_min_confidence', parseInt(value));
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="60">60%</SelectItem>
              <SelectItem value="70">70%</SelectItem>
              <SelectItem value="80">80%</SelectItem>
              <SelectItem value="90">90%</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Switches de Comportamento */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="font-medium text-foreground">Coletar nome automaticamente</p>
            <p className="text-sm text-muted-foreground">Pergunta o nome se não identificado</p>
          </div>
          <Switch
            checked={getConfigValue('master_agent_collect_name', true)}
            onCheckedChange={(checked) => {
              updateLocalValue('master_agent_collect_name', checked);
              handleSave('master_agent_collect_name', checked);
            }}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="font-medium text-foreground">Mostrar opções em botões</p>
            <p className="text-sm text-muted-foreground">Exibe quick replies com categorias</p>
          </div>
          <Switch
            checked={getConfigValue('master_agent_show_buttons', true)}
            onCheckedChange={(checked) => {
              updateLocalValue('master_agent_show_buttons', checked);
              handleSave('master_agent_show_buttons', checked);
            }}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div>
            <p className="font-medium text-foreground">Multi-categoria</p>
            <p className="text-sm text-muted-foreground">Permite identificar múltiplas intenções</p>
          </div>
          <Switch
            checked={getConfigValue('master_agent_multi_category', false)}
            onCheckedChange={(checked) => {
              updateLocalValue('master_agent_multi_category', checked);
              handleSave('master_agent_multi_category', checked);
            }}
          />
        </div>
      </div>
    </div>
  );
}