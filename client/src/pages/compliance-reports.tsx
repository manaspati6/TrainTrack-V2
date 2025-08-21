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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePickerWithRange } from "@/components/ui/date-picker";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Users,
  Award,
  Clock,
  Search
} from "lucide-react";

export default function ComplianceReports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [selectedReport, setSelectedReport] = useState("overview");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
    to: new Date(),
  });
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStandard, setFilterStandard] = useState("");

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

  const { data: complianceMetrics, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  const { data: employeeCompliance = [] } = useQuery<any[]>({
    queryKey: ["/api/dashboard/employee-compliance"],
    retry: false,
  });

  const { data: trainingSessions = [] } = useQuery<any[]>({
    queryKey: ["/api/training-sessions"],
    retry: false,
  });

  const { data: auditLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/audit-logs"],
    retry: false,
    enabled: user?.role === 'hr_admin',
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  const reportTypes = [
    {
      id: "overview",
      title: "Compliance Overview",
      description: "High-level compliance metrics and trends",
      icon: TrendingUp,
    },
    {
      id: "employee",
      title: "Employee Compliance",
      description: "Individual employee training status",
      icon: Users,
    },
    {
      id: "training",
      title: "Training Activity",
      description: "Training sessions and completion rates",
      icon: Award,
    },
    {
      id: "audit",
      title: "Audit Trail",
      description: "System activity logs for compliance auditing",
      icon: FileText,
      restricted: true,
    },
  ];

  const generateReport = (type: string) => {
    toast({
      title: "Generating Report",
      description: `Preparing ${reportTypes.find(r => r.id === type)?.title} report...`,
    });
    // Implementation would generate and download the actual report
  };

  const exportData = (format: string) => {
    toast({
      title: "Exporting Data",
      description: `Exporting data in ${format.toUpperCase()} format...`,
    });
    // Implementation would export the data in the specified format
  };

  const canViewAuditReports = user?.role === 'hr_admin';
  const filteredReportTypes = reportTypes.filter(report => 
    !report.restricted || canViewAuditReports
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" data-testid="text-reports-title">
                  Compliance Reports
                </h2>
                <p className="text-gray-600 mt-1">
                  Generate audit-ready compliance reports and analytics
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => exportData("pdf")}
                  className="text-manufacturing-blue border-manufacturing-blue hover:bg-blue-50"
                  data-testid="button-export-pdf"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => exportData("excel")}
                  className="text-compliance-green border-compliance-green hover:bg-green-50"
                  data-testid="button-export-excel"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Excel
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Report Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Report Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredReportTypes.map((report) => {
                  const Icon = report.icon;
                  const isSelected = selectedReport === report.id;
                  
                  return (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report.id)}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'border-manufacturing-blue bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`button-report-${report.id}`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className={`h-5 w-5 ${isSelected ? 'text-manufacturing-blue' : 'text-gray-400'}`} />
                        <h3 className="font-medium text-gray-900">{report.title}</h3>
                      </div>
                      <p className="text-sm text-gray-600">{report.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Report Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Report Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="date-range">Date Range</Label>
                  <div className="mt-1">
                    <Input
                      type="date"
                      value={dateRange.from.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        from: new Date(e.target.value)
                      })}
                      data-testid="input-date-from"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="date-to">To</Label>
                  <div className="mt-1">
                    <Input
                      type="date"
                      value={dateRange.to.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        to: new Date(e.target.value)
                      })}
                      data-testid="input-date-to"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                    <SelectTrigger data-testid="select-department">
                      <SelectValue placeholder="All Departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="quality">Quality Control</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="standard">Compliance Standard</Label>
                  <Select value={filterStandard} onValueChange={setFilterStandard}>
                    <SelectTrigger data-testid="select-standard">
                      <SelectValue placeholder="All Standards" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Standards</SelectItem>
                      <SelectItem value="iso45001">ISO 45001</SelectItem>
                      <SelectItem value="osha">OSHA</SelectItem>
                      <SelectItem value="iso9001">ISO 9001</SelectItem>
                      <SelectItem value="custom">Custom Standards</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterDepartment("all");
                    setFilterStandard("all");
                    setDateRange({
                      from: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1),
                      to: new Date(),
                    });
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
                <Button 
                  onClick={() => generateReport(selectedReport)}
                  className="bg-manufacturing-blue hover:bg-blue-700"
                  data-testid="button-generate-report"
                >
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <Tabs value={selectedReport} onValueChange={setSelectedReport}>
            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Compliance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMetrics ? (
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Overall Compliance Rate</span>
                          <Badge 
                            className="bg-compliance-green text-white"
                            data-testid="badge-compliance-rate"
                          >
                            {complianceMetrics?.overallCompliance || 0}%
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Pending Trainings</span>
                          <Badge 
                            className="bg-alert-orange text-white"
                            data-testid="badge-pending-trainings"
                          >
                            {complianceMetrics?.pendingTrainings || 0}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Expiring Certificates</span>
                          <Badge 
                            className="bg-critical-red text-white"
                            data-testid="badge-expiring-certs"
                          >
                            {complianceMetrics?.expiringCertificates || 0}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Employees</span>
                          <Badge 
                            className="bg-industrial-gray text-white"
                            data-testid="badge-total-employees"
                          >
                            {complianceMetrics?.activeEmployees || 0}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Compliance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500" data-testid="compliance-trends-placeholder">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Compliance trend chart would be displayed here</p>
                      <p className="text-sm">Historical compliance data visualization</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="employee">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Employee Compliance Status</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-compliance-green text-white">
                        {employeeCompliance.filter((emp: any) => emp.complianceStatus === 'Compliant').length} Compliant
                      </Badge>
                      <Badge className="bg-alert-orange text-white">
                        {employeeCompliance.filter((emp: any) => emp.complianceStatus === 'Expiring Soon').length} Expiring
                      </Badge>
                      <Badge className="bg-critical-red text-white">
                        {employeeCompliance.filter((emp: any) => emp.complianceStatus === 'Overdue').length} Overdue
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Employee
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Department
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Training
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Next Due
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {employeeCompliance.slice(0, 10).map((employee: any, index: number) => (
                          <tr key={employee.employeeId} data-testid={`employee-compliance-${index}`}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {employee.employeeName}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.department || 'N/A'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge 
                                className={
                                  employee.complianceStatus === 'Compliant' 
                                    ? 'bg-compliance-green text-white' :
                                  employee.complianceStatus === 'Expiring Soon'
                                    ? 'bg-alert-orange text-white' :
                                    'bg-critical-red text-white'
                                }
                              >
                                {employee.complianceStatus}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.lastTraining || 'No record'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {employee.nextDue || 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="training">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Training Activity Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-manufacturing-blue" data-testid="total-sessions">
                        {trainingSessions.length}
                      </div>
                      <div className="text-sm text-gray-600">Total Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-compliance-green" data-testid="completed-sessions">
                        {trainingSessions.filter((s: any) => s.status === 'completed').length}
                      </div>
                      <div className="text-sm text-gray-600">Completed Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-alert-orange" data-testid="scheduled-sessions">
                        {trainingSessions.filter((s: any) => s.status === 'scheduled').length}
                      </div>
                      <div className="text-sm text-gray-600">Scheduled Sessions</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Training Session
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Trainer
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {trainingSessions.slice(0, 10).map((session: any, index: number) => (
                          <tr key={session.id} data-testid={`training-session-${index}`}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {session.title}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(session.sessionDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {session.duration}h
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge 
                                className={
                                  session.status === 'completed' 
                                    ? 'bg-compliance-green text-white' :
                                  session.status === 'scheduled'
                                    ? 'bg-manufacturing-blue text-white' :
                                    'bg-gray-500 text-white'
                                }
                              >
                                {session.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              {session.trainerName || 'TBD'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {canViewAuditReports && (
              <TabsContent value="audit">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Audit Trail</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Timestamp
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Action
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Entity
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Changes
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {auditLogs.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500" data-testid="no-audit-logs">
                                No audit logs available
                              </td>
                            </tr>
                          ) : (
                            auditLogs.slice(0, 20).map((log: any, index: number) => (
                              <tr key={log.id} data-testid={`audit-log-${index}`}>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(log.performedAt).toLocaleString()}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {log.performedBy}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <Badge variant="outline">
                                    {log.action}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {log.entityType} #{log.entityId}
                                </td>
                                <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                                  {log.changes ? JSON.stringify(log.changes) : 'N/A'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
