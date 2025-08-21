import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users,
  TrendingUp,
  TrendingDown
} from "lucide-react";

export default function ComplianceMetrics() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const defaultMetrics = {
    totalEmployees: 156,
    compliantEmployees: 142,
    pendingTraining: 14,
    overdueTraining: 8,
    certificationsExpiring: 23,
    completedThisMonth: 47,
    complianceRate: 91.0,
    averageTrainingHours: 12.5
  };

  const data = metrics || defaultMetrics;

  const complianceRate = ((data.compliantEmployees / data.totalEmployees) * 100).toFixed(1);
  const pendingRate = ((data.pendingTraining / data.totalEmployees) * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Compliance Rate */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
            Compliance Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-green-600">{complianceRate}%</span>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +2.3%
            </div>
          </div>
          <Progress value={parseFloat(complianceRate)} className="mt-2" />
          <p className="text-sm text-gray-500 mt-2">
            {data.compliantEmployees} of {data.totalEmployees} employees
          </p>
        </CardContent>
      </Card>

      {/* Pending Training */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-yellow-500" />
            Pending Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-yellow-600">{data.pendingTraining}</span>
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              {pendingRate}%
            </Badge>
          </div>
          <Progress value={parseFloat(pendingRate)} className="mt-2" />
          <p className="text-sm text-gray-500 mt-2">
            Require immediate attention
          </p>
        </CardContent>
      </Card>

      {/* Overdue Training */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
            Overdue Training
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-red-600">{data.overdueTraining}</span>
            <div className="flex items-center text-sm text-red-600">
              <TrendingDown className="h-4 w-4 mr-1" />
              -1.2%
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Critical compliance risk
          </p>
        </CardContent>
      </Card>

      {/* Monthly Completions */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-500" />
            This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-blue-600">{data.completedThisMonth}</span>
            <div className="flex items-center text-sm text-blue-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +15.4%
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Training sessions completed
          </p>
        </CardContent>
      </Card>

      {/* Additional Metrics Row */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Certification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <span className="text-2xl font-bold text-orange-600">{data.certificationsExpiring}</span>
              <p className="text-sm text-gray-500">Expiring in 30 days</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-blue-600">{data.averageTrainingHours}h</span>
              <p className="text-sm text-gray-500">Avg. training hours</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600">
            Department Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Manufacturing</span>
              <div className="flex items-center space-x-2">
                <Progress value={88} className="w-20" />
                <span className="text-sm font-medium">88%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Quality Control</span>
              <div className="flex items-center space-x-2">
                <Progress value={95} className="w-20" />
                <span className="text-sm font-medium">95%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Maintenance</span>
              <div className="flex items-center space-x-2">
                <Progress value={92} className="w-20" />
                <span className="text-sm font-medium">92%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Safety</span>
              <div className="flex items-center space-x-2">
                <Progress value={100} className="w-20" />
                <span className="text-sm font-medium">100%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}