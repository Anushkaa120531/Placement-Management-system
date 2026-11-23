import { useState, useEffect } from "react";
import { useGetUserProfile, useUpdateUserProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

export default function StudentProfile() {
  const { data: profile, isLoading } = useGetUserProfile();
  const updateMutation = useUpdateUserProfile();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
    }
  }, [profile]);

  const handleSave = () => {
    updateMutation.mutate(
      { data: { name, phone, bio } },
      {
        onSuccess: () => toast({ title: "Profile Updated", description: "Your profile has been saved successfully." }),
        onError: () => toast({ title: "Error", description: "Failed to update profile", variant: "destructive" })
      }
    );
  };

  if (isLoading) return <div className="animate-pulse h-96 glass-card rounded-xl"></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information.</p>
      </div>

      <Card className="glass-card border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary glow-purple">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User size={48} />
                )}
              </div>
              <Button variant="outline" size="sm" className="bg-background/50 border-border/50">Change Avatar</Button>
            </div>

            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} className="bg-background/50 border-border/50" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile?.email} disabled className="bg-background/20 border-border/20 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-background/50 border-border/50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={profile?.department || "Not Set"} disabled className="bg-background/20 border-border/20 text-muted-foreground" />
              </div>

              <div className="space-y-2">
                <Label>Bio / About Me</Label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)} className="bg-background/50 border-border/50 min-h-[100px]" />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full bg-primary hover:bg-primary/90 glow-purple"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
