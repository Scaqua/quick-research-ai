import { createEmbedding, generateAnswer } from './lightningClient.js';
import { queryTopK } from './redisClient.js';
import { getDocument } from './sanityClient.js';

/**
 * Query knowledge base with semantic search
 * 
 * @param {string} question - User's question
 * @param {number} topK - Number of contexts to retrieve
 * @returns {Promise<Object>} Answer and contexts
 */
export async function queryKnowledge(question, topK = 3) {
  try {
    console.log(`🔍 Processing query: "${question}"`);
    
    // 1. Create embedding for the question
    console.log('🧠 Creating query embedding...');
    const queryEmbedding = await createEmbedding(question);
    
    // 2. Search similar vectors in Redis
    console.log('📊 Searching vector database...');
    const similarDocs = await queryTopK(queryEmbedding, topK);
    
    if (similarDocs.length === 0) {
      return {
        answer: 'No relevant documents found. Please ingest some documents first.',
        contexts: [],
      };
    }
    
    // 3. Retrieve full text from Sanity
    console.log('📚 Retrieving document contents...');
    const contexts = [];
    
    for (const doc of similarDocs) {
      try {
        const fullDoc = await getDocument(doc.id);
        contexts.push({
          text: fullDoc.contentSnippet || fullDoc.fullText?.substring(0, 500) || 'No content',
          score: doc.score,
          title: fullDoc.title,
        });
      } catch (error) {
        console.warn(`Could not fetch document ${doc.id}:`, error.message);
        // Use metadata fallback
        contexts.push({
          text: doc.metadata.snippet || 'Content unavailable',
          score: doc.score,
          title: doc.metadata.title || 'Untitled',
        });
      }
    }
    
    // 4. Build prompt with contexts
    const contextText = contexts
      .map((ctx, idx) => `Context ${idx + 1} (relevance: ${ctx.score.toFixed(3)}):\n${ctx.text}`)
      .join('\n\n');
    
    const prompt = `You are a helpful research assistant. Answer the user's question based on the provided contexts.

Context:
${contextText}

Question: ${question}

Provide a clear, concise answer based on the contexts above. If the contexts don't contain enough information, say so.`;

    // 5. Generate answer with LLM
    console.log('🤖 Generating answer...');
    const answer = await generateAnswer(prompt);
    
    console.log('✅ Query completed successfully');
    
    return {
      answer,
      contexts: contexts.map(c => ({ text: c.text, score: c.score })),
    };
    
  } catch (error) {
    console.error('Query pipeline error:', error);
    throw new Error(`Failed to process query: ${error.message}`);
  }
}

export default { queryKnowledge };
