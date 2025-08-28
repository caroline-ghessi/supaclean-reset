-- Remove agent_prompt_steps table as we're no longer using steps
-- Each agent will have only one main prompt in the knowledge_base field

DROP TABLE IF EXISTS public.agent_prompt_steps;