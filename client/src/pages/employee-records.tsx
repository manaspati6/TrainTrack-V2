import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Download, Users, Award, Calendar, FileText, X, BookOpen } from "lucide-react";

export default function EmployeeRecords() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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

  const { data: employeeCompliance = [], isLoading: isLoadingCompliance } = useQuery<any[]>({
    queryKey: ["/api/dashboard/employee-compliance"],
    retry: false,
  });

  const { data: allEmployees = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
    enabled: user?.role === 'hr_admin',
  });

  const { data: trainingEnrollments = [] } = useQuery<any[]>({
    queryKey: ["/api/training-enrollments"],
    retry: false,
  });

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const handleViewDetails = (employee: any) => {
    setSelectedEmployee(employee);
    setIsDetailsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  const filteredEmployees = employeeCompliance.filter((employee: any) => {
    const matchesSearch = employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || filterDepartment === "all" || employee.department === filterDepartment;
    const matchesStatus = !filterStatus || filterStatus === "all" || employee.complianceStatus === filterStatus;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departmentSet = new Set(employeeCompliance.map((emp: any) => emp.department));
  const uniqueDepartments = Array.from(departmentSet);
  const statusSet = new Set(employeeCompliance.map((emp: any) => emp.complianceStatus));
  const uniqueStatuses = Array.from(statusSet);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Compliant':
        return 'bg-green-100 text-compliance-green hover:bg-green-100';
      case 'Expiring Soon':
        return 'bg-orange-100 text-alert-orange hover:bg-orange-100';
      case 'Overdue':
        return 'bg-red-100 text-critical-red hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-600 hover:bg-gray-100';
    }
  };

  const canViewAllRecords = user?.role === 'hr_admin' || user?.role === 'manager';

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" data-testid="text-records-title">Employee Training Records</h2>
                <p className="text-gray-600 mt-1">Monitor individual training compliance and certification status</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Search employees..." 
                    className="pl-10 pr-4 w-80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-employees"
                  />
                </div>

                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-48" data-testid="select-department-filter">
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

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {uniqueStatuses.map((status: string) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  className="text-manufacturing-blue border-manufacturing-blue hover:bg-blue-50"
                  data-testid="button-export-records"
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
                      {employeeCompliance.length}
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
                    <p className="text-gray-600 text-sm font-medium">Compliant</p>
                    <p className="text-3xl font-bold text-compliance-green mt-2" data-testid="text-compliant-count">
                      {employeeCompliance.filter((emp: any) => emp.complianceStatus === 'Compliant').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Award className="h-6 w-6 text-compliance-green" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Expiring Soon</p>
                    <p className="text-3xl font-bold text-alert-orange mt-2" data-testid="text-expiring-count">
                      {employeeCompliance.filter((emp: any) => emp.complianceStatus === 'Expiring Soon').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-alert-orange" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Overdue</p>
                    <p className="text-3xl font-bold text-critical-red mt-2" data-testid="text-overdue-count">
                      {employeeCompliance.filter((emp: any) => emp.complianceStatus === 'Overdue').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-critical-red" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Employee Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Employee Training Records</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCompliance ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-pulse text-gray-500">Loading employee records...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Training</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500" data-testid="text-no-employees">
                            {searchTerm || filterDepartment || filterStatus ? "No employees match your filters" : "No employee records available"}
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((employee: any, index: number) => (
                          <tr key={employee.employeeId} className="hover:bg-gray-50" data-testid={`employee-record-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src="" alt={employee.employeeName} />
                                  <AvatarFallback className="bg-manufacturing-blue text-white text-sm">
                                    {employee.employeeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900" data-testid={`text-employee-name-${index}`}>
                                    {employee.employeeName}
                                  </div>
                                  <div className="text-sm text-gray-500" data-testid={`text-employee-id-${index}`}>
                                    {employee.employeeId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-department-${index}`}>
                              {employee.department || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                className={getStatusColor(employee.complianceStatus)}
                                data-testid={`badge-status-${index}`}
                              >
                                {employee.complianceStatus}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-last-training-${index}`}>
                              {employee.lastTraining || 'No training record'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm" data-testid={`text-next-due-${index}`}>
                              <span className={
                                employee.complianceStatus === 'Overdue' 
                                  ? 'text-critical-red font-medium' 
                                  : employee.complianceStatus === 'Expiring Soon'
                                  ? 'text-alert-orange font-medium'
                                  : 'text-gray-900'
                              }>
                                {employee.nextDue || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-manufacturing-blue hover:text-blue-700 mr-3"
                                onClick={() => handleViewDetails(employee)}
                                data-testid={`button-view-employee-${index}`}
                              >
                                View Details
                              </Button>
                              {canViewAllRecords && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-600 hover:text-gray-900"
                                  data-testid={`button-edit-employee-${index}`}
                                >
                                  Edit
                                </Button>
                              )}
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

          {/* Training History (could be expanded to show detailed training history for each employee) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Training Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500" data-testid="text-training-history-placeholder">
                Click "View Details" on any employee to see their training history
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <span>Employee Training Details</span>
                {selectedEmployee && (
                  <span className="text-sm font-normal text-gray-500">
                    - {selectedEmployee.employeeName}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>
            
            {selectedEmployee && (
              <div className="space-y-6">
                {/* Employee Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600">Employee Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Name:</span>
                        <span className="text-sm font-medium">{selectedEmployee.employeeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Employee ID:</span>
                        <span className="text-sm font-medium">{selectedEmployee.employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Department:</span>
                        <span className="text-sm font-medium">{selectedEmployee.department || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Status:</span>
                        <Badge className={getStatusColor(selectedEmployee.complianceStatus)}>
                          {selectedEmployee.complianceStatus}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-gray-600">Training Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Last Training:</span>
                        <span className="text-sm font-medium">{selectedEmployee.lastTraining || 'No training record'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Next Due:</span>
                        <span className="text-sm font-medium">{selectedEmployee.nextDue || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Total Trainings:</span>
                        <span className="text-sm font-medium">
                          {trainingEnrollments.filter((enrollment: any) => enrollment.employeeId === selectedEmployee.employeeId).length}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Training History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">Training History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {trainingEnrollments
                        .filter((enrollment: any) => enrollment.employeeId === selectedEmployee.employeeId)
                        .length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No training records found for this employee
                        </div>
                      ) : (
                        trainingEnrollments
                          .filter((enrollment: any) => enrollment.employeeId === selectedEmployee.employeeId)
                          .map((enrollment: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-manufacturing-blue rounded-full flex items-center justify-center">
                                  <BookOpen className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">
                                    Training Session {enrollment.sessionId || 'N/A'}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    Status: {enrollment.status} 
                                    {enrollment.completionDate && ` • Completed: ${new Date(enrollment.completionDate).toLocaleDateString()}`}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {enrollment.score && (
                                  <span className="text-sm font-medium text-gray-900">
                                    Score: {enrollment.score}%
                                  </span>
                                )}
                                <Badge 
                                  className={
                                    enrollment.status === 'completed' 
                                      ? 'bg-compliance-green text-white ml-2' 
                                      : enrollment.status === 'enrolled'
                                      ? 'bg-manufacturing-blue text-white ml-2'
                                      : 'bg-gray-500 text-white ml-2'
                                  }
                                >
                                  {enrollment.status}
                                </Badge>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDetailsModalOpen(false)}
                    data-testid="button-close-details"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
