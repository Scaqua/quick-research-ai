# MAJ+ Memory-Augmented Research Agent

A demo-ready implementation of a Memory-Augmented Research Agent with semantic search and LLM integration. Built to be set up and running in under 2 hours.

## 🎯 What This Does

- **Document Ingestion**: Upload PDFs or paste text → extract → create embeddings → store in vector database
- **Semantic Search**: Query documents using natural language → retrieve relevant contexts
- **LLM Integration**: Generate answers using Lightning AI based on retrieved contexts
- **Vector Storage**: RedisVL for fast similarity search
- **Document Management**: Sanity CMS for structured document storage
- **Workflow Automation**: Parallel Web Agent integration for automated ingest pipelines

## 🏗️ Architecture

```
Frontend (React + Vite)
    ↓
Express API Server
    ↓
┌─────────────┬──────────────┬─────────────┐
│   Sanity    │  Lightning   │    Redis    │
│   (Docs)    │  (LLM/Embed) │  (Vectors)  │
└─────────────┴──────────────┴─────────────┘
```

## 🚀 Quick Start (2-Hour Setup)

### Prerequisites

- Node.js 18+ installed
- Redis running (locally or cloud)
- Sanity account (free tier works)
- API keys for Lightning AI (optional, works with mocks)
- Parallel API key (optional)

### Setup Steps

#### 1. Clone and Install (5 min)

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 2. Configure Environment (10 min)

Copy `.env.example` to `.env` in the backend directory:

```bash
cp .env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
PORT=3000

# Sanity (REQUIRED)
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_TOKEN=your_token

# Redis (REQUIRED)
REDIS_URL=redis://localhost:6379

# Lightning AI (optional - works with mocks)
LIGHTNING_API_KEY=your_key_here

# Parallel (optional)
PARALLEL_API_KEY=your_key_here
PARALLEL_WORKFLOW_ID=your_workflow_id
```

#### 3. Set Up Sanity (15 min)

```bash
# Install Sanity CLI
npm install -g @sanity/cli

# Login to Sanity
sanity login

# Create a new project (or use existing)
sanity init

# Copy the project ID to your .env
```

**Create the schema:**

Create a file `sanity/schemas/researchDoc.js`:

```javascript
export default {
  name: 'researchDoc',
  title: 'Research Document',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
    },
    {
      name: 'contentSnippet',
      title: 'Content Snippet',
      type: 'text',
    },
    {
      name: 'fullText',
      title: 'Full Text',
      type: 'text',
    },
    {
      name: 'source',
      title: 'Source',
      type: 'string',
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    },
  ],
}
```

Deploy the schema:

```bash
sanity deploy
```

#### 4. Start Redis (5 min)

**Local Redis:**
```bash
redis-server
```

**Or use Redis Cloud:** (https://redis.com/try-free/)

#### 5. Start the Application (2 min)

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
npm run dev
```

Open http://localhost:8080

## 🎬 3-Minute Demo Script

### Step 1: Ingest a Document (1 min)

1. Open the app at http://localhost:8080
2. In the **Ingest Documents** panel:
   - Paste sample text:
   ```
   Quantum computing uses quantum-mechanical phenomena like superposition 
   and entanglement to perform computations. Quantum computers can solve 
   certain problems exponentially faster than classical computers.
   ```
3. Click **Ingest Document**
4. ✅ Should see: "Document ingested successfully! Sanity ID: xxx"

### Step 2: Query Knowledge (1 min)

1. In the **Query Knowledge** panel:
   - Enter: "What is quantum computing?"
2. Click **Search & Answer**
3. ✅ Should see:
   - Generated answer based on the context
   - Retrieved contexts with relevance scores

### Step 3: Verify Backend (30 sec)

1. Check backend logs - should show:
   ```
   📄 Ingesting document...
   💾 Saving to Sanity...
   🧠 Creating embedding...
   🔍 Storing vector in Redis...
   ✅ Document ingested successfully
   ```

2. Check health endpoint:
   ```bash
   curl http://localhost:3000/health
   ```

### Step 4: Advanced - Parallel Workflow (30 sec)

```bash
curl -X POST http://localhost:3000/api/parallel/start \
  -H "Content-Type: application/json" \
  -d '{"action": "ingest", "data": "test"}'
```

## 📁 Project Structure

```
maj-agent/
├── backend/
│   ├── server.js              # Express API server
│   ├── lib/
│   │   ├── sanityClient.js    # Sanity CMS client
│   │   ├── redisClient.js     # Redis vector operations
│   │   ├── lightningClient.js # Lightning AI integration
│   │   ├── ingest.js          # Document ingestion pipeline
│   │   ├── query.js           # Query & answer pipeline
│   │   └── parallelClient.js  # Parallel workflow integration
│   └── package.json
├── src/
│   ├── pages/
│   │   └── Index.tsx          # Main UI component
│   └── components/            # Shadcn UI components
├── .env.example               # Environment template
└── README.md
```

## 🔌 API Endpoints

### POST /api/ingest
Ingest a document (file or text)

**Request:**
```bash
# With text
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"text": "Your document text here"}'

