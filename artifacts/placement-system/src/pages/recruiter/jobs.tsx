import { useState } from "react";
import { useListJobs, useCreateJob, useUpdateJob, useDeleteJob, useToggleJobStatus } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, MapPin, DollarSign, Clock, MoreVertical, Edit, Trash2, Power } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function RecruiterJobs() {
  const user = getUser();
  const { data, isLoading, refetch } = useListJobs({ recruiterId: String(user?.id), limit: 100 });
  const createJob = useCreateJob();
  const toggleJob = useToggleJobStatus();
  const deleteJob = useDeleteJob();
  const { toast } = useToast();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: user?.company || "",
    jobRole: "",
    packageLpa: 0,
    location: "",
    eligibilityCriteria: "",
    deadline: "",
    description: "",
    requiredSkills: ""
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createJob.mutate(
      { data: { 
        ...formData, 
        packageLpa: Number(formData.packageLpa),
        requiredSkills: formData.requiredSkills.split(",").map(s => s.trim()).filter(Boolean)
      }},
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Job posted successfully" });
          setIsCreateOpen(false);
          refetch();
        }
      }
    );
  };

  const handleToggle = (id: number) => {
    toggleJob.mutate({ id }, { onSuccess: () => refetch() });
  };

  const handleDelete = (id: number) => {
    if(confirm("Are you sure you want to delete this job?")) {
      deleteJob.mutate({ id }, { onSuccess: () => refetch() });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Management</h1>
          <p className="text-muted-foreground">Create and manage job postings.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 glow-purple">Post New Job</Button>
          </DialogTrigger>
          <DialogContent className="glass-card border-border/50 sm:max-w-[600px] text-foreground">
            <DialogHeader>
              <DialogTitle>Post a New Job</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Job Role</Label>
                  <Input required value={formData.jobRole} onChange={e => setFormData({...formData, jobRole: e.target.value})} className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label>Package (LPA)</Label>
                  <Input type="number" required value={formData.packageLpa || ""} onChange={e => setFormData({...formData, packageLpa: Number(e.target.value)})} className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label>Deadline</Label>
                  <Input type="date" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} className="bg-background/50 border-border/50 [&::-webkit-calendar-picker-indicator]:filter-[invert(1)]" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Required Skills (comma separated)</Label>
                <Input value={formData.requiredSkills} onChange={e => setFormData({...formData, requiredSkills: e.target.value})} className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Eligibility Criteria</Label>
                <Input required value={formData.eligibilityCriteria} onChange={e => setFormData({...formData, eligibilityCriteria: e.target.value})} className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="bg-background/50 border-border/50 min-h-[100px]" />
              </div>
              <Button type="submit" className="w-full bg-primary" disabled={createJob.isPending}>
                {createJob.isPending ? "Posting..." : "Post Job"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-64 glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.jobs?.map(job => (
            <Card key={job.id} className={`glass-card transition-all border-border/50 flex flex-col h-full ${!job.isActive ? 'opacity-70 grayscale-[30%]' : 'hover:glow-purple'}`}>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={job.isActive ? "default" : "secondary"} className={job.isActive ? "bg-primary text-primary-foreground" : ""}>
                    {job.isActive ? "Active" : "Closed"}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><MoreVertical size={16}/></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="glass-card border-border/50 text-foreground">
                      <DropdownMenuItem onClick={() => handleToggle(job.id)} className="cursor-pointer">
                        <Power size={14} className="mr-2"/> {job.isActive ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(job.id)} className="cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 size={14} className="mr-2"/> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-xl">{job.jobRole}</CardTitle>
                <div className="text-muted-foreground font-medium flex items-center gap-1 mt-1">
                  <Briefcase size={14}/> {job.totalApplications} Applications
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <MapPin size={16} className="text-muted-foreground" /> {job.location}
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <DollarSign size={16} className="text-muted-foreground" /> {job.packageLpa} LPA
                </div>
                <div className="flex items-center gap-2 text-sm text-foreground/80">
                  <Clock size={16} className="text-muted-foreground" /> {new Date(job.deadline).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
          {!data?.jobs?.length && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              You haven't posted any jobs yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
