import { useState } from 'react';
import { Plus, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { VendorList } from '@/components/vendor/VendorList';
import { VendorConversations } from '@/components/vendor/VendorConversations';
import { VendorQuality } from '@/components/vendor/VendorQuality';
import { AddVendorDialog } from '@/components/vendor/AddVendorDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function VendedoresPage() {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('vendedores');

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center space-x-4">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            Monitoramento de Vendedores
          </h1>
        </div>
        
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Vendedor
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-6 mt-4 w-fit">
          <TabsTrigger value="vendedores" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendedores
          </TabsTrigger>
          
          {selectedVendor && (
            <>
              <TabsTrigger value="conversas" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Conversas
              </TabsTrigger>
              <TabsTrigger value="qualidade" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Qualidade
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="vendedores" className="h-full m-0">
            <VendorList 
              onSelectVendor={(vendor) => {
                setSelectedVendor(vendor);
                setActiveTab('conversas');
              }}
              selectedVendor={selectedVendor}
            />
          </TabsContent>

          {selectedVendor && (
            <>
              <TabsContent value="conversas" className="h-full m-0">
                <VendorConversations vendor={selectedVendor} />
              </TabsContent>
              
              <TabsContent value="qualidade" className="h-full m-0">
                <VendorQuality vendor={selectedVendor} />
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      <AddVendorDialog 
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}