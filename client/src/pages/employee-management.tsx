import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Plus, 
  Users, 
  Building,
  UserPlus,
  Edit,
  Trash2,
  Download
} from "lucide-react";

export default function EmployeeManagement() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [isAddDepartmentModalOpen, setIsAddDepartmentModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("employees");

  const [newEmployee, setNewEmployee] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "employee",
    department: "",
    employeeId: "",
  });

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
    manager: "",
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Check if user has admin permissions
  useEffect(() => {
    if (user && user.role !== 'hr_admin') {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    }
  }, [user, toast]);

  const { data: allEmployees = [], isLoading: isLoadingEmployees } = useQuery<any[]>({
    queryKey: ["/api/users"],
    retry: false,
    enabled: user?.role === 'hr_admin',
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
    retry: false,
    enabled: user?.role === 'hr_admin',
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      const response = await apiRequest("POST", "/api/users", employeeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsAddEmployeeModalOpen(false);
      setNewEmployee({
        username: "",
        password: "",
        email: "",
        firstName: "",
        lastName: "",
        role: "employee",
        department: "",
        employeeId: "",
      });
      toast({
        title: "Success",
        description: "Employee created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create employee",
        variant: "destructive",
      });
    },
  });

  const createDepartmentMutation = useMutation({
    mutationFn: async (departmentData: any) => {
      const response = await apiRequest("POST", "/api/departments", departmentData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsAddDepartmentModalOpen(false);
      setNewDepartment({
        name: "",
        description: "",
        manager: "",
      });
      toast({
        title: "Success",
        description: "Department created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to create department",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (user?.role !== 'hr_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const filteredEmployees = allEmployees.filter((employee: any) => {
    const matchesSearch = employee.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || employee.department === filterDepartment;
    const matchesRole = filterRole === "all" || employee.role === filterRole;
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const departmentSet = new Set(allEmployees.map((emp: any) => emp.department).filter(Boolean));
  const uniqueDepartments = Array.from(departmentSet);

  const handleCreateEmployee = () => {
    if (!newEmployee.username || !newEmployee.password || !newEmployee.email || !newEmployee.firstName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createEmployeeMutation.mutate(newEmployee);
  };

  const handleCreateDepartment = () => {
    if (!newDepartment.name) {
      toast({
        title: "Error",
        description: "Department name is required",
        variant: "destructive",
      });
      return;
    }
    createDepartmentMutation.mutate(newDepartment);
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" data-testid="text-employee-management-title">
                  Employee Management
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage employees, departments, and organizational structure
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  className="text-manufacturing-blue border-manufacturing-blue hover:bg-blue-50"
                  data-testid="button-export-employees"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Employees</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="text-total-employees">
                      {allEmployees.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-manufacturing-blue" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Departments</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="text-total-departments">
                      {uniqueDepartments.length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-compliance-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Managers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="text-total-managers">
                      {allEmployees.filter((emp: any) => emp.role === 'manager').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-alert-orange" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">HR Admins</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2" data-testid="text-total-admins">
                      {allEmployees.filter((emp: any) => emp.role === 'hr_admin').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Management Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="employees" data-testid="tab-employees">Employees</TabsTrigger>
              <TabsTrigger value="departments" data-testid="tab-departments">Departments</TabsTrigger>
            </TabsList>

            <TabsContent value="employees">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Employee Directory</CardTitle>
                    <Dialog open={isAddEmployeeModalOpen} onOpenChange={setIsAddEmployeeModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-manufacturing-blue hover:bg-blue-700" data-testid="button-add-employee">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Employee
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Employee</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="firstName">First Name *</Label>
                              <Input
                                id="firstName"
                                value={newEmployee.firstName}
                                onChange={(e) => setNewEmployee({ ...newEmployee, firstName: e.target.value })}
                                placeholder="John"
                                data-testid="input-employee-firstname"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="lastName">Last Name *</Label>
                              <Input
                                id="lastName"
                                value={newEmployee.lastName}
                                onChange={(e) => setNewEmployee({ ...newEmployee, lastName: e.target.value })}
                                placeholder="Doe"
                                data-testid="input-employee-lastname"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="username">Username *</Label>
                              <Input
                                id="username"
                                value={newEmployee.username}
                                onChange={(e) => setNewEmployee({ ...newEmployee, username: e.target.value })}
                                placeholder="john.doe"
                                data-testid="input-employee-username"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="email">Email *</Label>
                              <Input
                                id="email"
                                type="email"
                                value={newEmployee.email}
                                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                placeholder="john.doe@company.com"
                                data-testid="input-employee-email"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="password">Password *</Label>
                              <Input
                                id="password"
                                type="password"
                                value={newEmployee.password}
                                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                placeholder="••••••••"
                                data-testid="input-employee-password"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="employeeId">Employee ID</Label>
                              <Input
                                id="employeeId"
                                value={newEmployee.employeeId}
                                onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                                placeholder="EMP001"
                                data-testid="input-employee-id"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="role">Role *</Label>
                              <Select 
                                value={newEmployee.role} 
                                onValueChange={(value) => setNewEmployee({ ...newEmployee, role: value })}
                              >
                                <SelectTrigger data-testid="select-employee-role">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="employee">Employee</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="hr_admin">HR Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label htmlFor="department">Department</Label>
                              <Select 
                                value={newEmployee.department} 
                                onValueChange={(value) => setNewEmployee({ ...newEmployee, department: value })}
                              >
                                <SelectTrigger data-testid="select-employee-department">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="production">Production</SelectItem>
                                  <SelectItem value="quality">Quality Control</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="safety">Safety</SelectItem>
                                  <SelectItem value="hr">Human Resources</SelectItem>
                                  <SelectItem value="engineering">Engineering</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex justify-end space-x-3">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsAddEmployeeModalOpen(false)}
                              data-testid="button-cancel-employee"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreateEmployee}
                              disabled={createEmployeeMutation.isPending}
                              className="bg-manufacturing-blue hover:bg-blue-700"
                              data-testid="button-save-employee"
                            >
                              {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input 
                        type="text" 
                        placeholder="Search employees..." 
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        data-testid="input-search-employees"
                      />
                    </div>

                    <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                      <SelectTrigger className="w-48" data-testid="select-filter-department">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="All Departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {uniqueDepartments.map((dept: string) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger className="w-48" data-testid="select-filter-role">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="hr_admin">HR Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employee Table */}
                  {isLoadingEmployees ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-pulse text-gray-500">Loading employees...</div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredEmployees.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-8 text-center text-gray-500" data-testid="text-no-employees">
                                {searchTerm || filterDepartment !== "all" || filterRole !== "all" ? "No employees match your filters" : "No employees found"}
                              </td>
                            </tr>
                          ) : (
                            filteredEmployees.map((employee: any, index: number) => (
                              <tr key={employee.id} className="hover:bg-gray-50" data-testid={`employee-row-${index}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={employee.profileImageUrl} alt={`${employee.firstName} ${employee.lastName}`} />
                                      <AvatarFallback className="bg-manufacturing-blue text-white text-sm">
                                        {employee.firstName?.[0]}{employee.lastName?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900" data-testid={`text-employee-name-${index}`}>
                                        {employee.firstName} {employee.lastName}
                                      </div>
                                      <div className="text-sm text-gray-500" data-testid={`text-employee-username-${index}`}>
                                        {employee.username}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    className={
                                      employee.role === 'hr_admin' 
                                        ? 'bg-purple-100 text-purple-800' :
                                      employee.role === 'manager'
                                        ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                    }
                                    data-testid={`badge-employee-role-${index}`}
                                  >
                                    {employee.role === 'hr_admin' ? 'HR Admin' : 
                                     employee.role === 'manager' ? 'Manager' : 'Employee'}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-employee-department-${index}`}>
                                  {employee.department || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-employee-id-${index}`}>
                                  {employee.employeeId || 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-manufacturing-blue hover:text-blue-700 mr-3"
                                    data-testid={`button-edit-employee-${index}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600 hover:text-red-700"
                                    data-testid={`button-delete-employee-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Department Management</CardTitle>
                    <Dialog open={isAddDepartmentModalOpen} onOpenChange={setIsAddDepartmentModalOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-manufacturing-blue hover:bg-blue-700" data-testid="button-add-department">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Department
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Add New Department</DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="departmentName">Department Name *</Label>
                            <Input
                              id="departmentName"
                              value={newDepartment.name}
                              onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                              placeholder="e.g., Production"
                              data-testid="input-department-name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="departmentDescription">Description</Label>
                            <Input
                              id="departmentDescription"
                              value={newDepartment.description}
                              onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                              placeholder="Brief description of the department"
                              data-testid="input-department-description"
                            />
                          </div>

                          <div>
                            <Label htmlFor="departmentManager">Department Manager</Label>
                            <Select 
                              value={newDepartment.manager} 
                              onValueChange={(value) => setNewDepartment({ ...newDepartment, manager: value })}
                            >
                              <SelectTrigger data-testid="select-department-manager">
                                <SelectValue placeholder="Select manager" />
                              </SelectTrigger>
                              <SelectContent>
                                {allEmployees.filter((emp: any) => emp.role === 'manager' || emp.role === 'hr_admin').map((emp: any) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.firstName} {emp.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex justify-end space-x-3">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsAddDepartmentModalOpen(false)}
                              data-testid="button-cancel-department"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleCreateDepartment}
                              disabled={createDepartmentMutation.isPending}
                              className="bg-manufacturing-blue hover:bg-blue-700"
                              data-testid="button-save-department"
                            >
                              {createDepartmentMutation.isPending ? "Creating..." : "Create Department"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {uniqueDepartments.map((dept: string, index: number) => {
                      const deptEmployees = allEmployees.filter((emp: any) => emp.department === dept);
                      const manager = deptEmployees.find((emp: any) => emp.role === 'manager');
                      
                      return (
                        <Card key={dept} className="hover:shadow-md transition-shadow" data-testid={`department-card-${index}`}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Building className="h-6 w-6 text-manufacturing-blue" />
                              </div>
                              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-2" data-testid={`text-department-name-${index}`}>
                              {dept}
                            </h3>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span>Employees:</span>
                                <span className="font-medium" data-testid={`text-department-employee-count-${index}`}>
                                  {deptEmployees.length}
                                </span>
                              </div>
                              
                              {manager && (
                                <div className="flex justify-between">
                                  <span>Manager:</span>
                                  <span className="font-medium" data-testid={`text-department-manager-${index}`}>
                                    {manager.firstName} {manager.lastName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    {uniqueDepartments.length === 0 && (
                      <div className="col-span-full text-center py-8 text-gray-500" data-testid="text-no-departments">
                        No departments found. Create your first department to get started.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}