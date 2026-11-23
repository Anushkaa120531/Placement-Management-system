export type UserRole = "student" | "faculty" | "recruiter";
export interface AuthUser { id: number; name: string; email: string; role: UserRole; department?: string; company?: string; }

export function getToken(): string | null { 
  return localStorage.getItem("placement_token"); 
}

export function getUser(): AuthUser | null { 
  const u = localStorage.getItem("placement_user"); 
  return u ? JSON.parse(u) : null; 
}

export function setAuth(token: string, user: AuthUser) { 
  localStorage.setItem("placement_token", token); 
  localStorage.setItem("placement_user", JSON.stringify(user)); 
}

export function clearAuth() { 
  localStorage.removeItem("placement_token"); 
  localStorage.removeItem("placement_user"); 
}

export function isAuthenticated(): boolean { 
  return !!getToken() && !!getUser(); 
}
