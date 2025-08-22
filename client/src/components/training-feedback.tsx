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
import { Star, MessageSquare, Plus, Users } from "lucide-react";

interface FeedbackFormData {
  sessionId: number;
  enrollmentId: number;
  overallRating: number;
  contentRating: number;
  trainerRating: number;
  relevanceRating: number;
  comments: string;
  suggestions: string;
}

export default function TrainingFeedback() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormData>({
    sessionId: 0,
    enrollmentId: 0,
    overallRating: 0,
    contentRating: 0,
    trainerRating: 0,
    relevanceRating: 0,
    comments: "",
    suggestions: "",
  });

  // Get completed training sessions for the current user
  const { data: completedSessions = [], isLoading } = useQuery({
    queryKey: ["/api/training-enrollments/completed", user?.id],
    retry: false,
  });

  // Get existing feedback
  const { data: existingFeedback = [] } = useQuery({
    queryKey: ["/api/training-feedback", user?.id],
    retry: false,
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: FeedbackFormData) => {
      const response = await apiRequest("POST", "/api/training-feedback", feedbackData);
      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-feedback"] });
      setIsModalOpen(false);
      resetForm();
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFeedbackForm({
      sessionId: 0,
      enrollmentId: 0,
      overallRating: 0,
      contentRating: 0,
      trainerRating: 0,
      relevanceRating: 0,
      comments: "",
      suggestions: "",
    });
    setSelectedSession(null);
  };

  const handleSubmitFeedback = () => {
    if (!selectedSession || !feedbackForm.overallRating || !feedbackForm.contentRating || 
        !feedbackForm.trainerRating || !feedbackForm.relevanceRating) {
      toast({
        title: "Error",
        description: "Please fill in all required ratings",
        variant: "destructive",
      });
      return;
    }

    submitFeedbackMutation.mutate({
      ...feedbackForm,
      sessionId: selectedSession.sessionId,
      enrollmentId: selectedSession.id,
    });
  };

  const openFeedbackModal = (session: any) => {
    setSelectedSession(session);
    setFeedbackForm({
      ...feedbackForm,
      sessionId: session.sessionId,
      enrollmentId: session.id,
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

  // Filter sessions that don't have feedback yet
  const sessionsNeedingFeedback = (completedSessions as any[]).filter((session: any) => 
    !(existingFeedback as any[]).some((feedback: any) => feedback.enrollmentId === session.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Training Feedback</h2>
      </div>

      {/* Sessions needing feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Sessions Awaiting Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sessionsNeedingFeedback.length === 0 ? (
            <p className="text-gray-500">No completed sessions awaiting feedback.</p>
          ) : (
            <div className="space-y-4">
              {sessionsNeedingFeedback.map((session: any) => (
                <div key={session.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{session.sessionTitle || session.title}</h3>
                    <p className="text-sm text-gray-600">
                      Completed on: {new Date(session.completionDate).toLocaleDateString()}
                    </p>
                    <Badge variant="outline" className="mt-1">
                      {session.sessionDate ? new Date(session.sessionDate).toLocaleDateString() : 'N/A'}
                    </Badge>
                  </div>
                  <Button onClick={() => openFeedbackModal(session)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Give Feedback
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submitted feedback history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Feedback History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(existingFeedback as any[]).length === 0 ? (
            <p className="text-gray-500">No feedback submitted yet.</p>
          ) : (
            <div className="space-y-4">
              {(existingFeedback as any[]).map((feedback: any) => (
                <div key={feedback.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{feedback.sessionTitle}</h3>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(feedback.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                        <span>{feedback.overallRating}/5</span>
                      </div>
                    </div>
                  </div>
                  {feedback.comments && (
                    <p className="mt-2 text-sm">{feedback.comments}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Training Feedback</DialogTitle>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">{selectedSession.sessionTitle || selectedSession.title}</h3>
                <p className="text-sm text-gray-600">
                  Session Date: {selectedSession.sessionDate ? new Date(selectedSession.sessionDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StarRating
                  value={feedbackForm.overallRating}
                  onChange={(rating) => setFeedbackForm({ ...feedbackForm, overallRating: rating })}
                  label="Overall Rating"
                />
                <StarRating
                  value={feedbackForm.contentRating}
                  onChange={(rating) => setFeedbackForm({ ...feedbackForm, contentRating: rating })}
                  label="Content Quality"
                />
                <StarRating
                  value={feedbackForm.trainerRating}
                  onChange={(rating) => setFeedbackForm({ ...feedbackForm, trainerRating: rating })}
                  label="Trainer Effectiveness"
                />
                <StarRating
                  value={feedbackForm.relevanceRating}
                  onChange={(rating) => setFeedbackForm({ ...feedbackForm, relevanceRating: rating })}
                  label="Relevance to Job"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="comments">Comments</Label>
                  <Textarea
                    id="comments"
                    placeholder="Share your thoughts about the training..."
                    value={feedbackForm.comments}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="suggestions">Suggestions for Improvement</Label>
                  <Textarea
                    id="suggestions"
                    placeholder="How could this training be improved?"
                    value={feedbackForm.suggestions}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, suggestions: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitFeedback}
                  disabled={submitFeedbackMutation.isPending}
                >
                  {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}