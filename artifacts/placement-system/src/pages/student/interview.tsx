import { useState } from "react";
import { useGenerateInterviewQuestions, useEvaluateAnswer } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Video, ChevronRight, CheckCircle2 } from "lucide-react";

export default function StudentInterview() {
  const user = getUser();
  const { toast } = useToast();
  const generateMutation = useGenerateInterviewQuestions();
  const evaluateMutation = useEvaluateAnswer();

  const [type, setType] = useState<string>("technical");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);

  const handleStart = () => {
    generateMutation.mutate(
      { data: { interviewType: type as any, count: 5 } },
      {
        onSuccess: (data) => {
          setQuestions(data.questions);
          setCurrentIdx(0);
          setAnswer("");
          setEvaluation(null);
        }
      }
    );
  };

  const handleEvaluate = () => {
    if (!answer) return;
    evaluateMutation.mutate(
      { id: 1, data: { question: questions[currentIdx], answer, interviewType: type } },
      {
        onSuccess: (data) => setEvaluation(data)
      }
    );
  };

  const nextQuestion = () => {
    setCurrentIdx(i => i + 1);
    setAnswer("");
    setEvaluation(null);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Interview Coach</h1>
        <p className="text-muted-foreground">Practice your interview skills with AI feedback.</p>
      </div>

      {!questions.length ? (
        <Card className="glass-card border-primary/20 text-center py-12">
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-4 glow-purple">
              <Video size={32} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Start a Practice Session</h2>
            <div className="w-full max-w-xs space-y-4">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Interview</SelectItem>
                  <SelectItem value="hr">HR / Behavioral</SelectItem>
                  <SelectItem value="aptitude">Aptitude</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full bg-primary" onClick={handleStart} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? "Generating..." : "Start Interview"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-sm font-medium text-muted-foreground">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span className="capitalize">{type} Interview</span>
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-xl leading-relaxed text-foreground">
                {questions[currentIdx]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!evaluation ? (
                <>
                  <Textarea 
                    placeholder="Type your answer here..." 
                    className="min-h-[150px] bg-background/50"
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                  />
                  <Button 
                    className="w-full bg-primary" 
                    onClick={handleEvaluate}
                    disabled={evaluateMutation.isPending || !answer}
                  >
                    {evaluateMutation.isPending ? "Evaluating..." : "Submit Answer"}
                  </Button>
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in">
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Answer:</h4>
                    <p className="text-foreground">{answer}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1 glass-card-purple border-primary/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                      <div className="text-4xl font-bold text-primary mb-1">{evaluation.confidenceScore}%</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Confidence Score</div>
                    </div>
                    <div className="md:col-span-2 glass-card border-border/50 rounded-xl p-4">
                      <h4 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                        <CheckCircle2 size={16} /> AI Feedback
                      </h4>
                      <p className="text-sm text-foreground/90">{evaluation.feedback}</p>
                    </div>
                  </div>

                  {currentIdx < questions.length - 1 ? (
                    <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 glow-emerald" onClick={nextQuestion}>
                      Next Question <ChevronRight size={16} className="ml-2" />
                    </Button>
                  ) : (
                    <Button className="w-full bg-primary glow-purple" onClick={() => setQuestions([])}>
                      Finish Session
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
