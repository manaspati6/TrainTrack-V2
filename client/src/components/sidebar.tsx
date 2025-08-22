import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  BookOpen, 
  Users, 
  FileText, 
  LogOut, 
  Shield,
  Calendar,
  UserPlus,
  Menu,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    window.location.reload();
  };

  const menuItems = [
    { path: "/", icon: Home, label: "Dashboard", roles: ["employee", "manager", "hr_admin"] },
    { path: "/training-catalog", icon: BookOpen, label: "Training Catalog", roles: ["employee", "manager", "hr_admin"] },
    { path: "/training-calendar", icon: Calendar, label: "Training Calendar", roles: ["employee", "manager", "hr_admin"] },
    { path: "/employee-records", icon: Users, label: "Employee Records", roles: ["manager", "hr_admin"] },
    { path: "/employee-management", icon: UserPlus, label: "Employee Management", roles: ["hr_admin"] },
    { path: "/compliance-reports", icon: FileText, label: "Compliance Reports", roles: ["manager", "hr_admin"] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'employee')
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-md"
        data-testid="button-mobile-menu"
      >
        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-gray-900 text-white w-64 min-h-screen flex flex-col fixed left-0 top-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:z-auto
      `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-400" />
          <div>
            <h2 className="font-bold text-lg">ManufacTMS</h2>
            <p className="text-gray-400 text-sm">Training Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div>
            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
            <p className="text-gray-400 text-sm capitalize">{user?.role?.replace('_', ' ')}</p>
            <p className="text-gray-500 text-xs">{user?.department}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;
            
            return (
              <li key={item.path}>
                <Link href={item.path}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start text-left h-12 ${
                      isActive 
                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                    data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:bg-gray-700 hover:text-white h-12"
            data-testid="button-logout"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}