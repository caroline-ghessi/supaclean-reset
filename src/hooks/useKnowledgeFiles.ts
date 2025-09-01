import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductCategory } from '@/types/conversation.types';
import { toast } from '@/hooks/use-toast';

// Function to sanitize filename for storage
function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

export interface KnowledgeFile {
  id: string;
  agent_category: ProductCategory;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  extracted_content?: string;
  metadata?: any;
  processing_status: 'pending' | 'processing' | 'completed' | 'completed_with_embeddings' | 'error';
  processed_at?: string;
  created_at: string;
  updated_at: string;
  chunks_count?: number;
}

export function useKnowledgeFiles(agentCategory: ProductCategory) {
  return useQuery({
    queryKey: ['knowledge-files', agentCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_knowledge_files')
        .select(`
          *,
          chunks_count:knowledge_chunks(count)
        `)
        .eq('agent_category', agentCategory as any) // Type will be updated after DB sync
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include chunks_count as a number
      const transformedData = data?.map(file => ({
        ...file,
        chunks_count: file.chunks_count?.[0]?.count || 0
      })) || [];
      
      return transformedData as KnowledgeFile[];
    },
  });
}

export function useUploadKnowledgeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      agentCategory 
    }: { 
      file: File; 
      agentCategory: ProductCategory; 
    }) => {
      console.log(`📤 Uploading file: ${file.name} for agent: ${agentCategory}`);

      // Upload to storage with sanitized filename
      const sanitizedFileName = sanitizeFileName(file.name);
      const filePath = `${agentCategory}/${Date.now()}-${sanitizedFileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('agent-knowledge')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw uploadError;
      }

      console.log('✅ File uploaded to storage:', uploadData.path);

      // Create database record
      const { data: fileRecord, error: dbError } = await supabase
        .from('agent_knowledge_files')
        .insert({
          agent_category: agentCategory as any, // Type will be updated after DB sync
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: uploadData.path,
          processing_status: 'pending'
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw dbError;
      }

      console.log('✅ File record created:', fileRecord.id);

      // Process file in background
      try {
        const { data: processResult, error: processError } = await supabase.functions.invoke('process-knowledge-file', {
          body: {
            fileId: fileRecord.id
          }
        });

        if (processError) {
          console.error('⚠️ Processing error:', processError);
          // Don't throw here - file is uploaded, processing can be retried
        } else {
          console.log('✅ File processing started:', processResult);
        }
      } catch (processError) {
        console.error('⚠️ Processing call failed:', processError);
        // Don't throw - file is uploaded successfully
      }

      return fileRecord;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files', variables.agentCategory] });
      toast({
        title: "Arquivo Enviado!",
        description: `${data.file_name} foi enviado e está sendo processado.`,
      });
    },
    onError: (error) => {
      console.error('❌ Upload mutation error:', error);
      toast({
        title: "Erro no Upload",
        description: "Falha ao enviar o arquivo. Tente novamente.",
        variant: "destructive"
      });
    }
  });
}

export function useDeleteKnowledgeFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: KnowledgeFile) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('agent-knowledge')
        .remove([file.storage_path]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('agent_knowledge_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      return file;
    },
    onSuccess: (deletedFile) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files', deletedFile.agent_category] });
      toast({
        title: "Arquivo Removido",
        description: `${deletedFile.file_name} foi removido da base de conhecimento.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao Remover",
        description: "Falha ao remover o arquivo. Tente novamente.",
        variant: "destructive"
      });
    }
  });
}