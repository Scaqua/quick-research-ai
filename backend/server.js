import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import { ingestDocument } from './lib/ingest.js';
import { queryKnowledge } from './lib/query.js';
import { startParallelWorkflow } from './lib/parallelClient.js';

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * POST /api/ingest
 * Accepts file (PDF) or text
 * Steps: extract text → create embeddings → save to Sanity → insert vector into RedisVL
 * Returns: { status, sanityId, redisId }
 */
app.post('/api/ingest', upload.single('file'), async (req, res) => {
  try {
    let text = '';
    let source = '';

    if (req.file) {
      // File upload
      source = req.file.originalname;
      const buffer = req.file.buffer;
      
      if (req.file.mimetype === 'application/pdf') {
        // Will use pdf-parse or Lightning API
        const pdfParse = await import('pdf-parse');
        const data = await pdfParse.default(buffer);
        text = data.text;
      } else if (req.file.mimetype === 'text/plain') {
        text = buffer.toString('utf-8');
      } else {
        return res.status(400).json({ error: 'Unsupported file type. Use PDF or TXT.' });
      }
    } else if (req.body.text) {
      // Text paste
      text = req.body.text;
      source = 'pasted_text';
    } else {
      return res.status(400).json({ error: 'No file or text provided' });
    }

    if (!text.trim()) {
      return res.status(400).json({ error: 'Empty content' });
    }

    // Ingest the document
    const result = await ingestDocument(text, source);

    res.json({
      status: 'ingest_success',
      sanityId: result.sanityId,
      redisId: result.redisId,
      message: 'Document ingested and vectorized successfully'
    });

  } catch (error) {
    console.error('Ingest error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to ingest document',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/query
 * Accepts: { q: "user question" }
 * Steps: query RedisVL for top 3 vectors → call LLM with contexts
 * Returns: { answer, contexts: [{text, score}] }
 */
app.post('/api/query', async (req, res) => {
  try {
    const { q } = req.body;

    if (!q || typeof q !== 'string' || !q.trim()) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const result = await queryKnowledge(q.trim());

    res.json({
      answer: result.answer,
      contexts: result.contexts
    });

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process query',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/parallel/start
 * Triggers Parallel Web Agent workflow
 * Returns: { workflowId, status }
 */
app.post('/api/parallel/start', async (req, res) => {
  try {
    const result = await startParallelWorkflow(req.body);
    res.json(result);
  } catch (error) {
    console.error('Parallel workflow error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to start workflow',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 MAJ+ Backend running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`\n⚙️  Environment:`);
  console.log(`   - Sanity: ${process.env.SANITY_PROJECT_ID ? '✓' : '✗'}`);
  console.log(`   - Redis: ${process.env.REDIS_URL ? '✓' : '✗'}`);
  console.log(`   - Lightning: ${process.env.LIGHTNING_API_KEY ? '✓' : '✗'}`);
  console.log(`   - Parallel: ${process.env.PARALLEL_API_KEY ? '✓' : '✗'}\n`);
});
