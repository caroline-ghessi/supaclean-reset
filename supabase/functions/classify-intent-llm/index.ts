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
    const { message, currentProductGroup, conversationId } = await req.json();
    
    console.log(`Classifying intent for conversation: ${conversationId}`);
    console.log(`Current product group: ${currentProductGroup}`);
    console.log(`Message to classify: ${message}`);

    // Prompt exato do Dify fornecido pelo usuário
    const classificationPrompt = `Você é um agente classificador de intenção da Drystore. Sua missão é analisar a nova mensagem do cliente e identificar corretamente o grupo de produto ou intenção dela. Use apenas o conteúdo da nova mensagem, combinado com o valor atual da variável product_group_atual.

---

⚠️ VALOR ATUAL DA VARIÁVEL:  
product_group_atual: ${currentProductGroup || ''}

---

📩 NOVA MENSAGEM DO CLIENTE:  
${message}

---

REGRAS DE CLASSIFICAÇÃO:

1. Se product_group_atual estiver em branco, ou for igual a **"Saudação"** ou **"Institucional"**, você deve analisar a nova mensagem e **classificar conforme as regras abaixo**.  
Se encontrar uma intenção clara de produto ou serviço, defina o novo valor.

2. Se product_group_atual for diferente de "Saudação" ou "Institucional" (ou seja, já está definido com um grupo de produto), e a nova mensagem **não contiver nenhuma informação clara sobre outra categoria**, então:  
→ **Mantenha o valor anterior e repita ele como resposta.**

3. Só altere o valor se a nova mensagem tiver clara menção a outra categoria de produto (diferente da atual).

---

VALORES PERMITIDOS PARA product_group:

1. Saudação  
"Oi", "Olá", "Bom dia", "Boa tarde", "Boa noite"  
→ product_group: Saudação  
(*Atenção: Se vier com nome ou conteúdo adicional, não classifique como Saudação.*)

2. Institucional  
Perguntas sobre a empresa: "Onde fica?", "Quem são vocês?"  
→ product_group: Institucional

3. Drywall e Divisórias  
"placa", "chapa", "painel", "parede", "fita", etc.  
→ product_group: Drywall e Divisórias

4. Telha Shingle  
"telha", "telhado", "shingle", "telhado dos sonhos", etc.  
→ product_group: Telha Shingle

5. Energia Solar e Backup  
"energia solar", "painel solar", "bateria solar", "backup de energia", "energia quando falta", etc.  
→ product_group: Energia Solar e Backup

6. Steel Frame  
"steel frame", "construção em steel frame", etc.  
→ product_group: Steel Frame

7. Verga Fibra  
"fibra de vidro", "verga fibra", etc.  
→ product_group: Verga Fibra

8. Acabamentos  
"tinta", "textura", "rodapé", "santa luzia", etc.  
→ product_group: Acabamentos

9. Ferramentas  
"parafusadeira", "furadeira", "serra", "bit", "bateria", "Makita", etc.  
(*⚠️ Se "bateria" estiver junto com marcas ou dados técnicos, classifique como Ferramentas*)  
→ product_group: Ferramentas

10. Forros  
"forro", "forros"  
→ product_group: Forros

11. Pisos  
"piso", "mantas", "carpete"  
→ product_group: Pisos

---

❌ Quando **NÃO alterar o valor**:

- Se a nova mensagem for genérica (ex: "quero um orçamento", "me passa seu WhatsApp").
- Se não mencionar produto ou empresa.
- Se for apenas dados pessoais ou nome ("sou João", "meu número é 119...")

→ Nesses casos, **repita o valor anterior de product_group_atual**, exceto se for "Saudação" ou "Institucional".

---

✅ FORMATO DE RESPOSTA:

Responda **apenas com o valor da variável product_group**, sem tags, sem texto extra.

Se for manter o valor anterior, repita ele.  
Se identificar uma nova categoria clara, envie ela.  
Se o valor anterior for "Saudação" ou "Institucional" e a nova mensagem não trouxer nada útil, envie **vazio**.`;

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
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: classificationPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const classifiedProductGroup = data.content[0].text.trim();

    console.log(`Classification result: ${classifiedProductGroup}`);

    // Mapear nomes do Dify para valores do banco
    const productGroupMapping = {
      'Saudação': 'saudacao',
      'Institucional': 'institucional',
      'Drywall e Divisórias': 'drywall_divisorias',
      'Telha Shingle': 'telha_shingle',
      'Energia Solar e Backup': 'energia_solar',
      'Steel Frame': 'steel_frame',
      'Verga Fibra': 'acabamentos', // Mapeado para acabamentos
      'Acabamentos': 'acabamentos',
      'Ferramentas': 'ferramentas',
      'Forros': 'forros',
      'Pisos': 'pisos'
    };

    const finalProductGroup = productGroupMapping[classifiedProductGroup] || 
                             (classifiedProductGroup.toLowerCase() === 'vazio' ? 'indefinido' : 'indefinido');

    // Calcular confidence score baseado na clareza da classificação
    let confidenceScore = 0.8;
    if (classifiedProductGroup === '' || classifiedProductGroup.toLowerCase() === 'vazio') {
      confidenceScore = 0.1;
    } else if (classifiedProductGroup === currentProductGroup) {
      confidenceScore = 0.9; // Alta confiança quando mantém categoria
    }

    // Salvar log de classificação
    await supabase
      .from('classification_logs')
      .insert({
        conversation_id: conversationId,
        message_text: message,
        classified_category: finalProductGroup,
        confidence_score: confidenceScore,
        status: 'success',
        metadata: {
          current_product_group: currentProductGroup,
          anthropic_response: classifiedProductGroup,
          mapped_category: finalProductGroup
        }
      });

    return new Response(JSON.stringify({
      productGroup: finalProductGroup,
      confidence: confidenceScore,
      rawClassification: classifiedProductGroup
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error classifying intent:', error);
    
    await supabase.from('system_logs').insert({
      level: 'error',
      source: 'classify-intent-llm',
      message: 'Failed to classify intent',
      data: { error: error.message }
    });

    // Fallback para classificação anterior
    return new Response(JSON.stringify({
      productGroup: 'indefinido',
      confidence: 0.0,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});