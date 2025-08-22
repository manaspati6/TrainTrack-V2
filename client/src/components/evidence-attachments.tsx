import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileText, Upload, Download, Eye, Plus, Trash2, AlertCircle } from "lucide-react";

interface AttachmentFormData {
  enrollmentId: number;
  sessionId: number;
  description: string;
  file: File | null;
}

export default function EvidenceAttachments() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);
  const [attachmentForm, setAttachmentForm] = useState<AttachmentFormData>({
    enrollmentId: 0,
    sessionId: 0,
    description: "",
    file: null,
  });

  // Get user's completed training sessions
  const { data: userEnrollments = [], isLoading } = useQuery({
    queryKey: ["/api/training-enrollments/user", user?.id],
    retry: false,
  });

  // Get existing attachments
  const { data: existingAttachments = [] } = useQuery({
    queryKey: ["/api/evidence-attachments", user?.id],
    retry: false,
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/evidence-attachments', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-attachments"] });
      setIsModalOpen(false);
      resetForm();
      toast({
        title: "Evidence Uploaded",
        description: "Training evidence has been uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: number) => {
      const response = await apiRequest("DELETE", `/api/evidence-attachments/${attachmentId}`, {});
      if (!response.ok) {
        throw new Error("Failed to delete attachment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-attachments"] });
      toast({
        title: "Evidence Deleted",
        description: "Training evidence has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete attachment",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAttachmentForm({
      enrollmentId: 0,
      sessionId: 0,
      description: "",
      file: null,
    });
    setSelectedEnrollment(null);
  };

  const handleSubmitAttachment = () => {
    if (!selectedEnrollment || !attachmentForm.file) {
      toast({
        title: "Error",
        description: "Please select a training session and upload a file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('evidence', attachmentForm.file);
    formData.append('enrollmentId', selectedEnrollment.id.toString());
    formData.append('sessionId', selectedEnrollment.sessionId.toString());
    formData.append('description', attachmentForm.description);

    uploadAttachmentMutation.mutate(formData);
  };

  const openUploadModal = (enrollment: any) => {
    setSelectedEnrollment(enrollment);
    setAttachmentForm({
      ...attachmentForm,
      enrollmentId: enrollment.id,
      sessionId: enrollment.sessionId,
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    setAttachmentForm({ ...attachmentForm, file });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadAttachment = (attachment: any) => {
    // Create a download link
    const link = document.createElement('a');
    link.href = `/api/evidence-attachments/download/${attachment.id}`;
    link.download = attachment.originalFileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <div className="animate-pulse text-lg">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Training Evidence Attachments</h2>
      </div>

      {/* Training sessions available for evidence upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload Training Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(userEnrollments as any[]).length === 0 ? (
            <p className="text-gray-500">No training sessions available for evidence upload.</p>
          ) : (
            <div className="space-y-4">
              {(userEnrollments as any[]).map((enrollment: any) => (
                <div key={enrollment.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">{enrollment.sessionTitle || enrollment.title}</h3>
                    <p className="text-sm text-gray-600">
                      Status: <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'}>
                        {enrollment.status}
                      </Badge>
                    </p>
                    <p className="text-sm text-gray-600">
                      Session Date: {enrollment.sessionDate ? new Date(enrollment.sessionDate).toLocaleDateString() : 'N/A'}
                    </p>
                    {enrollment.completionDate && (
                      <p className="text-sm text-gray-600">
                        Completed: {new Date(enrollment.completionDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button 
                    onClick={() => openUploadModal(enrollment)}
                    disabled={enrollment.status !== 'completed' && enrollment.status !== 'attended'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Evidence
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing attachments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Uploaded Evidence
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(existingAttachments as any[]).length === 0 ? (
            <p className="text-gray-500">No evidence files uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {(existingAttachments as any[]).map((attachment: any) => (
                <div key={attachment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{attachment.originalFileName}</h3>
                      <p className="text-sm text-gray-600">
                        Training: {attachment.sessionTitle}
                      </p>
                      <p className="text-sm text-gray-600">
                        Size: {formatFileSize(attachment.fileSize)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                      {attachment.description && (
                        <p className="text-sm mt-2">{attachment.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadAttachment(attachment)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this evidence file?')) {
                            deleteAttachmentMutation.mutate(attachment.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Training Evidence</DialogTitle>
          </DialogHeader>
          
          {selectedEnrollment && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">{selectedEnrollment.sessionTitle || selectedEnrollment.title}</h3>
                <p className="text-sm text-gray-600">
                  Session Date: {selectedEnrollment.sessionDate ? new Date(selectedEnrollment.sessionDate).toLocaleDateString() : 'N/A'}
                </p>
                <p className="text-sm text-gray-600">
                  Status: {selectedEnrollment.status}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="evidence-file">Evidence File *</Label>
                  <Input
                    id="evidence-file"
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.ppt,.pptx"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, XLSX, XLS, PPT, PPTX (Max 10MB)
                  </p>
                  {attachmentForm.file && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {attachmentForm.file.name} ({formatFileSize(attachmentForm.file.size)})
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this evidence document..."
                    value={attachmentForm.description}
                    onChange={(e) => setAttachmentForm({ ...attachmentForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>Evidence files will be stored securely and may be reviewed by your manager or HR.</span>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitAttachment}
                  disabled={uploadAttachmentMutation.isPending || !attachmentForm.file}
                >
                  {uploadAttachmentMutation.isPending ? "Uploading..." : "Upload Evidence"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}