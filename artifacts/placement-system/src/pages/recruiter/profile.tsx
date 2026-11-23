import { useState, useEffect } from "react";
import { useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2 } from "lucide-react";

export default function RecruiterProfile() {
  const { data: profile, isLoading } = useGetUserProfile();
  const updateMutation = useUpdateUserProfile();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = () => {
    updateMutation.mutate(
      { data: { name, phone } },
      {
        onSuccess: () => toast({ title: "Profile Updated" }),
        onError: () => toast({ title: "Error", variant: "destructive" })
      }
    );
  };

  if (isLoading) return <div className="animate-pulse h-96 glass-card rounded-xl"></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Recruiter Profile</h1>
        <p className="text-muted-foreground">Manage your organization details.</p>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 items-center mb-8">
            <div className="w-24 h-24 rounded-2xl bg-secondary/20 border border-secondary/50 flex items-center justify-center text-secondary glow-emerald">
              <Building2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">{profile?.company}</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Contact Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} className="bg-background/50 border-border/50" />
            </div>
            
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile?.email} disabled className="bg-background/20 border-border/20 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-background/50 border-border/50" />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 glow-emerald mt-4"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
