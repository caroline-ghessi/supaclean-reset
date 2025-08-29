/**
 * Script de migração para atualizar vendors existentes
 * Marca como token_configured = true para vendors que já têm dados
 */

import { supabase } from '@/integrations/supabase/client';

export async function migrateExistingVendors(): Promise<{
  success: boolean;
  message: string;
  updated: number;
}> {
  try {
    // Buscar todos os vendors existentes
    const { data: vendors, error: fetchError } = await supabase
      .from('vendors')
      .select('id, name, token_configured');

    if (fetchError) {
      throw fetchError;
    }

    if (!vendors || vendors.length === 0) {
      return {
        success: true,
        message: 'Nenhum vendor encontrado para migrar',
        updated: 0
      };
    }

    // Marcar todos como não configurados (administrador precisará reconfigurar)
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ token_configured: false })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all

    if (updateError) {
      throw updateError;
    }

    // Log da migração
    await supabase.from('system_logs').insert({
      level: 'info',
      source: 'vendor-token-migration',
      message: 'Vendor tokens migration completed',
      data: {
        vendors_updated: vendors.length,
        migration_date: new Date().toISOString(),
        action: 'marked_all_as_unconfigured_for_security'
      }
    });

    return {
      success: true,
      message: `${vendors.length} vendor(s) marcados como necessitando reconfiguração de token`,
      updated: vendors.length
    };

  } catch (error: any) {
    console.error('Migration error:', error);
    
    // Log do erro
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'vendor-token-migration',
      message: 'Vendor tokens migration failed',
      data: { error: error.message }
    });

    return {
      success: false,
      message: `Erro na migração: ${error.message}`,
      updated: 0
    };
  }
}

// Função para verificar se migration é necessária
export async function checkMigrationStatus(): Promise<{
  needsMigration: boolean;
  totalVendors: number;
  unconfiguredVendors: number;
}> {
  try {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, token_configured');

    const totalVendors = vendors?.length || 0;
    const unconfiguredVendors = vendors?.filter(v => !v.token_configured).length || 0;

    return {
      needsMigration: unconfiguredVendors > 0,
      totalVendors,
      unconfiguredVendors
    };
  } catch (error) {
    console.error('Migration status check error:', error);
    return {
      needsMigration: false,
      totalVendors: 0,
      unconfiguredVendors: 0
    };
  }
}