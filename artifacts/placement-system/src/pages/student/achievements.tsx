import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, User } from "lucide-react";

export default function StudentAchievements() {
  const { data: readinessData, isLoading: rLoading } = useGetLeaderboard({ type: "readiness" as any });
  const { data: placementData, isLoading: pLoading } = useGetLeaderboard({ type: "placement" as any });

  const renderLeaderboard = (entries: any[], isLoading: boolean, type: string) => {
    if (isLoading) return <div className="h-64 animate-pulse bg-background/50 rounded-lg"></div>;
    
    return (
      <div className="space-y-4">
        {entries?.map((entry, index) => (
          <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border ${index < 3 ? 'glass-card border-primary/20 glow-purple' : 'bg-background/30 border-border/50'}`}>
            <div className="flex-shrink-0 w-8 text-center font-bold text-lg text-muted-foreground">
              {index === 0 ? <Trophy className="text-yellow-500 mx-auto" /> : 
               index === 1 ? <Medal className="text-gray-400 mx-auto" /> : 
               index === 2 ? <Award className="text-amber-600 mx-auto" /> : 
               `#${index + 1}`}
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <User size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground truncate">{entry.name}</p>
              <p className="text-sm text-muted-foreground truncate">{entry.department}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">
                {type === 'readiness' ? `${entry.score}%` : `₹${entry.score} LPA`}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                {type === 'readiness' ? 'Readiness Score' : (entry.placedCompany || 'Not placed')}
              </p>
            </div>
          </div>
        ))}
        {!entries?.length && <div className="text-center text-muted-foreground p-8">No leaderboard data available.</div>}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground">See how you stack up against your peers.</p>
      </div>

      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="readiness">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-background/50">
              <TabsTrigger value="readiness" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Readiness Ranking</TabsTrigger>
              <TabsTrigger value="placement" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Placement Ranking</TabsTrigger>
            </TabsList>
            <TabsContent value="readiness">
              {renderLeaderboard(readinessData as any, rLoading, 'readiness')}
            </TabsContent>
            <TabsContent value="placement">
              {renderLeaderboard(placementData as any, pLoading, 'placement')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