# With file
curl -X POST http://localhost:3000/api/ingest \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "status": "ingest_success",
  "sanityId": "doc-123",
  "redisId": "doc-123",
  "message": "Document ingested and vectorized successfully"
}
```

### POST /api/query
Query the knowledge base

**Request:**
```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"q": "What is quantum computing?"}'
```

**Response:**
```json
{
  "answer": "Based on the provided contexts, quantum computing...",
  "contexts": [
    {
      "text": "Quantum computing uses...",
      "score": 0.92
    }
  ]
}
```

### POST /api/parallel/start
Start a Parallel workflow

**Request:**
```bash
curl -X POST http://localhost:3000/api/parallel/start \
  -H "Content-Type: application/json" \
  -d '{"action": "ingest", "document": "..."}'
```

## 🔧 Configuration

### Mock Mode (No API Keys)

The system works with mock implementations when API keys are not configured:

- **Lightning AI**: Uses deterministic hash-based embeddings and template answers
- **Parallel**: Returns mock workflow status
- **Redis**: Simple cosine similarity search

This allows immediate demo without external dependencies.

### Production Mode

For production use:

1. Add real Lightning AI API key → `LIGHTNING_API_KEY`
2. Configure Parallel workflow → `PARALLEL_API_KEY` and `PARALLEL_WORKFLOW_ID`
3. Use Redis Cloud or Redis Stack for vector search
4. Set `NODE_ENV=production`

## 🧪 Testing

### Manual Tests

```bash
# Health check
curl http://localhost:3000/health

# Ingest test
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"text": "Test document about AI and machine learning"}'

# Query test
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"q": "What is AI?"}'
```

### Verify Data

**Check Sanity:**
```bash
# Using Sanity CLI
sanity documents query '*[_type == "researchDoc"]'
```

**Check Redis:**
```bash
redis-cli
> KEYS doc:*
> GET doc:your-id-here
```

## 🚨 Troubleshooting

### Backend won't start

1. Check Node.js version: `node --version` (should be 18+)
2. Verify dependencies: `cd backend && npm install`
3. Check `.env` file exists in backend directory

### "Failed to connect to backend"

1. Ensure backend is running on port 3000
2. Check backend logs for errors
3. Verify CORS is not blocking requests

### Sanity errors

1. Verify `SANITY_PROJECT_ID` in `.env`
2. Check token permissions (needs write access)
3. Ensure schema is deployed: `sanity deploy`

### Redis connection issues

1. Check Redis is running: `redis-cli ping` (should return "PONG")
2. Verify `REDIS_URL` in `.env`
3. Check Redis logs

### No search results

1. First ingest at least one document
2. Check backend logs for embedding creation
3. Verify Redis contains vectors: `redis-cli KEYS doc:*`

## 📚 Next Steps

### Immediate Improvements

1. **Add Authentication**: Protect ingest endpoint
2. **Batch Ingestion**: Process multiple documents
3. **Better Chunking**: Split large documents into semantic chunks
4. **Caching**: Cache frequent queries
5. **Rate Limiting**: Add rate limits to API endpoints

### Production Enhancements

1. **Use RedisVL**: Leverage native vector search capabilities
2. **Real Lightning API**: Replace mock implementations
3. **Error Recovery**: Add retry logic and circuit breakers
4. **Monitoring**: Add logging, metrics, and alerts
5. **Testing**: Add unit and integration tests
6. **Docker**: Containerize for easy deployment

## 📖 API Documentation

### Lightning AI Integration

If using real Lightning API, update `lightningClient.js`:

```javascript
// Example Lightning API call structure
const response = await fetch(`${LIGHTNING_BASE_URL}/embeddings`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LIGHTNING_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: inputText,
    model: 'your-model-name',
  }),
});
```

### Parallel Web Agent Integration

Update `parallelClient.js` with actual Parallel API:

```javascript
const response = await fetch(`${PARALLEL_API_URL}/workflows/${PARALLEL_WORKFLOW_ID}/run`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${PARALLEL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(workflowPayload),
});
```

## 🤝 Contributing

This is a demo scaffold. Feel free to:

- Add tests
- Improve error handling
- Optimize performance
- Add features

## 📄 License

MIT License - feel free to use for demos, prototypes, or production apps.

---

**Questions?** Check the inline code comments for implementation details.

**Need Help?** The system logs are your friend - check backend console for detailed pipeline execution.
