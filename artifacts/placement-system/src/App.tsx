import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getToken, isAuthenticated, getUser } from "@/lib/auth";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";

// Student
import StudentLayout from "@/components/layout/StudentLayout";
import StudentDashboard from "@/pages/student/dashboard";
import StudentResume from "@/pages/student/resume";
import StudentSkills from "@/pages/student/skills";
import StudentInterview from "@/pages/student/interview";
import StudentJobs from "@/pages/student/jobs";
import StudentApplications from "@/pages/student/applications";
import StudentAchievements from "@/pages/student/achievements";
import StudentNotifications from "@/pages/student/notifications";
import StudentProfile from "@/pages/student/profile";

// Recruiter
import RecruiterLayout from "@/components/layout/RecruiterLayout";
import RecruiterDashboard from "@/pages/recruiter/dashboard";
import RecruiterJobs from "@/pages/recruiter/jobs";
import RecruiterCandidates from "@/pages/recruiter/candidates";
import RecruiterApplications from "@/pages/recruiter/applications";
import RecruiterAnalytics from "@/pages/recruiter/analytics";
import RecruiterProfile from "@/pages/recruiter/profile";

// Faculty
import FacultyLayout from "@/components/layout/FacultyLayout";
import FacultyDashboard from "@/pages/faculty/dashboard";
import FacultyStudents from "@/pages/faculty/students";
import FacultyAnalytics from "@/pages/faculty/analytics";
import FacultyProfile from "@/pages/faculty/profile";

const queryClient = new QueryClient();

setAuthTokenGetter(() => getToken());

function ProtectedRoute({ component: Component, layout: Layout, role, ...rest }: any) {
  const user = getUser();
  
  if (!isAuthenticated()) {
    return <Redirect to="/login" />;
  }
  
  if (role && user?.role !== role) {
    return <Redirect to={`/${user?.role}/dashboard`} />;
  }
  
  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Home() {
  const user = getUser();
  if (user) {
    return <Redirect to={`/${user.role}/dashboard`} />;
  }
  return <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentDashboard} />}</Route>
      <Route path="/student/resume">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentResume} />}</Route>
      <Route path="/student/skills">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentSkills} />}</Route>
      <Route path="/student/interview">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentInterview} />}</Route>
      <Route path="/student/jobs">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentJobs} />}</Route>
      <Route path="/student/applications">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentApplications} />}</Route>
      <Route path="/student/achievements">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentAchievements} />}</Route>
      <Route path="/student/notifications">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentNotifications} />}</Route>
      <Route path="/student/profile">{(params) => <ProtectedRoute role="student" layout={StudentLayout} component={StudentProfile} />}</Route>

      {/* Recruiter Routes */}
      <Route path="/recruiter/dashboard">{(params) => <ProtectedRoute role="recruiter" layout={RecruiterLayout} component={RecruiterDashboard} />}</Route>
      <Route path="/recruiter/jobs">{(params) => <ProtectedRoute role="recruiter" layout={RecruiterLayout} component={RecruiterJobs} />}</Route>
      <Route path="/recruiter/candidates">{(params) => <ProtectedRoute role="recruiter" layout={RecruiterLayout} component={RecruiterCandidates} />}</Route>
      <Route path="/recruiter/applications">{(params) => <ProtectedRoute role="recruiter" layout={RecruiterLayout} component={RecruiterApplications} />}</Route>
      <Route path="/recruiter/analytics">{(params) => <ProtectedRoute role="recruiter" layout={RecruiterLayout} component={RecruiterAnalytics} />}</Route>
      <Route path="/recruiter/profile">{(params) => <ProtectedRoute role="recruiter" layout={RecruiterLayout} component={RecruiterProfile} />}</Route>

      {/* Faculty Routes */}
      <Route path="/faculty/dashboard">{(params) => <ProtectedRoute role="faculty" layout={FacultyLayout} component={FacultyDashboard} />}</Route>
      <Route path="/faculty/students">{(params) => <ProtectedRoute role="faculty" layout={FacultyLayout} component={FacultyStudents} />}</Route>
      <Route path="/faculty/analytics">{(params) => <ProtectedRoute role="faculty" layout={FacultyLayout} component={FacultyAnalytics} />}</Route>
      <Route path="/faculty/profile">{(params) => <ProtectedRoute role="faculty" layout={FacultyLayout} component={FacultyProfile} />}</Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
