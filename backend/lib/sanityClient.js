import { createClient } from '@sanity/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'YOUR_PROJECT_ID',
  dataset: process.env.SANITY_DATASET || 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

/**
 * Save a research document to Sanity
 * @param {Object} doc - Document data
 * @param {string} doc.title - Document title
 * @param {string} doc.contentSnippet - Short excerpt
 * @param {string} doc.fullText - Complete text
 * @param {string} doc.source - Source identifier
 * @returns {Promise<Object>} Created document with _id
 */
export async function saveDocument(doc) {
  try {
    const document = {
      _type: 'researchDoc',
      title: doc.title || 'Untitled Document',
      contentSnippet: doc.contentSnippet,
      fullText: doc.fullText,
      source: doc.source,
      createdAt: new Date().toISOString(),
    };

    const result = await client.create(document);
    console.log(`✓ Saved document to Sanity: ${result._id}`);
    return result;
  } catch (error) {
    console.error('Sanity save error:', error);
    throw new Error(`Failed to save document to Sanity: ${error.message}`);
  }
}

/**
 * Get a document by ID
 */
export async function getDocument(docId) {
  try {
    const doc = await client.getDocument(docId);
    return doc;
  } catch (error) {
    console.error('Sanity fetch error:', error);
    throw new Error(`Failed to fetch document: ${error.message}`);
  }
}

/**
 * Query documents
 */
export async function queryDocuments(query) {
  try {
    const results = await client.fetch(query);
    return results;
  } catch (error) {
    console.error('Sanity query error:', error);
    throw new Error(`Failed to query documents: ${error.message}`);
  }
}

export default client;
