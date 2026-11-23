import { useState } from "react";
import { useListApplications, useUpdateApplicationStatus } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const statusColors: Record<string, string> = {
  applied: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shortlisted: "bg-primary/20 text-primary border-primary/30",
  interview_scheduled: "bg-accent/20 text-accent border-accent/30",
  selected: "bg-secondary/20 text-secondary border-secondary/30",
  rejected: "bg-destructive/20 text-destructive border-destructive/30"
};

export default function RecruiterApplications() {
  const user = getUser();
  const [filter, setFilter] = useState("all");
  const { data, isLoading, refetch } = useListApplications({ recruiterId: user?.id, ...(filter !== 'all' ? { status: filter } : {}) });
  const updateStatus = useUpdateApplicationStatus();
  const { toast } = useToast();
  
  const [scheduleData, setScheduleData] = useState({ id: 0, date: "", time: "" });
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const handleStatusUpdate = (id: number, status: string) => {
    updateStatus.mutate(
      { id, data: { status: status as any } },
      {
        onSuccess: () => {
          toast({ title: "Status Updated" });
          refetch();
        }
      }
    );
  };

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    const dateTime = `${scheduleData.date}T${scheduleData.time}:00Z`;
    updateStatus.mutate(
      { id: scheduleData.id, data: { status: "interview_scheduled", interviewDate: dateTime } },
      {
        onSuccess: () => {
          toast({ title: "Interview Scheduled" });
          setIsScheduleOpen(false);
          refetch();
        }
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Applications Review</h1>
        <p className="text-muted-foreground">Manage candidate applications for your jobs.</p>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="bg-background/50 border border-border/50 mb-6 flex flex-wrap h-auto p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">All</TabsTrigger>
          <TabsTrigger value="applied" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400">Applied</TabsTrigger>
          <TabsTrigger value="shortlisted" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Shortlisted</TabsTrigger>
          <TabsTrigger value="interview_scheduled" className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent">Interview</TabsTrigger>
          <TabsTrigger value="selected" className="data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">Selected</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.applications?.map(app => (
            <Card key={app.id} className="glass-card border-border/50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{app.student?.name}</h3>
                    <p className="text-muted-foreground font-medium">{app.job?.jobRole}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-foreground/80">{app.student?.department}</span>
                      <span className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-foreground/80">CGPA: {app.student?.cgpa}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <Badge variant="outline" className={`capitalize px-3 py-1 ${statusColors[app.status]}`}>
                      {app.status.replace("_", " ")}
                    </Badge>
                    
                    <div className="flex gap-2 mt-2">
                      {app.status === 'applied' && (
                        <>
                          <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => handleStatusUpdate(app.id, 'shortlisted')}>Shortlist</Button>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(app.id, 'rejected')}>Reject</Button>
                        </>
                      )}
                      {app.status === 'shortlisted' && (
                        <>
                          <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent/10" onClick={() => { setScheduleData({id: app.id, date: "", time: ""}); setIsScheduleOpen(true); }}>Schedule Interview</Button>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(app.id, 'rejected')}>Reject</Button>
                        </>
                      )}
                      {app.status === 'interview_scheduled' && (
                        <>
                          <Button size="sm" variant="outline" className="border-secondary text-secondary hover:bg-secondary/10" onClick={() => handleStatusUpdate(app.id, 'selected')}>Select</Button>
                          <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => handleStatusUpdate(app.id, 'rejected')}>Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {!data?.applications?.length && (
            <div className="p-12 text-center text-muted-foreground glass-card rounded-xl">
              No applications found for this status.
            </div>
          )}
        </div>
      )}

      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="glass-card border-border/50 text-foreground">
          <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
          <form onSubmit={handleScheduleInterview} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" required value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} className="bg-background/50 border-border/50 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" required value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} className="bg-background/50 border-border/50 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" disabled={updateStatus.isPending}>
              Schedule
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
