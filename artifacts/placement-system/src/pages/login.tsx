import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { setAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Briefcase, Users } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "faculty" | "recruiter">("student");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { data: { email, password, role } },
      {
        onSuccess: (data) => {
          setAuth(data.token, data.user);
          setLocation(`/${data.user.role}/dashboard`);
          toast({ title: "Login Successful", description: `Welcome back, ${data.user.name}` });
        },
        onError: (err: any) => {
          toast({ 
            title: "Login Failed", 
            description: err?.message || "Invalid credentials", 
            variant: "destructive" 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="glass-card p-8 rounded-2xl w-full max-w-md relative z-10 glow-purple border-primary/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
              <GraduationCap size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Nexus Portal</h1>
          <p className="text-muted-foreground text-sm">Enter your credentials to continue</p>
        </div>

        <Tabs defaultValue="student" onValueChange={(v) => setRole(v as any)} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full bg-background/50 border border-border/50 rounded-lg p-1">
            <TabsTrigger value="student" className="rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Student
            </TabsTrigger>
            <TabsTrigger value="faculty" className="rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Faculty
            </TabsTrigger>
            <TabsTrigger value="recruiter" className="rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
              Recruiter
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              className="bg-background/50 border-border/50 focus:border-primary/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="bg-background/50 border-border/50 focus:border-primary/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all mt-4"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account? <Link href="/register" className="text-primary hover:underline">Register here</Link>
        </div>
      </div>
    </div>
  );
}
