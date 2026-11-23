import { useListStudents } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";
import { useState } from "react";

export default function FacultyStudents() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useListStudents({ search, limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Directory</h1>
          <p className="text-muted-foreground">Monitor student progress and readiness.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search students..." 
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
            <Card key={student.id} className="glass-card border-border/50 hover:border-primary/50 transition-colors cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex gap-4 items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
                    <User size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground truncate">{student.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{student.department}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-background/50 rounded-lg p-2 text-center border border-border/50 group-hover:border-primary/20 transition-colors">
                    <div className="text-xs text-muted-foreground mb-1">Readiness</div>
                    <div className="font-bold text-primary">{student.readinessScore}%</div>
                  </div>
                  <div className="bg-background/50 rounded-lg p-2 text-center border border-border/50 group-hover:border-secondary/20 transition-colors">
                    <div className="text-xs text-muted-foreground mb-1">ATS Score</div>
                    <div className="font-bold text-secondary">{student.atsScore}%</div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Badge variant="outline" className={`capitalize ${
                    student.placementStatus === 'placed' ? 'bg-secondary/20 text-secondary border-secondary/30' :
                    student.placementStatus === 'shortlisted' ? 'bg-accent/20 text-accent border-accent/30' :
                    'bg-white/5 text-muted-foreground border-white/10'
                  }`}>
                    {student.placementStatus.replace('_', ' ')}
                  </Badge>
                  {student.placedCompany && (
                    <span className="text-xs text-foreground font-medium truncate max-w-[120px]">
                      @ {student.placedCompany}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {!data?.students?.length && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No students found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
