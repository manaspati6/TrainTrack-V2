import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Star, Users, TrendingUp, Plus, Calendar, CheckCircle } from "lucide-react";

interface EvaluationFormData {
  enrollmentId: number;
  employeeId: string;
  evaluationDate: string;
  knowledgeApplication: number;
  behaviorChange: number;
  performanceImprovement: number;
  complianceAdherence: number;
  overallEffectiveness: number;
  comments: string;
  actionPlan: string;
  followUpRequired: boolean;
  followUpDate: string;
}

export default function ManagerEvaluations() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [evaluationForm, setEvaluationForm] = useState<EvaluationFormData>({
    enrollmentId: 0,
    employeeId: "",
    evaluationDate: "",
    knowledgeApplication: 0,
    behaviorChange: 0,
    performanceImprovement: 0,
    complianceAdherence: 0,
    overallEffectiveness: 0,
    comments: "",
    actionPlan: "",
    followUpRequired: false,
    followUpDate: "",
  });

  // Get employees in manager's department who have completed training
  const { data: employeeEnrollments = [], isLoading } = useQuery({
    queryKey: ["/api/manager-evaluations/pending", user?.id],
    retry: false,
    enabled: user?.role === 'manager' || user?.role === 'hr_admin',
  });

  // Get existing evaluations
  const { data: existingEvaluations = [] } = useQuery({
    queryKey: ["/api/effectiveness-evaluations", user?.id],
    retry: false,
    enabled: user?.role === 'manager' || user?.role === 'hr_admin',
  });

  const submitEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: EvaluationFormData) => {
      const response = await apiRequest("POST", "/api/effectiveness-evaluations", evaluationData);
      if (!response.ok) {
        throw new Error("Failed to submit evaluation");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/effectiveness-evaluations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/manager-evaluations/pending"] });
      setIsModalOpen(false);
      resetForm();
      toast({
        title: "Evaluation Submitted",
        description: "Training effectiveness evaluation has been recorded",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit evaluation",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEvaluationForm({
      enrollmentId: 0,
      employeeId: "",
      evaluationDate: "",
      knowledgeApplication: 0,
      behaviorChange: 0,
      performanceImprovement: 0,
      complianceAdherence: 0,
      overallEffectiveness: 0,
      comments: "",
      actionPlan: "",
      followUpRequired: false,
      followUpDate: "",
    });
    setSelectedEnrollment(null);
  };

  const handleSubmitEvaluation = () => {
    if (!selectedEnrollment || !evaluationForm.evaluationDate || !evaluationForm.overallEffectiveness) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (evaluationForm.followUpRequired && !evaluationForm.followUpDate) {
      toast({
        title: "Error",
        description: "Follow-up date is required when follow-up is needed",
        variant: "destructive",
      });
      return;
    }

    submitEvaluationMutation.mutate({
      ...evaluationForm,
      enrollmentId: selectedEnrollment.id,
      employeeId: selectedEnrollment.employeeId,
    });
  };

  const openEvaluationModal = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setEvaluationForm({
      ...evaluationForm,
      enrollmentId: enrollment.id,
      employeeId: enrollment.employeeId,
      evaluationDate: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const StarRating = ({ value, onChange, label }: { value: number; onChange: (rating: number) => void; label: string }) => (
    <div className="space-y-2">
      <Label>{label} *</Label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 rounded ${value >= star ? 'text-yellow-500' : 'text-gray-300'} hover:text-yellow-400`}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  if (isLoading) {
    return <div className="animate-pulse text-lg">Loading...</div>;
  }

  if (user?.role !== 'manager' && user?.role !== 'hr_admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Access denied. Only managers and HR admins can view this page.</p>
      </div>
    );
  }

  // Filter enrollments that don't have evaluations yet
  const enrollmentsNeedingEvaluation = (employeeEnrollments as any[]).filter((enrollment: any) => 
    !(existingEvaluations as any[]).some((evaluation: any) => evaluation.enrollmentId === enrollment.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manager Effectiveness Evaluations</h2>
      </div>

      {/* Pending evaluations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Training Awaiting Effectiveness Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollmentsNeedingEvaluation.length === 0 ? (
            <p className="text-gray-500">No completed training sessions awaiting evaluation.</p>
          ) : (
            <div className="space-y-4">
              {enrollmentsNeedingEvaluation.map((enrollment: any) => (
                <div key={enrollment.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{enrollment.sessionTitle}</h3>
                    <p className="text-sm text-gray-600">
                      Employee: {enrollment.firstName} {enrollment.lastName} ({enrollment.employeeId})
                    </p>
                    <p className="text-sm text-gray-600">
                      Completed: {new Date(enrollment.completionDate).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{enrollment.department}</Badge>
                      <Badge variant="secondary">{enrollment.category}</Badge>
                    </div>
                  </div>
                  <Button onClick={() => openEvaluationModal(enrollment)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Evaluate
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed evaluations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            Completed Evaluations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(existingEvaluations as any[]).length === 0 ? (
            <p className="text-gray-500">No evaluations completed yet.</p>
          ) : (
            <div className="space-y-4">
              {(existingEvaluations as any[]).map((evaluation: any) => (
                <div key={evaluation.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{evaluation.sessionTitle}</h3>
                      <p className="text-sm text-gray-600">
                        Employee: {evaluation.firstName} {evaluation.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        Evaluated: {new Date(evaluation.evaluationDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                        <span>{evaluation.overallEffectiveness}/5</span>
                      </div>
                      {evaluation.followUpRequired && (
                        <Badge variant="destructive" className="mt-1">
                          Follow-up Required
                        </Badge>
                      )}
                    </div>
                  </div>
                  {evaluation.comments && (
                    <p className="mt-2 text-sm">{evaluation.comments}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Training Effectiveness Evaluation</DialogTitle>
          </DialogHeader>
          
          {selectedEnrollment && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">{selectedEnrollment.sessionTitle}</h3>
                <p className="text-sm text-gray-600">
                  Employee: {selectedEnrollment.firstName} {selectedEnrollment.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  Completed: {new Date(selectedEnrollment.completionDate).toLocaleDateString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="evaluationDate">Evaluation Date *</Label>
                  <Input
                    id="evaluationDate"
                    type="date"
                    value={evaluationForm.evaluationDate}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, evaluationDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StarRating
                  value={evaluationForm.knowledgeApplication}
                  onChange={(rating) => setEvaluationForm({ ...evaluationForm, knowledgeApplication: rating })}
                  label="Knowledge Application"
                />
                <StarRating
                  value={evaluationForm.behaviorChange}
                  onChange={(rating) => setEvaluationForm({ ...evaluationForm, behaviorChange: rating })}
                  label="Behavior Change"
                />
                <StarRating
                  value={evaluationForm.performanceImprovement}
                  onChange={(rating) => setEvaluationForm({ ...evaluationForm, performanceImprovement: rating })}
                  label="Performance Improvement"
                />
                <StarRating
                  value={evaluationForm.complianceAdherence}
                  onChange={(rating) => setEvaluationForm({ ...evaluationForm, complianceAdherence: rating })}
                  label="Compliance Adherence"
                />
              </div>

              <StarRating
                value={evaluationForm.overallEffectiveness}
                onChange={(rating) => setEvaluationForm({ ...evaluationForm, overallEffectiveness: rating })}
                label="Overall Training Effectiveness"
              />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="comments">Evaluation Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Detailed assessment of training effectiveness..."
                    value={evaluationForm.comments}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, comments: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="actionPlan">Action Plan</Label>
                  <Textarea
                    id="actionPlan"
                    placeholder="Next steps and recommendations..."
                    value={evaluationForm.actionPlan}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, actionPlan: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="followUpRequired"
                    checked={evaluationForm.followUpRequired}
                    onChange={(e) => setEvaluationForm({ 
                      ...evaluationForm, 
                      followUpRequired: e.target.checked,
                      followUpDate: e.target.checked ? evaluationForm.followUpDate : ""
                    })}
                  />
                  <Label htmlFor="followUpRequired">Follow-up Required</Label>
                </div>
                
                {evaluationForm.followUpRequired && (
                  <div>
                    <Label htmlFor="followUpDate">Follow-up Date *</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={evaluationForm.followUpDate}
                      onChange={(e) => setEvaluationForm({ ...evaluationForm, followUpDate: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitEvaluation}
                  disabled={submitEvaluationMutation.isPending}
                >
                  {submitEvaluationMutation.isPending ? "Submitting..." : "Submit Evaluation"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}