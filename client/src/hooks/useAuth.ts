import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const token = localStorage.getItem('authToken');
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: !!token, // Only run query if token exists
    queryFn: async () => {
      if (!token) return null;
      
      const res = await fetch("/api/auth/user", {
        headers: {
          Authorization: token,
        },
        credentials: "include",
      });
      
      if (!res.ok) {
        localStorage.removeItem('authToken'); // Clean up invalid token
        throw new Error('Authentication failed');
      }
      
      return res.json();
    }
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !!token,
  };
}
