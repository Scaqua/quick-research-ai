import { useState } from "react";
import { Upload, Search, FileText, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type IngestStatus = "idle" | "loading" | "success" | "error";
type QueryStatus = "idle" | "loading" | "success" | "error";

interface Context {
  text: string;
  score: number;
}

interface QueryResult {
  answer: string;
  contexts: Context[];
}

const Index = () => {
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ingestStatus, setIngestStatus] = useState<IngestStatus>("idle");
  const [ingestResult, setIngestResult] = useState<string>("");
  
  const [query, setQuery] = useState("");
  const [queryStatus, setQueryStatus] = useState<QueryStatus>("idle");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf" || file.type === "text/plain") {
        setSelectedFile(file);
        toast.success(`Selected: ${file.name}`);
      } else {
        toast.error("Please select a PDF or text file");
      }
    }
  };

  const handleIngest = async () => {
    if (!textContent && !selectedFile) {
      toast.error("Please provide text or select a file");
      return;
    }

    setIngestStatus("loading");
    setIngestResult("");

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("text", textContent);
      }

      const response = await fetch("http://localhost:3000/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setIngestStatus("success");
        setIngestResult(`Document ingested successfully! Sanity ID: ${data.sanityId}`);
        toast.success("Document ingested and vectorized");
        setTextContent("");
        setSelectedFile(null);
      } else {
        setIngestStatus("error");
        setIngestResult(`Error: ${data.error || "Failed to ingest document"}`);
        toast.error("Ingestion failed");
      }
    } catch (error) {
      setIngestStatus("error");
      setIngestResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}. Make sure backend is running on port 3000.`);
      toast.error("Failed to connect to backend");
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      toast.error("Please enter a query");
      return;
    }

    setQueryStatus("loading");
    setQueryResult(null);

    try {
      const response = await fetch("http://localhost:3000/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ q: query }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setQueryStatus("success");
        setQueryResult(data);
        toast.success("Query completed");
      } else {
        setQueryStatus("error");
        toast.error(`Query failed: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setQueryStatus("error");
      toast.error("Failed to connect to backend");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center space-y-4 py-8">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            MAJ+ Research Agent
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Memory-Augmented Research with Semantic Search & LLM Integration
          </p>
        </header>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Ingest Panel */}
          <Card className="p-6 space-y-6 bg-gradient-surface border-border/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Ingest Documents</h2>
                <p className="text-sm text-muted-foreground">Upload PDF or paste text content</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload File</label>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileSelect}
                    className="cursor-pointer bg-secondary/50 border-border/50"
                  />
                  {selectedFile && (
                    <div className="mt-2 text-sm text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {selectedFile.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center text-muted-foreground text-sm">or</div>

              <div>
                <label className="block text-sm font-medium mb-2">Paste Text</label>
                <Textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste your research text here..."
                  className="min-h-[200px] bg-secondary/50 border-border/50 font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleIngest}
                disabled={ingestStatus === "loading"}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow-primary transition-all"
              >
                {ingestStatus === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Ingest Document
                  </>
                )}
              </Button>

              {ingestResult && (
                <div className={`p-4 rounded-lg border ${
                  ingestStatus === "success" 
                    ? "bg-primary/10 border-primary/30 text-primary" 
                    : "bg-destructive/10 border-destructive/30 text-destructive"
                }`}>
                  <div className="flex items-start gap-2">
                    {ingestStatus === "success" ? (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-mono">{ingestResult}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Query Panel */}
          <Card className="p-6 space-y-6 bg-gradient-surface border-border/50 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Search className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Query Knowledge</h2>
                <p className="text-sm text-muted-foreground">Semantic search with LLM answers</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Your Question</label>
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="min-h-[120px] bg-secondary/50 border-border/50"
                />
              </div>

              <Button
                onClick={handleQuery}
                disabled={queryStatus === "loading"}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground shadow-glow-accent transition-all"
              >
                {queryStatus === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Search & Answer
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Results Section */}
        {queryResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Answer */}
            <Card className="p-6 bg-gradient-surface border-primary/30 backdrop-blur">
              <h3 className="text-lg font-bold mb-4 text-primary">Answer</h3>
              <p className="text-foreground leading-relaxed">{queryResult.answer}</p>
            </Card>

            {/* Contexts */}
            {queryResult.contexts && queryResult.contexts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-muted-foreground">Retrieved Contexts</h3>
                {queryResult.contexts.map((context, idx) => (
                  <Card key={idx} className="p-4 bg-card/50 border-border/30">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <span className="text-xs font-mono text-muted-foreground">Context {idx + 1}</span>
                      <span className="text-xs font-mono text-accent">
                        Score: {context.score.toFixed(3)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono leading-relaxed">
                      {context.text}
                    </p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
