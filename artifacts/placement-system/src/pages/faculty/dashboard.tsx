import { useGetAnalyticsDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, GraduationCap, DollarSign } from "lucide-react";

export default function FacultyDashboard() {
  const { data, isLoading } = useGetAnalyticsDashboard();

  if (isLoading) {
    return <div className="text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Department Overview</h1>
        <p className="text-muted-foreground">High-level placement analytics for your department.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card-purple border-primary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary mb-1">Total Students</p>
                <h3 className="text-3xl font-bold text-foreground">{data?.totalStudents || 0}</h3>
              </div>
              <div className="p-2 bg-primary/20 rounded-lg text-primary"><Users size={20} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-emerald border-secondary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-secondary mb-1">Placement Rate</p>
                <h3 className="text-3xl font-bold text-foreground">{data?.placementRate || 0}%</h3>
              </div>
              <div className="p-2 bg-secondary/20 rounded-lg text-secondary"><GraduationCap size={20} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-accent/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-accent mb-1">Total Jobs</p>
                <h3 className="text-3xl font-bold text-foreground">{data?.totalJobs || 0}</h3>
              </div>
              <div className="p-2 bg-accent/20 rounded-lg text-accent"><Briefcase size={20} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Avg Package</p>
                <h3 className="text-3xl font-bold text-foreground">{data?.averagePackage || 0}L</h3>
              </div>
              <div className="p-2 bg-white/10 rounded-lg text-foreground"><DollarSign size={20} /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Branch Wise Placement</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.departmentStats?.map((stat, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{stat.branch}</span>
                    <span className="text-muted-foreground">{stat.rate}% ({stat.count} placed)</span>
                  </div>
                  <div className="w-full bg-background/50 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: `${stat.rate}%` }} />
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
