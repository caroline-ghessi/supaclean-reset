import { useState, useEffect } from 'react';
import { User, Phone, Activity, MessageSquare, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVendors } from '@/hooks/useVendors';
import { Skeleton } from '@/components/ui/skeleton';
import { TokenConfigurationButton } from './TokenConfigurationButton';
import { VendorStatusDiagnostic } from './VendorStatusDiagnostic';

interface VendorListProps {
  onSelectVendor: (vendor: any) => void;
  selectedVendor: any;
}

export function VendorList({ onSelectVendor, selectedVendor }: VendorListProps) {
  const { data: vendors, isLoading, refetch } = useVendors();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!vendors || vendors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Nenhum vendedor cadastrado</p>
          <p className="text-sm">Clique em "Adicionar Vendedor" para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <Card 
            key={vendor.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedVendor?.id === vendor.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectVendor(vendor)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {vendor.name}
                </CardTitle>
                <Badge variant={vendor.is_active ? "default" : "secondary"}>
                  {vendor.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-1" />
                {vendor.phone_number}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium">{vendor.stats?.total_conversations || 0}</p>
                  <p className="text-xs text-muted-foreground">Conversas</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-sm font-medium">{vendor.stats?.avg_response_time || 0}min</p>
                  <p className="text-xs text-muted-foreground">Resposta</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-sm font-medium">{vendor.stats?.quality_score || 0}</p>
                  <p className="text-xs text-muted-foreground">Qualidade</p>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col items-center gap-2">
                {vendor.is_active && vendor.token_configured && (
                  <div className="flex items-center text-xs text-green-600">
                    <Activity className="h-3 w-3 mr-1" />
                    Online - Monitorando
                  </div>
                )}
                
                <TokenConfigurationButton
                  vendorId={vendor.id}
                  vendorName={vendor.name}
                  tokenConfigured={vendor.token_configured}
                  onTokenConfigured={() => refetch()}
                />
              </div>

              {selectedVendor?.id === vendor.id && (
                <div className="mt-4 pt-4 border-t">
                  <VendorStatusDiagnostic 
                    vendor={vendor} 
                    onStatusUpdate={() => refetch()}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}