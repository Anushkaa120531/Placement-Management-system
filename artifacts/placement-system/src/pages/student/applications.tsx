import { useListApplications } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MapPin, DollarSign } from "lucide-react";

const statusColors: Record<string, string> = {
  applied: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shortlisted: "bg-primary/20 text-primary border-primary/30",
  interview_scheduled: "bg-accent/20 text-accent border-accent/30",
  selected: "bg-secondary/20 text-secondary border-secondary/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30"
};

export default function StudentApplications() {
  const user = getUser();
  const { data, isLoading } = useListApplications({ studentId: user?.id }, { query: { enabled: !!user?.id } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Applications</h1>
        <p className="text-muted-foreground">Track your placement journey.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl glass-card animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.applications?.map(app => (
            <Card key={app.id} className="glass-card border-border/50 overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{app.job?.jobRole}</h3>
                      <div className="text-muted-foreground flex items-center gap-2 mt-1">
                        <Building2 size={16}/> {app.job?.companyName}
                      </div>
                    </div>
                    <Badge variant="outline" className={`capitalize px-3 py-1 ${statusColors[app.status]}`}>
                      {app.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-foreground/80">
                    <span className="flex items-center gap-1"><MapPin size={14} className="text-muted-foreground"/> {app.job?.location}</span>
                    <span className="flex items-center gap-1"><DollarSign size={14} className="text-muted-foreground"/> {app.job?.packageLpa} LPA</span>
                    <span className="flex items-center gap-1"><Calendar size={14} className="text-muted-foreground"/> Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {app.status === 'interview_scheduled' && app.interviewDate && (
                  <div className="bg-accent/10 border-l border-accent/20 p-6 flex flex-col justify-center items-center text-center min-w-[200px]">
                    <p className="text-xs text-accent uppercase font-bold tracking-wider mb-1">Interview Scheduled</p>
                    <p className="font-medium text-foreground">{new Date(app.interviewDate).toLocaleDateString()}</p>
                    <p className="text-sm text-muted-foreground">{new Date(app.interviewDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
          {!data?.applications?.length && (
            <div className="p-12 text-center text-muted-foreground glass-card rounded-xl">
              You haven't applied to any jobs yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
