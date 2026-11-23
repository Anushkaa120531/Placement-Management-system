import { useGetRecruiterAnalytics } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function RecruiterAnalytics() {
  const user = getUser();
  const { data, isLoading } = useGetRecruiterAnalytics({ recruiterId: user?.id });

  if (isLoading) return <div className="animate-pulse h-96 glass-card rounded-xl"></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground">Detailed insights into your hiring performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Average Package</p>
            <h3 className="text-3xl font-bold text-foreground">{data?.averagePackage} LPA</h3>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Highest Package</p>
            <h3 className="text-3xl font-bold text-secondary">{data?.highestPackage} LPA</h3>
          </CardContent>
        </Card>
        <Card className="glass-card border-border/50">
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Selection Rate</p>
            <h3 className="text-3xl font-bold text-primary">{data?.placementRate}%</h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Hiring Trends</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.hiringTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" stroke="#888888" />
                <YAxis stroke="#888888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader><CardTitle>Top Skills Hired</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.topSkills || []} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#888888" />
                <YAxis dataKey="skill" type="category" stroke="#888888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="count" fill="hsl(var(--secondary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
