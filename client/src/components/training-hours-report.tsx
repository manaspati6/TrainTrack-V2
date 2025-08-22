import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Download, Calendar, Target, CheckCircle } from "lucide-react";

export default function TrainingHoursReport() {
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    department: "",
    startDate: "",
    endDate: "",
  });

  // Get training hours report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ["/api/reports/training-hours", filters],
    retry: false,
    enabled: user?.role === 'manager' || user?.role === 'hr_admin',
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = () => {
    // Create CSV data
    const csvData = [
      ['Department', 'Month', 'Planned Hours', 'Actual Hours', 'Completion Rate'],
      ...(reportData?.plannedHours || []).map((item: any) => {
        const actualItem = (reportData?.actualHours || []).find(
          (a: any) => a.department === item.department && a.month === item.month
        );
        const completionRate = item.totalPlannedHours > 0 
          ? ((actualItem?.totalActualHours || 0) / item.totalPlannedHours * 100).toFixed(1)
          : '0';
        return [
          item.department || 'N/A',
          new Date(item.month).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
          item.totalPlannedHours || 0,
          actualItem?.totalActualHours || 0,
          completionRate + '%'
        ];
      })
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `training_hours_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="animate-pulse text-lg">Loading report...</div>;
  }

  if (user?.role !== 'manager' && user?.role !== 'hr_admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Access denied. Only managers and HR admins can view this report.</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = (reportData?.plannedHours || []).map((planned: any) => {
    const actual = (reportData?.actualHours || []).find(
      (a: any) => a.department === planned.department && a.month === planned.month
    );
    return {
      department: planned.department || 'N/A',
      month: new Date(planned.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      planned: planned.totalPlannedHours || 0,
      actual: actual?.totalActualHours || 0,
      completionRate: planned.totalPlannedHours > 0 
        ? ((actual?.totalActualHours || 0) / planned.totalPlannedHours * 100).toFixed(1)
        : 0
    };
  });

  // Summary data for pie chart
  const pieData = [
    { name: 'Completed', value: reportData?.summary?.totalActual || 0, color: '#22c55e' },
    { name: 'Remaining', value: Math.max(0, (reportData?.summary?.totalPlanned || 0) - (reportData?.summary?.totalActual || 0)), color: '#ef4444' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Training Hours Report: Planned vs Actual</h2>
        <Button onClick={exportReport} disabled={!reportData}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="department">Department</Label>
              <Select value={filters.department} onValueChange={(value) => handleFilterChange('department', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Departments</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()}>
                Update Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <Target className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Planned Hours</p>
              <p className="text-2xl font-bold">{reportData?.summary?.totalPlanned || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Actual Hours</p>
              <p className="text-2xl font-bold">{reportData?.summary?.totalActual || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <TrendingUp className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold">{reportData?.summary?.completionRate?.toFixed(1) || 0}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Variance</p>
              <p className="text-2xl font-bold">
                {((reportData?.summary?.totalActual || 0) - (reportData?.summary?.totalPlanned || 0)) > 0 ? '+' : ''}
                {(reportData?.summary?.totalActual || 0) - (reportData?.summary?.totalPlanned || 0)}h
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Planned vs Actual Hours by Department & Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="planned" fill="#3b82f6" name="Planned Hours" />
                <Bar dataKey="actual" fill="#22c55e" name="Actual Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Training Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Hours Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <p className="text-gray-500">No training data available for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planned Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actual Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completion Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((row, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.month}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.planned}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {row.actual}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          parseFloat(row.completionRate) >= 100 
                            ? 'bg-green-100 text-green-800' 
                            : parseFloat(row.completionRate) >= 80 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {row.completionRate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={row.actual - row.planned >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {row.actual - row.planned > 0 ? '+' : ''}
                          {row.actual - row.planned}h
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}