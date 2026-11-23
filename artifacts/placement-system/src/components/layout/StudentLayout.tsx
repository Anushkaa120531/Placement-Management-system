import { Link, useLocation } from "wouter";
import { getUser, clearAuth } from "@/lib/auth";
import { 
  LayoutDashboard, FileText, Target, Video, Briefcase, 
  Files, Trophy, Bell, User, LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/student/dashboard" },
  { icon: FileText, label: "Resume ATS", href: "/student/resume" },
  { icon: Target, label: "Skill Gap", href: "/student/skills" },
  { icon: Video, label: "Interview Coach", href: "/student/interview" },
  { icon: Briefcase, label: "Jobs", href: "/student/jobs" },
  { icon: Files, label: "Applications", href: "/student/applications" },
  { icon: Trophy, label: "Achievements", href: "/student/achievements" },
  { icon: Bell, label: "Notifications", href: "/student/notifications" },
  { icon: User, label: "Profile", href: "/student/profile" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    setLocation("/login");
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 glass-card border-r border-border/50 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-border/50">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30 text-primary">
              N
            </div>
            Nexus
          </h2>
        </div>
        
        <div className="p-4 border-b border-border/50 glass-card-purple mx-4 mt-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <p className="font-medium text-foreground">{user?.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                  isActive 
                    ? "bg-primary/20 text-primary border border-primary/20 glow-purple" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                }`}>
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="flex-1 p-6 md:p-8 relative">
          {children}
        </div>
      </main>
    </div>
  );
}
