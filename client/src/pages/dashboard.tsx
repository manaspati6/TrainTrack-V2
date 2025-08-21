import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/sidebar";
import ComplianceMetrics from "@/components/compliance-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertTriangle, Users, Plus, Search, Bell } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: employeeCompliance, isLoading: isLoadingCompliance } = useQuery({
    queryKey: ["/api/dashboard/employee-compliance"],
    retry: false,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
    },
  });

  const { data: trainingSessions } = useQuery({
    queryKey: ["/api/training-sessions"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  const recentActivities = trainingSessions?.slice(0, 3).map((session: any) => ({
    id: session.id,
    title: session.title,
    type: session.status === 'completed' ? 'completed' : 'scheduled',
    details: `${session.status === 'completed' ? 'Completed by' : 'Scheduled for'} participants`,
    date: new Date(session.sessionDate).toLocaleDateString(),
    time: new Date(session.sessionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  })) || [];

  const complianceAlerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Critical Certification Expiring',
      description: 'Forklift operator certificates for 3 employees expire in 5 days',
      action: 'Take Action',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Overdue Training',
      description: 'Emergency evacuation drill scheduled 2 weeks ago',
      action: 'Schedule Now',
    },
    {
      id: 3,
      type: 'info',
      title: 'New Regulation Update',
      description: 'ISO 45001:2024 amendment requires additional documentation',
      action: 'Learn More',
    },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" data-testid="text-dashboard-title">Training Management Dashboard</h2>
                <p className="text-gray-600 mt-1">Monitor compliance status and manage training programs</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input 
                    type="text" 
                    placeholder="Search trainings, employees..." 
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-manufacturing-blue focus:border-transparent w-80"
                    data-testid="input-search"
                  />
                </div>
                
                <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors" data-testid="button-notifications">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-critical-red text-white text-xs rounded-full flex items-center justify-center">3</span>
                </button>
                
                <Button className="bg-manufacturing-blue hover:bg-blue-700" data-testid="button-add-training">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Compliance Metrics */}
          <ComplianceMetrics />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Training Activities */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">Recent Training Activities</CardTitle>
                    <Button variant="ghost" className="text-manufacturing-blue hover:text-blue-700" data-testid="button-view-all-activities">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.length === 0 ? (
                      <div className="text-center py-8 text-gray-500" data-testid="text-no-activities">
                        No recent training activities
                      </div>
                    ) : (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg" data-testid={`activity-${activity.id}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'completed' 
                              ? 'bg-compliance-green' 
                              : 'bg-alert-orange'
                          }`}>
                            {activity.type === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-white" />
                            ) : (
                              <Clock className="h-5 w-5 text-white" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900" data-testid={`text-activity-title-${activity.id}`}>{activity.title}</h4>
                            <p className="text-sm text-gray-600" data-testid={`text-activity-details-${activity.id}`}>{activity.details}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900" data-testid={`text-activity-date-${activity.id}`}>{activity.date}</p>
                            <p className="text-xs text-gray-500" data-testid={`text-activity-time-${activity.id}`}>{activity.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance Alerts */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Compliance Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {complianceAlerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`p-4 border rounded-lg ${
                          alert.type === 'critical' 
                            ? 'bg-red-50 border-red-200' 
                            : alert.type === 'warning'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-blue-50 border-blue-200'
                        }`}
                        data-testid={`alert-${alert.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className={`mt-1 h-4 w-4 ${
                            alert.type === 'critical' 
                              ? 'text-critical-red' 
                              : alert.type === 'warning'
                              ? 'text-alert-orange'
                              : 'text-manufacturing-blue'
                          }`} />
                          <div>
                            <h4 className={`font-medium ${
                              alert.type === 'critical' 
                                ? 'text-critical-red' 
                                : alert.type === 'warning'
                                ? 'text-alert-orange'
                                : 'text-manufacturing-blue'
                            }`} data-testid={`text-alert-title-${alert.id}`}>
                              {alert.title}
                            </h4>
                            <p className="text-sm text-gray-700 mt-1" data-testid={`text-alert-description-${alert.id}`}>
                              {alert.description}
                            </p>
                            <button className={`text-xs font-medium mt-2 hover:underline ${
                              alert.type === 'critical' 
                                ? 'text-critical-red' 
                                : alert.type === 'warning'
                                ? 'text-alert-orange'
                                : 'text-manufacturing-blue'
                            }`} data-testid={`button-alert-action-${alert.id}`}>
                              {alert.action}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* This Week's Training Schedule */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">This Week's Training Schedule</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" className="bg-gray-100 text-gray-700 hover:bg-gray-200" data-testid="button-week-view">
                    Week
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100" data-testid="button-month-view">
                    Month
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-4">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={day} className="text-xs font-medium text-gray-500 uppercase tracking-wide py-2" data-testid={`calendar-header-${day.toLowerCase()}`}>
                    {day}
                  </div>
                ))}
                
                {[15, 16, 17, 18, 19, 20, 21].map((date) => (
                  <div 
                    key={date} 
                    className={`p-2 min-h-24 border border-gray-100 rounded ${
                      date === 16 ? 'bg-blue-50' : 
                      date === 18 ? 'bg-green-50' :
                      date === 19 ? 'bg-orange-50' : ''
                    }`}
                    data-testid={`calendar-day-${date}`}
                  >
                    <span className="text-sm text-gray-900">{date}</span>
                    {date === 16 && (
                      <div className="mt-1 p-1 bg-manufacturing-blue text-white text-xs rounded truncate">
                        OSHA Safety
                      </div>
                    )}
                    {date === 18 && (
                      <div className="mt-1 p-1 bg-compliance-green text-white text-xs rounded truncate">
                        Quality Control
                      </div>
                    )}
                    {date === 19 && (
                      <div className="mt-1 p-1 bg-alert-orange text-white text-xs rounded truncate">
                        Fire Safety Drill
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Employee Training Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">Employee Training Status</CardTitle>
                <div className="flex items-center space-x-3">
                  <select className="border border-gray-300 rounded-md px-3 py-2 text-sm" data-testid="select-department-filter">
                    <option>All Departments</option>
                    <option>Production</option>
                    <option>Quality Control</option>
                    <option>Maintenance</option>
                  </select>
                  <Button variant="outline" className="text-manufacturing-blue border-manufacturing-blue hover:bg-blue-50" data-testid="button-export-compliance">
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingCompliance ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-pulse text-gray-500">Loading compliance data...</div>
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
                      {employeeCompliance?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500" data-testid="text-no-compliance-data">
                            No employee compliance data available
                          </td>
                        </tr>
                      ) : (
                        employeeCompliance?.slice(0, 10).map((employee: any, index: number) => (
                          <tr key={employee.employeeId} className="hover:bg-gray-50" data-testid={`employee-row-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-manufacturing-blue flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                      {employee.employeeName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                                    </span>
                                  </div>
                                </div>
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
                              {employee.department}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge 
                                variant={
                                  employee.complianceStatus === 'Compliant' ? 'default' :
                                  employee.complianceStatus === 'Expiring Soon' ? 'secondary' :
                                  'destructive'
                                }
                                className={
                                  employee.complianceStatus === 'Compliant' 
                                    ? 'bg-green-100 text-compliance-green hover:bg-green-100' :
                                  employee.complianceStatus === 'Expiring Soon'
                                    ? 'bg-orange-100 text-alert-orange hover:bg-orange-100' :
                                    'bg-red-100 text-critical-red hover:bg-red-100'
                                }
                                data-testid={`badge-status-${index}`}
                              >
                                {employee.complianceStatus}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-last-training-${index}`}>
                              {employee.lastTraining || 'No training record'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" data-testid={`text-next-due-${index}`}>
                              {employee.nextDue || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Button variant="ghost" size="sm" className="text-manufacturing-blue hover:text-blue-700 mr-3" data-testid={`button-view-employee-${index}`}>
                                View
                              </Button>
                              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" data-testid={`button-edit-employee-${index}`}>
                                Edit
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
        </div>
      </main>
    </div>
  );
}
