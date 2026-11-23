import { useGetRecruiterAnalytics } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Users, CheckCircle, TrendingUp } from "lucide-react";

export default function RecruiterDashboard() {
  const user = getUser();
  const { data, isLoading } = useGetRecruiterAnalytics({ recruiterId: user?.id }, { query: { enabled: !!user?.id } });

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Recruitment Dashboard</h1>
        <p className="text-muted-foreground">Track your hiring funnel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Jobs</p>
                <h3 className="text-3xl font-bold text-foreground">{data?.totalJobsPosted || 0}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg text-foreground"><Briefcase size={20} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-purple border-primary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary mb-1">Active Jobs</p>
                <h3 className="text-3xl font-bold text-foreground">{data?.activeJobs || 0}</h3>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg text-primary"><TrendingUp size={20} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Applications</p>
                <h3 className="text-3xl font-bold text-foreground">{data?.totalApplications || 0}</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg text-foreground"><Users size={20} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-emerald border-secondary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-secondary mb-1">Hired Candidates</p>
                <h3 className="text-3xl font-bold text-foreground">{data?.studentsPlaced || 0}</h3>
              </div>
              <div className="p-2 bg-secondary/20 rounded-lg text-secondary"><CheckCircle size={20} /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Application Trends</CardTitle></CardHeader>
          <CardContent className="h-64 flex items-end gap-2 pb-4">
            {data?.applicationTrends?.map((trend, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-2 group relative">
                <div className="w-full bg-primary/40 rounded-t-sm group-hover:bg-primary transition-colors" style={{ height: `${Math.max((trend.count / 20) * 100, 5)}%` }} />
                <div className="text-xs text-center text-muted-foreground truncate">{trend.month.substring(0,3)}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Top Skills In Demand</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.topSkills?.map((skill, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{skill.skill}</span>
                    <span className="text-muted-foreground">{skill.count}</span>
                  </div>
                  <div className="w-full bg-background/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-accent h-full rounded-full" style={{ width: `${Math.min((skill.count / 50) * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
