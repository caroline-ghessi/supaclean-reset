import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, newMessage } = await req.json();
    
    console.log(`Extracting customer data for conversation: ${conversationId}`);

    // Buscar histórico completo de mensagens da conversa
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('content, sender_type, created_at')
      .eq('conversation_id', conversationId)
      .eq('sender_type', 'customer')
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    // Criar histórico completo incluindo nova mensagem
    const messageHistory = messages.map(msg => msg.content).join('\n');
    const fullHistory = messageHistory + '\n' + newMessage;

    console.log(`Full message history: ${fullHistory}`);

    // Prompt exato do Dify fornecido pelo usuário
    const extractionPrompt = `<instruction>
Sua tarefa é analisar cuidadosamente o histórico de mensagens do cliente e extrair as seguintes informações, preenchendo um objeto JSON de forma estruturada, conforme o schema abaixo.

Considere que as mensagens podem estar divididas em partes, e o cliente pode mencionar um item em uma mensagem e responder sobre ele apenas em outra.

Extraia e preencha os seguintes campos:

- **nome**: Nome completo ou parcial do cliente, se fornecido.
- **email**: Endereço de e-mail válido, contendo "@".
- **whatsapp**: Número de celular com ou sem DDD ou código internacional.
- **cidade** e **estado**: Localização geográfica mencionada.
- **Consumo de energia**: Valor ou faixa mencionada sobre a conta de luz (ex: "R$ 300", "entre R$ 200 e R$ 300").
- **Estado do telhado**: Caso o cliente demonstre interesse em *telha shingle*, identifique se ele menciona se é para "nova construção" ou "reforma".  
  ⚠️ Se a palavra "telhado", "telha" ou "shingle" tiver sido mencionada antes no histórico, e o cliente disser apenas "é uma reforma" ou "é construção nova", você deve entender que ele está respondendo sobre o telhado.
- **Projeto arquitetônico**: Apenas se o cliente estiver falando sobre *steel frame* ou *pisos*. Identifique se ele diz que tem projeto pronto, em elaboração, contratou arquiteto mas ainda não iniciou, ou não tem projeto.
- **Quantidade de piso**: Para pedidos de piso, mantas ou carpetes. Pode ser número em m² ou referência a ambientes (ex: "quero piso para sala e cozinha").
- **Lista de materiais**: Quando o cliente menciona mais de um item a ser cotado, especialmente em contextos como drywall, divisórias, chapas, perfis etc.
- **Produto desejado**: Quando o cliente menciona apenas um item específico, principalmente ferramentas (ex: "parafusadeira 18V Makita").

---

⚠️ ATENÇÃO:
- Você deve considerar o **histórico de mensagens como um todo**, não apenas a última.
- Caso alguma informação não esteja presente, deixe o campo correspondente **em branco**.
- Não interprete ou transforme listas de itens. Copie exatamente como o cliente escreveu, inclusive abreviações ou ordem dos produtos.
- Se houver uma **lista com múltiplos itens**, preencha "Lista de materiais".  
- Se houver **apenas um item específico com marca/modelo**, preencha em "Produto desejado".

---

📤 FORMATO DE RESPOSTA (estruturado):
Retorne **apenas um objeto JSON com os seguintes campos**:

{
  "nome": "",
  "email": "",
  "whatsapp": "",
  "cidade": "",
  "estado": "",
  "Consumo de energia": "",
  "Estado do telhado": "",
  "Projeto arquitetônico": "",
  "Quantidade de piso": "",
  "Lista de materiais": "",
  "Produto desejado": ""
}

---

📌 EXEMPLO 1  
Entrada (mensagens do cliente):

Mensagem 1: "Boa tarde, gostaria de saber sobre telha shingle."  
Mensagem 2: "É para uma reforma."  
Mensagem 3: "Meu nome é Vanessa, sou de Gravataí - RS."

Resposta esperada:

{
  "nome": "Vanessa",
  "email": "",
  "whatsapp": "",
  "cidade": "Gravataí",
  "estado": "RS",
  "Consumo de energia": "",
  "Estado do telhado": "reforma",
  "Projeto arquitetônico": "",
  "Quantidade de piso": "",
  "Lista de materiais": "",
  "Produto desejado": ""
}

---

HISTÓRICO DE MENSAGENS DO CLIENTE:
${fullHistory}
</instruction>`;

    // Chamar Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: extractionPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    let extractedData;
    
    try {
      // Tentar fazer parse do JSON retornado
      const jsonText = data.content[0].text.trim();
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.warn('Failed to parse extracted data as JSON:', parseError);
      extractedData = {};
    }

    console.log(`Extracted data:`, extractedData);

    // Buscar contexto existente
    const { data: existingContext, error: contextError } = await supabase
      .from('project_contexts')
      .select('*')
      .eq('conversation_id', conversationId)
      .single();

    // Mapear dados extraídos para campos do banco
    const contextData = {
      conversation_id: conversationId,
      whatsapp_confirmed: extractedData.whatsapp || null,
      energy_consumption: extractedData['Consumo de energia'] || null,
      roof_status: extractedData['Estado do telhado'] || null,
      project_status: extractedData['Projeto arquitetônico'] || null,
      floor_quantity_m2: extractedData['Quantidade de piso'] ? 
        parseFloat(extractedData['Quantidade de piso'].replace(/[^\d.,]/g, '').replace(',', '.')) || null : null,
      materials_list: extractedData['Lista de materiais'] ? [extractedData['Lista de materiais']] : null,
      desired_product: extractedData['Produto desejado'] || null,
      notes: `Nome: ${extractedData.nome || ''}, Email: ${extractedData.email || ''}, Cidade: ${extractedData.cidade || ''}, Estado: ${extractedData.estado || ''}`.trim()
    };

    // Atualizar ou criar contexto
    if (existingContext) {
      await supabase
        .from('project_contexts')
        .update({
          ...contextData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContext.id);
    } else {
      await supabase
        .from('project_contexts')
        .insert(contextData);
    }

    // Atualizar dados básicos da conversa se disponíveis
    const conversationUpdates = {};
    if (extractedData.nome) conversationUpdates.customer_name = extractedData.nome;
    if (extractedData.email) conversationUpdates.customer_email = extractedData.email;
    if (extractedData.cidade) conversationUpdates.customer_city = extractedData.cidade;
    if (extractedData.estado) conversationUpdates.customer_state = extractedData.estado;

    if (Object.keys(conversationUpdates).length > 0) {
      await supabase
        .from('conversations')
        .update(conversationUpdates)
        .eq('id', conversationId);
    }

    return new Response(JSON.stringify({
      customerData: extractedData,
      contextUpdated: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error extracting customer data:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'extract-customer-data',
      message: 'Failed to extract customer data',
      data: { error: error.message }
    });

    return new Response(JSON.stringify({
      customerData: {},
      contextUpdated: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});