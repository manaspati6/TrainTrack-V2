import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUpload from "./file-upload";

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "session" | "catalog";
  catalogData?: any[];
}

export default function TrainingModal({ isOpen, onClose, mode = "session", catalogData = [] }: TrainingModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
    category: "",
    duration: "",
    validityPeriod: "",
    complianceStandard: "",
    prerequisites: "",
    sessionDate: "",
    venue: "",
    trainerName: "",
    trainerType: "",
    maxParticipants: "",
    catalogId: "",
    materials: [] as File[],
  });

  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: any) => {
      const response = await apiRequest("POST", "/api/training-sessions", sessionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-sessions"] });
      resetForm();
      onClose();
      toast({
        title: "Success",
        description: "Training session created successfully",
      });
    },
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
      toast({
        title: "Error",
        description: "Failed to create training session",
        variant: "destructive",
      });
    },
  });

  const createCatalogMutation = useMutation({
    mutationFn: async (catalogData: any) => {
      const response = await apiRequest("POST", "/api/training-catalog", catalogData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-catalog"] });
      resetForm();
      onClose();
      toast({
        title: "Success",
        description: "Training course created successfully",
      });
    },
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
      toast({
        title: "Error",
        description: "Failed to create training course",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
      category: "",
      duration: "",
      validityPeriod: "",
      complianceStandard: "",
      prerequisites: "",
      sessionDate: "",
      venue: "",
      trainerName: "",
      trainerType: "",
      maxParticipants: "",
      catalogId: "",
      materials: [],
    });
  };

  const handleSubmit = () => {
    if (mode === "session") {
      const sessionData = {
        catalogId: formData.catalogId ? parseInt(formData.catalogId) : null,
        title: formData.title,
        sessionDate: new Date(formData.sessionDate).toISOString(),
        duration: parseInt(formData.duration),
        venue: formData.venue,
        trainerName: formData.trainerName,
        trainerType: formData.trainerType,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        materials: JSON.stringify(formData.materials.map(f => f.name)),
      };
      createSessionMutation.mutate(sessionData);
    } else {
      const catalogData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        duration: parseInt(formData.duration),
        validityPeriod: formData.validityPeriod ? parseInt(formData.validityPeriod) : null,
        complianceStandard: formData.complianceStandard,
        prerequisites: formData.prerequisites,
        isRequired: false,
      };
      createCatalogMutation.mutate(catalogData);
    }
  };

  const canCreate = user?.role === 'hr_admin' || user?.role === 'manager';

  if (!canCreate) {
    return null;
  }

  const isLoading = createSessionMutation.isPending || createCatalogMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto" data-testid="training-modal">
        <DialogHeader>
          <DialogTitle>
            {mode === "session" ? "Create New Training Session" : "Create New Training Course"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={mode === "session" ? "Training Session Title" : "Training Course Title"}
                data-testid="input-title"
              />
            </div>
            
            {mode === "session" ? (
              <div>
                <Label htmlFor="catalogId">Training Course</Label>
                <Select 
                  value={formData.catalogId} 
                  onValueChange={(value) => setFormData({ ...formData, catalogId: value })}
                >
                  <SelectTrigger data-testid="select-catalog">
                    <SelectValue placeholder="Select from catalog (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {catalogData.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="type">Training Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Training</SelectItem>
                    <SelectItem value="external">External Training</SelectItem>
                    <SelectItem value="certification">Certification Course</SelectItem>
                    <SelectItem value="compliance">Compliance Refresher</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {mode === "catalog" && (
            <>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the training objectives and content..."
                  rows={3}
                  data-testid="textarea-description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="validityPeriod">Validity Period (months)</Label>
                  <Input
                    id="validityPeriod"
                    type="number"
                    min="1"
                    value={formData.validityPeriod}
                    onChange={(e) => setFormData({ ...formData, validityPeriod: e.target.value })}
                    placeholder="12"
                    data-testid="input-validity"
                  />
                </div>
              </div>
            </>
          )}

          {mode === "session" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sessionDate">Date & Time *</Label>
                  <Input
                    id="sessionDate"
                    type="datetime-local"
                    value={formData.sessionDate}
                    onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                    data-testid="input-session-date"
                  />
                </div>
                
                <div>
                  <Label htmlFor="venue">Venue</Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    placeholder="Training room, online, etc."
                    data-testid="input-venue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trainerName">Trainer Name</Label>
                  <Input
                    id="trainerName"
                    value={formData.trainerName}
                    onChange={(e) => setFormData({ ...formData, trainerName: e.target.value })}
                    placeholder="Trainer or instructor name"
                    data-testid="input-trainer-name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="trainerType">Trainer Type</Label>
                  <Select 
                    value={formData.trainerType} 
                    onValueChange={(value) => setFormData({ ...formData, trainerType: value })}
                  >
                    <SelectTrigger data-testid="select-trainer-type">
                      <SelectValue placeholder="Select trainer type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="external">External</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    min="1"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    placeholder="20"
                    data-testid="input-max-participants"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="duration">Duration (hours) *</Label>
            <Input
              id="duration"
              type="number"
              min="0.5"
              step="0.5"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="2.0"
              data-testid="input-duration"
            />
          </div>

          {mode === "catalog" && (
            <>
              <div>
                <Label htmlFor="complianceStandard">Compliance Standard</Label>
                <Input
                  id="complianceStandard"
                  value={formData.complianceStandard}
                  onChange={(e) => setFormData({ ...formData, complianceStandard: e.target.value })}
                  placeholder="e.g., ISO 45001, OSHA 29 CFR"
                  data-testid="input-compliance-standard"
                />
              </div>

              <div>
                <Label htmlFor="prerequisites">Prerequisites</Label>
                <Textarea
                  id="prerequisites"
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                  placeholder="List any required prerequisites or prior training..."
                  rows={2}
                  data-testid="textarea-prerequisites"
                />
              </div>
            </>
          )}

          {mode === "session" && (
            <div>
              <Label>Training Materials</Label>
              <FileUpload
                onFilesChange={(files) => setFormData({ ...formData, materials: files })}
                maxFiles={5}
                acceptedTypes={[".pdf", ".ppt", ".pptx", ".doc", ".docx"]}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit}
              disabled={isLoading || !formData.title || !formData.duration || (mode === "catalog" && (!formData.type || !formData.category))}
              className="bg-manufacturing-blue hover:bg-blue-700"
              data-testid="button-submit"
            >
              {isLoading ? "Creating..." : `Create ${mode === "session" ? "Session" : "Course"}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
