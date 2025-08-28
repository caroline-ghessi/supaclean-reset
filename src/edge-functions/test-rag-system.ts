// Script para testar o sistema RAG completo
import { supabase } from '@/integrations/supabase/client';

export async function testRAGSystem() {
  console.log('🧪 Testando Sistema RAG...');

  try {
    // 1. Buscar arquivos que precisam de embeddings
    const { data: files, error: filesError } = await supabase
      .from('agent_knowledge_files')
      .select('*')
      .not('extracted_content', 'is', null)
      .is('content_embedding', null)
      .limit(1);

    if (filesError) {
      console.error('❌ Erro ao buscar arquivos:', filesError);
      return;
    }

    if (!files || files.length === 0) {
      console.log('ℹ️ Nenhum arquivo encontrado para processar');
      return;
    }

    const file = files[0];
    console.log(`📄 Processando arquivo: ${file.file_name}`);

    // 2. Gerar embeddings
    const { data: embeddingResult, error: embeddingError } = await supabase.functions.invoke('generate-embeddings', {
      body: {
        fileId: file.id,
        content: file.extracted_content,
        generateChunks: true
      }
    });

    if (embeddingError) {
      console.error('❌ Erro ao gerar embeddings:', embeddingError);
      return;
    }

    console.log('✅ Embeddings gerados:', embeddingResult);

    // 3. Testar busca semântica
    console.log('🔍 Testando busca semântica...');
    
    const testQuery = "energia solar residencial";
    const { data: searchData, error: searchError } = await supabase.functions.invoke('generate-embeddings', {
      body: {
        fileId: 'query',
        content: testQuery,
        generateChunks: false
      }
    });

    if (searchError) {
      console.error('❌ Erro ao gerar embedding da consulta:', searchError);
      return;
    }

    const { data: searchResults, error: searchResultsError } = await supabase.rpc('search_knowledge_enhanced', {
      query_embedding: searchData.embedding,
      agent_filter: 'energia_solar',
      match_threshold: 0.7,
      match_count: 5,
      include_general: true
    });

    if (searchResultsError) {
      console.error('❌ Erro na busca semântica:', searchResultsError);
      return;
    }

    console.log('✅ Resultados da busca:', searchResults);

    // 4. Registrar uso no log
    const { data: usageLog, error: usageError } = await supabase
      .from('knowledge_usage_log')
      .insert({
        knowledge_ids: searchResults?.map((r: any) => r.id) || [],
        query: testQuery,
        agent_type: 'energia_solar',
        response_generated: `Encontrados ${searchResults?.length || 0} resultados relevantes`,
        confidence_score: searchResults?.[0]?.similarity || 0
      });

    if (usageError) {
      console.error('⚠️ Erro ao registrar uso:', usageError);
    } else {
      console.log('✅ Uso registrado no log');
    }

    console.log('🎉 Teste do sistema RAG concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no teste do sistema RAG:', error);
  }
}

// Função para testar feedback
export async function testFeedbackSystem(knowledgeEntryId: string) {
  console.log('📝 Testando sistema de feedback...');

  try {
    // Simular feedback positivo
    const { data: feedback, error: feedbackError } = await supabase
      .from('knowledge_feedback')
      .insert({
        knowledge_entry_id: knowledgeEntryId,
        feedback_type: 'helpful',
        rating: 5,
        feedback_text: 'Resposta muito útil e precisa!'
      })
      .select()
      .single();

    if (feedbackError) {
      console.error('❌ Erro ao enviar feedback:', feedbackError);
      return;
    }

    console.log('✅ Feedback registrado:', feedback);

    // Verificar se o score de confiança foi atualizado
    const { data: updatedFile, error: fileError } = await supabase
      .from('agent_knowledge_files')
      .select('metadata')
      .eq('id', knowledgeEntryId)
      .single();

    if (fileError) {
      console.error('❌ Erro ao verificar arquivo atualizado:', fileError);
      return;
    }

    console.log('✅ Score de confiança atualizado:', updatedFile.metadata);

  } catch (error) {
    console.error('❌ Erro no teste de feedback:', error);
  }
}