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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar,
  Plus,
  Clock,
  Users,
  MapPin,
  BookOpen,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";

export default function TrainingCalendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeView, setActiveView] = useState("month");

  const [newSession, setNewSession] = useState({
    trainingCatalogId: "",
    sessionDate: "",
    startTime: "",
    endTime: "",
    location: "",
    trainer: "",
    maxParticipants: "",
    status: "scheduled",
    notes: "",
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

  const { data: trainingSessions = [], isLoading: isLoadingSessions } = useQuery<any[]>({
    queryKey: ["/api/training-sessions"],
    retry: false,
  });

  const { data: trainingCatalog = [] } = useQuery<any[]>({
    queryKey: ["/api/training-catalog"],
    retry: false,
  });

  const { data: allEmployees = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    retry: false,
    enabled: user?.role === 'hr_admin' || user?.role === 'manager',
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("POST", "/api/training-sessions", sessionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      setIsScheduleModalOpen(false);
      setNewSession({
        trainingCatalogId: "",
        sessionDate: "",
        startTime: "",
        endTime: "",
        location: "",
        trainer: "",
        maxParticipants: "",
        status: "scheduled",
        notes: "",
      });
      toast({
        title: "Success",
        description: "Training session scheduled successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to schedule training session",
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

  const canScheduleTraining = user?.role === 'hr_admin' || user?.role === 'manager';

  // Calendar Helper Functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getSessionsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateString = date.toISOString().split('T')[0];
    return trainingSessions.filter((session: any) => {
      const sessionDate = new Date(session.sessionDate).toISOString().split('T')[0];
      return sessionDate === dateString;
    });
  };

  const filteredSessions = trainingSessions.filter((session: any) => {
    if (filterCategory === "all") return true;
    const training = trainingCatalog.find((t: any) => t.id === session.trainingCatalogId);
    return training?.category === filterCategory;
  });

  const handleScheduleSession = () => {
    if (!newSession.trainingCatalogId || !newSession.sessionDate || !newSession.startTime || !newSession.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const sessionData = {
      ...newSession,
      sessionDate: new Date(newSession.sessionDate).toISOString(),
      maxParticipants: newSession.maxParticipants ? parseInt(newSession.maxParticipants) : null,
    };
    createSessionMutation.mutate(sessionData);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" data-testid="text-calendar-title">
                  Training Calendar
                </h2>
                <p className="text-gray-600 mt-1">
                  Schedule and manage training sessions
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48" data-testid="select-filter-category">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                    <SelectItem value="quality">Quality</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>

                {canScheduleTraining && (
                  <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-manufacturing-blue hover:bg-blue-700" data-testid="button-schedule-session">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Session
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Schedule Training Session</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="training">Training Course *</Label>
                            <Select 
                              value={newSession.trainingCatalogId} 
                              onValueChange={(value) => setNewSession({ ...newSession, trainingCatalogId: value })}
                            >
                              <SelectTrigger data-testid="select-training-course">
                                <SelectValue placeholder="Select training course" />
                              </SelectTrigger>
                              <SelectContent>
                                {trainingCatalog.map((training: any) => (
                                  <SelectItem key={training.id} value={training.id}>
                                    {training.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="sessionDate">Session Date *</Label>
                            <Input
                              id="sessionDate"
                              type="date"
                              value={newSession.sessionDate}
                              onChange={(e) => setNewSession({ ...newSession, sessionDate: e.target.value })}
                              data-testid="input-session-date"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="startTime">Start Time *</Label>
                            <Input
                              id="startTime"
                              type="time"
                              value={newSession.startTime}
                              onChange={(e) => setNewSession({ ...newSession, startTime: e.target.value })}
                              data-testid="input-start-time"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="endTime">End Time *</Label>
                            <Input
                              id="endTime"
                              type="time"
                              value={newSession.endTime}
                              onChange={(e) => setNewSession({ ...newSession, endTime: e.target.value })}
                              data-testid="input-end-time"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={newSession.location}
                              onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                              placeholder="e.g., Conference Room A"
                              data-testid="input-location"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="maxParticipants">Max Participants</Label>
                            <Input
                              id="maxParticipants"
                              type="number"
                              value={newSession.maxParticipants}
                              onChange={(e) => setNewSession({ ...newSession, maxParticipants: e.target.value })}
                              placeholder="20"
                              data-testid="input-max-participants"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="trainer">Trainer</Label>
                          <Select 
                            value={newSession.trainer} 
                            onValueChange={(value) => setNewSession({ ...newSession, trainer: value })}
                          >
                            <SelectTrigger data-testid="select-trainer">
                              <SelectValue placeholder="Select trainer" />
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

                        <div>
                          <Label htmlFor="notes">Notes</Label>
                          <Input
                            id="notes"
                            value={newSession.notes}
                            onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                            placeholder="Additional notes or requirements"
                            data-testid="input-session-notes"
                          />
                        </div>

                        <div className="flex justify-end space-x-3">
                          <Button 
                            variant="outline" 
                            onClick={() => setIsScheduleModalOpen(false)}
                            data-testid="button-cancel-session"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleScheduleSession}
                            disabled={createSessionMutation.isPending}
                            className="bg-manufacturing-blue hover:bg-blue-700"
                            data-testid="button-save-session"
                          >
                            {createSessionMutation.isPending ? "Scheduling..." : "Schedule Session"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Calendar View Controls */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <h3 className="text-lg font-semibold" data-testid="text-current-month">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <Tabs value={activeView} onValueChange={setActiveView}>
                  <TabsList>
                    <TabsTrigger value="month" data-testid="tab-month-view">Month</TabsTrigger>
                    <TabsTrigger value="list" data-testid="tab-list-view">List</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeView} onValueChange={setActiveView}>
                <TabsContent value="month">
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1 mb-4">
                    {weekDays.map((day) => (
                      <div key={day} className="p-2 text-center font-medium text-gray-500 text-sm">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {getDaysInMonth(currentDate).map((date, index) => {
                      const isToday = date && date.toDateString() === new Date().toDateString();
                      const sessionsOnDate = getSessionsForDate(date);
                      
                      return (
                        <div
                          key={index}
                          className={`min-h-24 p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                            date ? 'bg-white' : 'bg-gray-50'
                          } ${isToday ? 'ring-2 ring-manufacturing-blue' : ''}`}
                          onClick={() => date && setSelectedDate(date)}
                          data-testid={date ? `calendar-day-${date.getDate()}` : undefined}
                        >
                          {date && (
                            <>
                              <div className={`text-sm font-medium ${isToday ? 'text-manufacturing-blue' : 'text-gray-900'}`}>
                                {date.getDate()}
                              </div>
                              
                              {sessionsOnDate.length > 0 && (
                                <div className="mt-1 space-y-1">
                                  {sessionsOnDate.slice(0, 2).map((session: any, idx: number) => {
                                    const training = trainingCatalog.find((t: any) => t.id === session.trainingCatalogId);
                                    return (
                                      <div
                                        key={idx}
                                        className="text-xs p-1 bg-manufacturing-blue text-white rounded truncate"
                                        title={training?.title || 'Training Session'}
                                      >
                                        {training?.title || 'Training'}
                                      </div>
                                    );
                                  })}
                                  {sessionsOnDate.length > 2 && (
                                    <div className="text-xs text-gray-500">
                                      +{sessionsOnDate.length - 2} more
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="list">
                  {/* List View */}
                  <div className="space-y-4">
                    {isLoadingSessions ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-pulse text-gray-500">Loading sessions...</div>
                      </div>
                    ) : filteredSessions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500" data-testid="text-no-sessions">
                        No training sessions scheduled
                      </div>
                    ) : (
                      filteredSessions.map((session: any, index: number) => {
                        const training = trainingCatalog.find((t: any) => t.id === session.trainingCatalogId);
                        const trainer = allEmployees.find((emp: any) => emp.id === session.trainer);
                        
                        return (
                          <Card key={session.id} className="hover:shadow-md transition-shadow" data-testid={`session-card-${index}`}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="text-lg font-semibold text-gray-900" data-testid={`text-session-title-${index}`}>
                                      {training?.title || 'Training Session'}
                                    </h4>
                                    <Badge 
                                      className={
                                        session.status === 'completed' 
                                          ? 'bg-compliance-green text-white' :
                                        session.status === 'cancelled'
                                          ? 'bg-critical-red text-white' :
                                          'bg-manufacturing-blue text-white'
                                      }
                                      data-testid={`badge-session-status-${index}`}
                                    >
                                      {session.status}
                                    </Badge>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4" />
                                      <span data-testid={`text-session-date-${index}`}>
                                        {new Date(session.sessionDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Clock className="h-4 w-4" />
                                      <span data-testid={`text-session-time-${index}`}>
                                        {session.startTime} - {session.endTime}
                                      </span>
                                    </div>
                                    
                                    {session.location && (
                                      <div className="flex items-center space-x-2">
                                        <MapPin className="h-4 w-4" />
                                        <span data-testid={`text-session-location-${index}`}>
                                          {session.location}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {trainer && (
                                      <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4" />
                                        <span data-testid={`text-session-trainer-${index}`}>
                                          {trainer.firstName} {trainer.lastName}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {session.notes && (
                                    <div className="mt-3">
                                      <p className="text-sm text-gray-600" data-testid={`text-session-notes-${index}`}>
                                        {session.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                                
                                {canScheduleTraining && (
                                  <div className="flex items-center space-x-2 ml-4">
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-manufacturing-blue hover:text-blue-700"
                                      data-testid={`button-edit-session-${index}`}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="text-red-600 hover:text-red-700"
                                      data-testid={`button-delete-session-${index}`}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Session Details for Selected Date */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Sessions on {selectedDate.toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getSessionsForDate(selectedDate).length === 0 ? (
                  <div className="text-center py-4 text-gray-500" data-testid="text-no-sessions-selected-date">
                    No sessions scheduled for this date
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getSessionsForDate(selectedDate).map((session: any, index: number) => {
                      const training = trainingCatalog.find((t: any) => t.id === session.trainingCatalogId);
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {training?.title || 'Training Session'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {session.startTime} - {session.endTime}
                              {session.location && ` • ${session.location}`}
                            </p>
                          </div>
                          <Badge className="bg-manufacturing-blue text-white">
                            {session.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}