import { useState } from "react";
import { useListStudents } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Target } from "lucide-react";

export default function RecruiterCandidates() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListStudents({ search, limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Candidate Pool</h1>
          <p className="text-muted-foreground">Discover top talent for your organization.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search candidates..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 rounded-xl glass-card animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.students?.map(student => (
            <Card key={student.id} className="glass-card border-border/50 hover:border-secondary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30 text-secondary">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{student.name}</h3>
                      <p className="text-sm text-muted-foreground">{student.department}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                    {student.readinessScore}% Match
                  </Badge>
                </div>
                
                <div className="mb-4 space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {student.skills?.slice(0, 4).map((skill: string) => (
                      <span key={skill} className="px-2 py-0.5 text-xs rounded bg-white/5 border border-white/10 text-foreground/80">{skill}</span>
                    ))}
                    {student.skills?.length > 4 && <span className="px-2 py-0.5 text-xs text-muted-foreground">+{student.skills.length-4}</span>}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-border/50 pt-4 mt-4">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Target size={14}/> ATS: {student.atsScore}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    CGPA: <span className="font-medium text-foreground">{student.cgpa || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!data?.students?.length && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No candidates found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
