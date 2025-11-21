import { createEmbedding } from './lightningClient.js';
import { saveDocument } from './sanityClient.js';
import { upsertVector } from './redisClient.js';

/**
 * Ingest a document: extract → embed → store
 * 
 * @param {string} text - Document text content
 * @param {string} source - Source identifier
 * @returns {Promise<Object>} Result with sanityId and redisId
 */
export async function ingestDocument(text, source = 'unknown') {
  try {
    console.log(`📄 Ingesting document from: ${source}`);
    
    // 1. Create title and snippet
    const title = text.split('\n')[0].substring(0, 100) || 'Untitled';
    const contentSnippet = text.substring(0, 200) + (text.length > 200 ? '...' : '');
    
    // 2. Save to Sanity
    console.log('💾 Saving to Sanity...');
    const sanityDoc = await saveDocument({
      title,
      contentSnippet,
      fullText: text,
      source,
    });
    
    // 3. Create embedding
    console.log('🧠 Creating embedding...');
    const embedding = await createEmbedding(text);
    
    // 4. Store vector in Redis
    console.log('🔍 Storing vector in Redis...');
    const redisResult = await upsertVector(sanityDoc._id, embedding, {
      title,
      source,
      snippet: contentSnippet,
    });
    
    console.log('✅ Document ingested successfully');
    
    return {
      sanityId: sanityDoc._id,
      redisId: redisResult.id,
      title,
    };
    
  } catch (error) {
    console.error('Ingest pipeline error:', error);
    throw new Error(`Failed to ingest document: ${error.message}`);
  }
}

export default { ingestDocument };
