import { useState } from "react";
import { useAnalyzeSkillGap, useListTargetRoles } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Target, CheckCircle, ArrowRight, BookOpen } from "lucide-react";

export default function StudentSkills() {
  const user = getUser();
  const { data: roles } = useListTargetRoles();
  const analyzeMutation = useAnalyzeSkillGap();
  const { toast } = useToast();

  const [targetRole, setTargetRole] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!currentSkills.includes(skillInput.trim())) {
        setCurrentSkills([...currentSkills, skillInput.trim()]);
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setCurrentSkills(currentSkills.filter(s => s !== skill));
  };

  const handleAnalyze = () => {
    const skills = skillInput.trim()
      ? [...new Set([...currentSkills, skillInput.trim()])]
      : currentSkills;
    if (skillInput.trim()) {
      setCurrentSkills(skills);
      setSkillInput("");
    }
    if (!targetRole || skills.length === 0) return;
    analyzeMutation.mutate(
      { data: { studentId: user?.id || 0, targetRole, currentSkills: skills } },
      {
        onSuccess: (data) => setAnalysis(data),
        onError: () => toast({ title: "Error", description: "Failed to analyze skills", variant: "destructive" })
      }
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Skill Gap Analyzer</h1>
        <p className="text-muted-foreground">Find out what skills you need for your dream role.</p>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Role</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {(roles ?? ["Data Scientist", "AI Engineer", "Software Engineer", "Full Stack Developer"]).map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Skills (Press Enter)</Label>
              <Input 
                placeholder="e.g. React, Python" 
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleAddSkill}
                className="bg-background/50"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {currentSkills.map(skill => (
              <span key={skill} className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-sm flex items-center gap-1">
                {skill}
                <button onClick={() => removeSkill(skill)} className="hover:text-primary-foreground">&times;</button>
              </span>
            ))}
          </div>

          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 glow-purple"
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || !targetRole || currentSkills.length === 0}
          >
            {analyzeMutation.isPending ? "Analyzing..." : "Analyze Skill Gap"}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <div className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-4 p-6 glass-card-purple border-primary/20 rounded-xl">
            <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center flex-shrink-0">
              <span className="text-2xl font-bold text-primary">{analysis.readinessPercentage}%</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Role Readiness</h2>
              <p className="text-muted-foreground">Based on your current skill set against industry requirements for {analysis.targetRole}.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="glass-card-emerald border-secondary/20">
              <CardHeader className="pb-2"><CardTitle className="text-secondary">Matching Skills</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchingSkills?.map((s: string) => (
                    <span key={s} className="px-2 py-1 rounded text-xs bg-secondary/10 text-secondary border border-secondary/20">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-accent/20">
              <CardHeader className="pb-2"><CardTitle className="text-accent">Missing Skills</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingSkills?.map((s: string) => (
                    <span key={s} className="px-2 py-1 rounded text-xs bg-accent/10 text-accent border border-accent/20">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen size={18}/> Learning Roadmap</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {analysis.learningRoadmap?.map((step: any, i: number) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold flex-shrink-0 border border-primary/30">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{step.description}</h4>
                    <p className="text-sm text-muted-foreground">{step.duration}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
