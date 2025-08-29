import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VendorTestResult {
  vendor: {
    id: string;
    name: string;
    phone_number: string;
    is_active: boolean;
    token_configured: boolean;
  };
  token_status: {
    secret_exists: boolean;
    db_configured: boolean;
    auto_updated: boolean;
  };
  webhook_test: {
    url: string;
    status?: number;
    success: boolean;
    response?: string;
    error?: string;
  };
}

export function useVendorTokenTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VendorTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testVendorIntegration = async (vendorId: string) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('test-vendor-webhook', {
        body: { vendor_id: vendorId }
      });

      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }

      setResult(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    testVendorIntegration,
    loading,
    result,
    error,
    reset: () => {
      setResult(null);
      setError(null);
    }
  };
}