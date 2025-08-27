import React, { useState } from 'react';
import { ChatSimulator } from './ChatSimulator';

interface TestSectionProps {}

export function TestSection({}: TestSectionProps) {
  const [testMode, setTestMode] = useState<'simple' | 'advanced'>('simple');
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Painel de Configuração */}
      <div className="col-span-5">
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-6">Configurar Teste</h2>
          
          {/* Mode Selector */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg mb-6">
            <button
              onClick={() => setTestMode('simple')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                testMode === 'simple' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Teste Simples
            </button>
            <button
              onClick={() => setTestMode('advanced')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                testMode === 'advanced' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'
              }`}
            >
              Teste Avançado
            </button>
          </div>

          {/* Test Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Selecione o Agente
              </label>
              <select className="w-full p-3 border rounded-lg bg-background text-foreground">
                <option>Energia Solar</option>
                <option>Telhas Shingle</option>
                <option>Steel Frame</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Mensagem de Teste
              </label>
              <textarea
                className="w-full p-3 border rounded-lg bg-background text-foreground"
                rows={4}
                placeholder="Digite uma mensagem para testar o bot..."
              />
            </div>

            {testMode === 'advanced' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Contexto do Cliente
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nome do cliente"
                      className="w-full p-2 border rounded-lg text-sm bg-background text-foreground"
                    />
                    <input
                      type="text"
                      placeholder="Telefone"
                      className="w-full p-2 border rounded-lg text-sm bg-background text-foreground"
                    />
                    <select className="w-full p-2 border rounded-lg text-sm bg-background text-foreground">
                      <option>Lead Frio</option>
                      <option>Lead Morno</option>
                      <option>Lead Quente</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => setIsProcessing(true)}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Processando...
                </span>
              ) : (
                'Executar Teste'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Painel de Resultados */}
      <div className="col-span-7">
        <div className="bg-card rounded-xl shadow-sm border p-6 h-full">
          <h2 className="text-lg font-semibold text-foreground mb-6">Resultado do Teste</h2>
          
          <div className="space-y-4">
            {/* Chat Simulation */}
            <ChatSimulator />

            {/* Analysis Panel */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-400 mb-1">Intenção Detectada</h4>
                <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">Energia Solar</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                <h4 className="text-sm font-medium text-green-900 dark:text-green-400 mb-1">Confiança</h4>
                <p className="text-lg font-semibold text-green-700 dark:text-green-300">95%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}