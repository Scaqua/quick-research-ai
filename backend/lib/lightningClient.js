import dotenv from 'dotenv';

dotenv.config();

const LIGHTNING_API_KEY = process.env.LIGHTNING_API_KEY;
const LIGHTNING_BASE_URL = process.env.LIGHTNING_BASE_URL || 'https://api.lightning.ai/v1';

/**
 * Extract text from PDF buffer
 * Uses Lightning API if available, falls back to pdf-parse
 * 
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<string>} Extracted text
 */
export async function extractTextFromPdf(buffer) {
  try {
    // TODO: Implement Lightning API PDF extraction when available
    // For now, use pdf-parse as fallback (already handled in server.js)
    
    console.log('⚠️  Lightning PDF extraction not yet implemented, using pdf-parse fallback');
    
    // Fallback to pdf-parse (already imported in server.js)
    const pdfParse = await import('pdf-parse');
    const data = await pdfParse.default(buffer);
    return data.text;
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Create embeddings for text using Lightning API
 * 
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
export async function createEmbedding(text) {
  try {
    if (!LIGHTNING_API_KEY) {
      console.warn('⚠️  LIGHTNING_API_KEY not set, using mock embeddings');
      return generateMockEmbedding(text);
    }

    const response = await fetch(`${LIGHTNING_BASE_URL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIGHTNING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        input: text,
        model: 'text-embedding-ada-002' // or Lightning's default embedding model
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lightning API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data.data[0].embedding;
    
  } catch (error) {
    console.error('Embedding error:', error);
    console.warn('⚠️  Falling back to mock embeddings');
    return generateMockEmbedding(text);
  }
}

/**
 * Generate answer using Lightning LLM
 * 
 * @param {string} prompt - Prompt with context and question
 * @returns {Promise<string>} Generated answer
 */
export async function generateAnswer(prompt) {
  try {
    if (!LIGHTNING_API_KEY) {
      console.warn('⚠️  LIGHTNING_API_KEY not set, using mock answer');
      return generateMockAnswer(prompt);
    }

    const response = await fetch(`${LIGHTNING_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LIGHTNING_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful research assistant. Answer questions based on the provided context accurately and concisely.' 
          },
          { role: 'user', content: prompt }
        ],
        model: 'gpt-3.5-turbo', // or Lightning's default model
        temperature: 0.7,
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Lightning API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
    
  } catch (error) {
    console.error('Answer generation error:', error);
    console.warn('⚠️  Falling back to mock answer');
    return generateMockAnswer(prompt);
  }
}

/**
 * Generate mock embedding (for demo purposes)
 * Uses simple hash-based approach for consistent vectors
 */
function generateMockEmbedding(text) {
  const dimension = 384; // Common embedding dimension
  const vector = new Array(dimension);
  
  // Simple deterministic "hash" for consistent embeddings
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Generate pseudo-random but deterministic vector
  for (let i = 0; i < dimension; i++) {
    const seed = hash + i;
    // Simple pseudo-random that's deterministic
    vector[i] = Math.sin(seed) * 0.5 + Math.cos(seed * 0.7) * 0.5;
  }
  
  // Normalize to unit vector
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

/**
 * Generate mock answer (for demo purposes)
 */
function generateMockAnswer(prompt) {
  const contextMatch = prompt.match(/Context:[\s\S]*?(?=\n\nQuestion:|$)/);
  const questionMatch = prompt.match(/Question:\s*(.+?)(?:\n|$)/);
  
  const contexts = contextMatch ? contextMatch[0] : 'No context provided';
  const question = questionMatch ? questionMatch[1] : 'Unknown question';
  
  return `Based on the provided contexts, I can answer your question about "${question}". ` +
         `[MOCK ANSWER] This is a demonstration response. In production, this would be generated by Lightning AI's LLM. ` +
         `The system has successfully retrieved relevant context from the vector database and would use it to generate an accurate answer.`;
}

export default {
  extractTextFromPdf,
  createEmbedding,
  generateAnswer,
};
