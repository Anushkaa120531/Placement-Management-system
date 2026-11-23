import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useRegister } from "@workspace/api-client-react";
import { setAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Info, AlertCircle } from "lucide-react";

const FREE_DOMAINS = new Set([
  "gmail.com","yahoo.com","yahoo.in","yahoo.co.in","hotmail.com","outlook.com",
  "live.com","icloud.com","protonmail.com","zoho.com","aol.com","ymail.com",
  "rediffmail.com","mail.com","gmx.com","inbox.com","fastmail.com","tutanota.com",
]);

function isCompanyEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase();
  return !!domain && !FREE_DOMAINS.has(domain);
}

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "faculty" | "recruiter">("student");
  const [department, setDepartment] = useState("");
  const [company, setCompany] = useState("");
  const [facultyCode, setFacultyCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "recruiter" && !isCompanyEmail(email)) {
      toast({ title: "Invalid Email", description: "Recruiters must register with a company email address (e.g. name@company.com). Free email providers like Gmail, Yahoo, and Outlook are not accepted.", variant: "destructive" });
      return;
    }
    registerMutation.mutate(
      {
        data: {
          name,
          email,
          password,
          role,
          ...(role === "student" || role === "faculty" ? { department } : {}),
          ...(role === "recruiter" ? { company } : {}),
          ...(role === "faculty" ? { facultyCode: facultyCode.trim().toUpperCase() } : {}),
        },
      },
      {
        onSuccess: (data) => {
          setAuth(data.token, data.user);
          setLocation(`/${data.user.role}/dashboard`);
          toast({ title: "Registration Successful", description: `Welcome, ${data.user.name}` });
        },
        onError: (err: any) => {
          const msg = err?.data?.error || err?.message || "Could not create account";
          toast({ title: "Registration Failed", description: msg, variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-card p-8 rounded-2xl w-full max-w-md relative z-10 glow-purple border-primary/20">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
              <GraduationCap size={24} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground text-sm">Join the placement portal</p>
        </div>

        <Tabs defaultValue="student" onValueChange={(v) => { setRole(v as any); setFacultyCode(""); }} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full bg-background/50 border border-border/50 rounded-lg p-1">
            <TabsTrigger value="student" className="rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Student</TabsTrigger>
            <TabsTrigger value="faculty" className="rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Faculty</TabsTrigger>
            <TabsTrigger value="recruiter" className="rounded-md data-[state=active]:bg-primary/20 data-[state=active]:text-primary">Recruiter</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="bg-background/50 border-border/50" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50 border-border/50" />
          </div>

          {(role === "student" || role === "faculty") && (
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" required value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science" className="bg-background/50 border-border/50" />
            </div>
          )}

          {role === "faculty" && (
            <div className="space-y-2">
              <Label htmlFor="facultyCode" className="flex items-center gap-1.5">
                Faculty Code
                <span className="text-xs text-muted-foreground font-normal">(issued by university admin)</span>
              </Label>
              <Input
                id="facultyCode"
                required
                value={facultyCode}
                onChange={(e) => setFacultyCode(e.target.value.toUpperCase())}
                placeholder="e.g. FAC2024"
                className="bg-background/50 border-border/50 font-mono tracking-widest uppercase"
                maxLength={12}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info size={11} />
                Contact your department administrator to obtain a faculty code.
              </p>
            </div>
          )}

          {role === "recruiter" && (
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Tech Corp" className="bg-background/50 border-border/50" />
            </div>
          )}

          {role === "recruiter" && email && !isCompanyEmail(email) && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
              <span>Company email required. Free providers (Gmail, Yahoo, Outlook…) are not accepted for recruiter accounts.</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background/50 border-border/50" />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-all mt-4"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Creating Account..." : "Register"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
