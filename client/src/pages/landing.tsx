import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, BookOpen, BarChart3, CheckCircle, Award, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Landing() {
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);
    
    try {
      const res = await apiRequest("POST", "/api/login", loginForm);
      const data = await res.json();
      
      // Store token in localStorage for demo purposes
      localStorage.setItem('authToken', data.token);
      
      toast({
        title: "Login Successful",
        description: "Welcome to ManufacTMS!",
      });
      
      // Reload to trigger auth check
      window.location.reload();
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  // Demo login section
  const LoginSection = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Login to ManufacTMS</CardTitle>
        <div className="text-sm text-gray-600 text-center space-y-1 bg-blue-50 p-3 rounded">
          <p><strong>Demo Accounts:</strong></p>
          <p>Admin: admin / admin123</p>
          <p>Manager: manager / manager123</p>
          <p>Employee: employee / employee123</p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              data-testid="input-username"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              data-testid="input-password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isLogging}
              data-testid="button-submit"
            >
              {isLogging ? "Signing In..." : "Sign In"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowLogin(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <LoginSection />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <span className="text-xl font-bold text-gray-900">ManufacTMS</span>
            </div>
            <Button
              onClick={() => setShowLogin(true)}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-login"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Manufacturing Training
              <span className="text-blue-600"> Management System</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
              Streamline compliance training, track certifications, and maintain audit-ready records 
              for your manufacturing operations with our comprehensive training management platform.
            </p>
            <div className="mt-10">
              <Button
                size="lg"
                onClick={() => setShowLogin(true)}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
                data-testid="button-get-started"
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-medium text-gray-900">Training Catalog</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center">
                    Manage comprehensive training programs with internal and external courses, 
                    certifications, and compliance requirements.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-medium text-gray-900">Employee Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center">
                    Track employee training progress, certifications, and compliance status 
                    with detailed records and automated notifications.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-purple-500 text-white">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg font-medium text-gray-900">Compliance Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-center">
                    Generate audit-ready compliance reports with immutable records, 
                    evidence attachments, and regulatory requirement tracking.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mt-20">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Why Choose ManufacTMS?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Audit Ready</h3>
                    <p className="text-gray-500">
                      Immutable audit trails and comprehensive documentation meet regulatory requirements 
                      including ISO 45001 and OSHA standards.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Award className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Certification Tracking</h3>
                    <p className="text-gray-500">
                      Automated certification expiry notifications and renewal tracking 
                      ensure continuous compliance across your organization.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Shield className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Role-Based Access</h3>
                    <p className="text-gray-500">
                      Secure access control with HR/Admin, Manager, and Employee roles 
                      ensuring data security and appropriate permissions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Analytics & Insights</h3>
                    <p className="text-gray-500">
                      Comprehensive reporting and analytics provide visibility into 
                      training effectiveness and compliance metrics.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 mr-2" />
              <span className="text-lg font-semibold">ManufacTMS</span>
            </div>
            <p className="text-gray-400">
              Comprehensive Training Management for Manufacturing Excellence
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}