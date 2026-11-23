import { useGetStudentDashboard } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar, FileText, CheckCircle } from "lucide-react";

export default function StudentDashboard() {
  const user = getUser();
  const { data, isLoading } = useGetStudentDashboard(user?.id || 0, { query: { enabled: !!user?.id } });

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Your placement readiness overview.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card-purple border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-primary font-medium flex items-center gap-2">
              <CheckCircle size={16} /> Readiness Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{data?.readinessScore || 0}%</div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Briefcase size={16} /> Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{data?.activeJobs || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
              <Calendar size={16} /> Upcoming Drives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{data?.upcomingDrives || 0}</div>
          </CardContent>
        </Card>

        <Card className="glass-card-emerald border-secondary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-secondary font-medium flex items-center gap-2">
              <FileText size={16} /> Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{data?.totalApplications || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Skill Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.skillProgress?.map((skill, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{skill.skill}</span>
                  <span className="text-muted-foreground">{skill.level}%</span>
                </div>
                <div className="w-full bg-background/50 h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${skill.level}%` }} />
                </div>
              </div>
            ))}
            {(!data?.skillProgress || data.skillProgress.length === 0) && (
              <div className="text-muted-foreground text-sm">No skills added yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data?.recentActivity?.map((activity, i) => (
              <div key={i} className="flex gap-4 items-start pb-4 border-b border-border/50 last:border-0 last:pb-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <p className="text-foreground text-sm">{activity.description}</p>
                  <p className="text-muted-foreground text-xs">{new Date(activity.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {(!data?.recentActivity || data.recentActivity.length === 0) && (
              <div className="text-muted-foreground text-sm">No recent activity.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
