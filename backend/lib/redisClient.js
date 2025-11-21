import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;

/**
 * Initialize Redis connection
 */
async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));

  await redisClient.connect();
  console.log('✓ Connected to Redis');
  
  return redisClient;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Store a vector with metadata
 * @param {string} id - Document ID
 * @param {number[]} vector - Embedding vector
 * @param {Object} metadata - Additional metadata
 */
export async function upsertVector(id, vector, metadata = {}) {
  try {
    const client = await getRedisClient();
    
    const key = `doc:${id}`;
    const value = JSON.stringify({
      vector,
      metadata,
      timestamp: Date.now(),
    });

    await client.set(key, value);
    console.log(`✓ Stored vector for: ${id}`);
    
    return { id, key };
  } catch (error) {
    console.error('Redis upsert error:', error);
    throw new Error(`Failed to store vector: ${error.message}`);
  }
}

/**
 * Query top K similar vectors
 * Simple implementation using cosine similarity
 * For production, use RedisVL or Redis vector search
 * 
 * @param {number[]} queryVector - Query embedding
 * @param {number} k - Number of results to return
 * @returns {Promise<Array>} Top K results with scores
 */
export async function queryTopK(queryVector, k = 3) {
  try {
    const client = await getRedisClient();
    
    // Get all document keys
    const keys = await client.keys('doc:*');
    
    if (keys.length === 0) {
      console.warn('No vectors found in Redis');
      return [];
    }

    // Calculate similarities for all documents
    const similarities = [];
    
    for (const key of keys) {
      const data = await client.get(key);
      if (!data) continue;
      
      const parsed = JSON.parse(data);
      const similarity = cosineSimilarity(queryVector, parsed.vector);
      
      similarities.push({
        id: key.replace('doc:', ''),
        score: similarity,
        metadata: parsed.metadata,
      });
    }

    // Sort by similarity (descending) and return top K
    similarities.sort((a, b) => b.score - a.score);
    const topK = similarities.slice(0, k);
    
    console.log(`✓ Found ${topK.length} similar documents`);
    return topK;
    
  } catch (error) {
    console.error('Redis query error:', error);
    throw new Error(`Failed to query vectors: ${error.message}`);
  }
}

/**
 * Delete a vector
 */
export async function deleteVector(id) {
  try {
    const client = await getRedisClient();
    const key = `doc:${id}`;
    await client.del(key);
    console.log(`✓ Deleted vector: ${id}`);
  } catch (error) {
    console.error('Redis delete error:', error);
    throw new Error(`Failed to delete vector: ${error.message}`);
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    console.log('✓ Redis connection closed');
  }
}

export default { upsertVector, queryTopK, deleteVector, closeRedis };
