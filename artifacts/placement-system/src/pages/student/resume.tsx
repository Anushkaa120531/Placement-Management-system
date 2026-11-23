import { useState, useRef } from "react";
import { useAnalyzeResume, useGetStudentResume } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle, AlertTriangle, Lightbulb, Upload, X, FileUp } from "lucide-react";

async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  const workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).href;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  return fullText.trim();
}

export default function StudentResume() {
  const user = getUser();
  const { data: previousAnalysis } = useGetStudentResume(user?.id || 0, {
    query: { enabled: !!user?.id },
  });
  const analyzeMutation = useAnalyzeResume();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [targetRole, setTargetRole] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [analysis, setAnalysis] = useState(previousAnalysis);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({ title: "Invalid file", description: "Please upload a PDF file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "PDF must be smaller than 5MB.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setIsExtracting(true);
    try {
      const text = await extractTextFromPDF(file);
      setExtractedText(text);
      if (text.length < 50) {
        toast({
          title: "Low text content",
          description: "The PDF appears to have very little readable text. Make sure it's not a scanned image.",
          variant: "destructive",
        });
      } else {
        toast({ title: "PDF loaded", description: `Extracted ${text.split(/\s+/).length} words from your resume.` });
      }
    } catch {
      toast({ title: "Failed to read PDF", description: "Could not extract text. Try a different PDF.", variant: "destructive" });
      setSelectedFile(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setExtractedText("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = () => {
    if (!extractedText) return;
    analyzeMutation.mutate(
      { data: { content: extractedText, studentId: user?.id || 0, targetRole } },
      {
        onSuccess: (data) => {
          setAnalysis(data as any);
          toast({ title: "Analysis Complete", description: "Your resume has been analyzed successfully." });
        },
        onError: () =>
          toast({ title: "Error", description: "Failed to analyze resume", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Resume ATS Analyzer</h1>
        <p className="text-muted-foreground">Upload your resume PDF to get an ATS compatibility score and optimization tips.</p>
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} className="text-primary" /> Analyze Your Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Target Role <span className="text-muted-foreground text-xs font-normal">(optional — improves accuracy)</span></Label>
            <Input
              placeholder="e.g. Software Engineer, Data Scientist"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="bg-background/50 border-border/50"
            />
          </div>

          {/* Upload area */}
          {!selectedFile ? (
            <div
              className="border-2 border-dashed border-border/60 hover:border-primary/50 rounded-xl p-10 text-center cursor-pointer transition-colors group"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <FileUp size={26} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Click to upload your resume</p>
                  <p className="text-sm text-muted-foreground mt-1">PDF format only · Max 5MB</p>
                </div>
                <Button type="button" variant="outline" size="sm" className="mt-2 border-primary/40 text-primary hover:bg-primary/10">
                  <Upload size={14} className="mr-2" /> Choose PDF
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/10 border border-primary/20">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                  {extractedText && ` · ${extractedText.split(/\s+/).length} words extracted`}
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {isExtracting && (
            <p className="text-sm text-primary animate-pulse flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Extracting text from PDF...
            </p>
          )}

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-purple"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !extractedText || isExtracting}
          >
            {analyzeMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle size={16} /> Analyze Resume
              </span>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="glass-card-purple border-primary/20 md:col-span-2">
            <CardContent className="pt-6 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 mb-4">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(124,58,237,0.15)" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke="rgba(124,58,237,0.9)" strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(analysis.atsScore / 100) * 339} 339`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-primary">{analysis.atsScore}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>
              <div className="text-muted-foreground uppercase tracking-widest text-sm font-semibold">ATS Match Score</div>
              <div className="text-xs text-muted-foreground mt-1">
                {analysis.atsScore >= 80 ? "Excellent — ATS optimized" : analysis.atsScore >= 60 ? "Good — minor improvements needed" : "Needs improvement"}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card-emerald border-secondary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-secondary flex items-center gap-2 text-lg">
                <CheckCircle size={18} /> Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths?.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-foreground flex gap-2 items-start">
                    <span className="text-secondary mt-0.5 flex-shrink-0">✓</span> {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card border-accent/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-accent flex items-center gap-2 text-lg">
                <AlertTriangle size={18} /> Missing Keywords
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.missingKeywords?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((kw: string, i: number) => (
                    <span key={i} className="px-2 py-1 rounded text-xs bg-accent/10 text-accent border border-accent/20">
                      {kw}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary">All key terms found!</p>
              )}
            </CardContent>
          </Card>

          {analysis.weaknesses?.length > 0 && (
            <Card className="glass-card border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                  <AlertTriangle size={18} /> Weaknesses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-foreground flex gap-2 items-start">
                      <span className="text-destructive mt-0.5 flex-shrink-0">✗</span> {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className={`glass-card border-border/50 ${analysis.weaknesses?.length > 0 ? "" : "md:col-span-2"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-primary flex items-center gap-2 text-lg">
                <Lightbulb size={18} /> Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.suggestions?.map((s: string, i: number) => (
                  <li key={i} className="text-sm text-foreground flex gap-2 items-start">
                    <span className="text-primary mt-0.5 flex-shrink-0">→</span> {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
