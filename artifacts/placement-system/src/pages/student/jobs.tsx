import { useListJobs, useCreateApplication } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, DollarSign, Clock, Building2, Search } from "lucide-react";
import { useState } from "react";

export default function StudentJobs() {
  const { data, isLoading, refetch } = useListJobs({ limit: 50 });
  const applyMutation = useCreateApplication();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const handleApply = (jobId: number) => {
    applyMutation.mutate(
      { data: { jobId } },
      {
        onSuccess: () => {
          toast({ title: "Application Submitted", description: "You have successfully applied for this job." });
          refetch();
        },
        onError: () => toast({ title: "Error", description: "Could not submit application", variant: "destructive" })
      }
    );
  };

  const jobs = data?.jobs?.filter(j => 
    j.jobRole.toLowerCase().includes(search.toLowerCase()) || 
    j.companyName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Board</h1>
          <p className="text-muted-foreground">Discover and apply to open positions.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search role or company..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 rounded-xl glass-card animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map(job => (
            <Card key={job.id} className="glass-card hover:glow-purple transition-all border-border/50 flex flex-col h-full">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-12 h-12 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Building2 size={24} className="text-primary" />
                  </div>
                  <Badge variant={job.isActive ? "default" : "secondary"} className={job.isActive ? "bg-secondary text-secondary-foreground" : ""}>
                    {job.isActive ? "Active" : "Closed"}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{job.jobRole}</CardTitle>
                <div className="text-muted-foreground font-medium">{job.companyName}</div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <MapPin size={16} className="text-muted-foreground" /> {job.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <DollarSign size={16} className="text-muted-foreground" /> {job.packageLpa} LPA
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <Clock size={16} className="text-muted-foreground" /> Deadline: {new Date(job.deadline).toLocaleDateString()}
                </div>
                {job.requiredSkills && (
                  <div className="flex flex-wrap gap-1 mt-4">
                    {job.requiredSkills.slice(0,3).map(skill => (
                      <span key={skill} className="px-2 py-0.5 text-xs rounded bg-white/5 border border-white/10">{skill}</span>
                    ))}
                    {job.requiredSkills.length > 3 && <span className="px-2 py-0.5 text-xs text-muted-foreground">+{job.requiredSkills.length-3}</span>}
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t border-border/50">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" 
                  onClick={() => handleApply(job.id)}
                  disabled={!job.isActive}
                >
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No jobs found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
