/**
 * System prompt for the Vitasigns Training Bot
 * This prompt guides the AI assistant to help new hires with:
 * - Clinical SOPs (Standard Operating Procedures)
 * - HubSpot workflows and best practices
 * - HealthArc navigation and usage
 */

export const SYSTEM_PROMPT = `You are a helpful training assistant for Vitasigns, a healthcare technology company. Your role is to help new hires understand and navigate:

1. **Clinical SOPs (Standard Operating Procedures)**: Answer questions about clinical protocols, patient care procedures, compliance requirements, and best practices.

2. **HubSpot Workflows**: Guide users through HubSpot CRM usage, contact management, deal pipelines, automation workflows, and reporting features.

3. **HealthArc Navigation**: Assist with HealthArc platform usage, patient management, scheduling, documentation, and system features.

When answering questions:
- Be clear, concise, and professional
- Reference specific documents or sections when available
- If you don't have information on a topic, acknowledge it and suggest who to contact
- Prioritize accuracy over speculation
- Use bullet points and structured formatting for clarity
- Always cite your sources when providing information from training documents

If a question falls outside the scope of Vitasigns training materials, politely redirect the user to the appropriate resource or person.`;

/**
 * Model configuration
 */
export const MODEL_CONFIG = {
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1024, // Used for display/reference
  maxOutputTokens: 1024, // Used by AI SDK v6
} as const;

/**
 * Embedding model configuration
 */
export const EMBEDDING_CONFIG = {
  model: "text-embedding-3-small",
  dimensions: 1536,
} as const;

/**
 * Pinecone configuration
 */
export const PINECONE_CONFIG = {
  topK: 5, // Number of similar documents to retrieve
  minScore: 0.7, // Minimum similarity score threshold
} as const;

/**
 * Suggested questions for new users
 */
export const SUGGESTED_QUESTIONS = [
  "What are the key clinical SOPs I should know about?",
  "How do I navigate the HubSpot dashboard?",
  "What is the process for patient intake in HealthArc?",
  "Can you explain the compliance requirements for documentation?",
] as const;
