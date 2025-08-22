import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Plus, Search, Clock, Users, Award, Filter, Download, Upload, FileSpreadsheet, MessageSquare, TrendingUp, FileText, Shield, BarChart3 } from "lucide-react";
import TrainingFeedback from "../components/training-feedback";
import ManagerEvaluations from "../components/manager-evaluations";
import EvidenceAttachments from "../components/evidence-attachments";
import ComplianceManagement from "../components/compliance-management";
import TrainingHoursReport from "../components/training-hours-report";

export default function TrainingCatalog() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState("catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [newTraining, setNewTraining] = useState({
    title: "",
    description: "",
    type: "",
    category: "",
    duration: "",
    validityPeriod: "",
    complianceStandard: "",
    prerequisites: "",
    isRequired: false,
    // Trainer fields
    trainerName: "",
    trainerType: "",
    // External training fields
    cost: "",
    currency: "USD",
    providerName: "",
    providerContact: "",
    location: "",
    externalUrl: "",
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

  const { data: trainingCatalog = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ["/api/training-catalog"],
    retry: false,
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/training-catalog/bulk-import', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-catalog"] });
      setIsImporting(false);
      toast({
        title: "Import Successful",
        description: data.message + (data.errors ? ` ${data.errors.length} rows had errors.` : ''),
        variant: data.errors ? "destructive" : "default",
      });
      
      if (data.errors && data.errors.length > 0) {
        console.log("Import errors:", data.errors);
        // You can show detailed errors in a modal or download an error report
      }
    },
    onError: (error: Error) => {
      setIsImporting(false);
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
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createTrainingMutation = useMutation({
    mutationFn: async (trainingData: any) => {
      console.log("Sending training data:", trainingData);
      const response = await apiRequest("POST", "/api/training-catalog", trainingData);
      console.log("Response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-catalog"] });
      
      // Reset form immediately (no timeout to avoid button disable issues)
      setNewTraining({
        title: "",
        description: "",
        type: "",
        category: "",
        duration: "",
        validityPeriod: "",
        complianceStandard: "",
        prerequisites: "",
        isRequired: false,
        trainerName: "",
        trainerType: "",
        cost: "",
        currency: "USD",
        providerName: "",
        providerContact: "",
        location: "",
        externalUrl: "",
      });
      
      // Close modal with small delay for smooth transition
      setTimeout(() => {
        setIsCreateModalOpen(false);
      }, 50);
      
      toast({
        title: "Success",
        description: "Training course created successfully. Ready to create another!",
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  const filteredTraining = (trainingCatalog as any[]).filter((training: any) => {
    const matchesSearch = training.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         training.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || filterCategory === "all" || training.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateTraining = () => {
    if (!newTraining.title || !newTraining.type || !newTraining.category || !newTraining.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (Title, Type, Category, Duration)",
        variant: "destructive",
      });
      return;
    }

    // Check required fields for external training
    if (newTraining.type === 'external' && !newTraining.providerName.trim()) {
      toast({
        title: "Error",
        description: "Provider Name is required for external training",
        variant: "destructive",
      });
      return;
    }

    const trainingData = {
      title: newTraining.title.trim(),
      description: newTraining.description.trim() || null,
      type: newTraining.type,
      category: newTraining.category,
      duration: parseInt(newTraining.duration),
      validityPeriod: newTraining.validityPeriod ? parseInt(newTraining.validityPeriod) : null,
      complianceStandard: newTraining.complianceStandard.trim() || null,
      prerequisites: newTraining.prerequisites.trim() || null,
      isRequired: newTraining.isRequired,
      // Trainer fields
      trainerName: newTraining.trainerName.trim() || null,
      trainerType: newTraining.trainerType || null,
      // External training fields
      cost: newTraining.cost ? Math.round(parseFloat(newTraining.cost) * 100) : null, // Convert to cents
      currency: newTraining.currency || "USD",
      providerName: newTraining.providerName.trim() || null,
      providerContact: newTraining.providerContact.trim() || null,
      location: newTraining.location.trim() || null,
      externalUrl: newTraining.externalUrl.trim() || null,
    };

    console.log("Creating training with data:", trainingData);
    createTrainingMutation.mutate(trainingData);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/training-catalog/template', {
        method: 'GET',
        headers: {
          'Authorization': localStorage.getItem('authToken') || '',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Ensure we get the blob with proper MIME type
      const blob = await response.blob();
      
      // Create blob with explicit Excel MIME type if needed
      const excelBlob = new Blob([blob], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      const url = window.URL.createObjectURL(excelBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'training-catalog-template.xlsx';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Clean up immediately
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Template Downloaded",
        description: "Excel template has been downloaded successfully. Check your Downloads folder.",
      });
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download Excel template: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      event.target.value = ''; // Reset file input
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      event.target.value = ''; // Reset file input
      return;
    }
    
    setIsImporting(true);
    const formData = new FormData();
    formData.append('excel', file);
    
    bulkImportMutation.mutate(formData);
    event.target.value = ''; // Reset file input
  };

  const canCreateTraining = user?.role === 'hr_admin' || user?.role === 'manager';

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-20">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" data-testid="text-catalog-title">Training Management System</h2>
                <p className="text-gray-600 mt-1">Manage training courses, feedback, and compliance requirements</p>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input 
                    type="text" 
                    placeholder="Search training courses..." 
                    className="pl-10 pr-4 w-80"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search-catalog"
                  />
                </div>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-48" data-testid="select-category-filter">
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
                
                {canCreateTraining && (
                  <>
                    {/* Excel Import/Export Buttons */}
                    <Button 
                      variant="outline" 
                      onClick={handleDownloadTemplate}
                      className="border-manufacturing-blue text-manufacturing-blue hover:bg-manufacturing-blue hover:text-white"
                      data-testid="button-download-template"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Template
                    </Button>
                    
                    <div className="relative">
                      <input
                        type="file"
                        id="excel-upload"
                        accept=".xlsx,.xls"
                        onChange={handleFileImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        data-testid="input-excel-upload"
                      />
                      <Button 
                        variant="outline" 
                        disabled={isImporting || bulkImportMutation.isPending}
                        className="border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                        data-testid="button-import-excel"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isImporting ? "Importing..." : "Import Excel"}
                      </Button>
                    </div>
                  </>
                )}
                
                {canCreateTraining && (
                  <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-manufacturing-blue hover:bg-blue-700" data-testid="button-add-training-catalog">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Training
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Training Course</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="title">Training Title *</Label>
                            <Input
                              id="title"
                              value={newTraining.title}
                              onChange={(e) => setNewTraining({ ...newTraining, title: e.target.value })}
                              placeholder="e.g., OSHA Machine Safety"
                              data-testid="input-training-title"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="type">Training Type *</Label>
                            <Select 
                              value={newTraining.type} 
                              onValueChange={(value) => setNewTraining({ ...newTraining, type: value })}
                            >
                              <SelectTrigger data-testid="select-training-type">
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
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newTraining.description}
                            onChange={(e) => setNewTraining({ ...newTraining, description: e.target.value })}
                            placeholder="Describe the training objectives and content..."
                            rows={3}
                            data-testid="textarea-training-description"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="category">Category *</Label>
                            <Select 
                              value={newTraining.category} 
                              onValueChange={(value) => setNewTraining({ ...newTraining, category: value })}
                            >
                              <SelectTrigger data-testid="select-training-category">
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
                            <Label htmlFor="duration">Duration (hours) *</Label>
                            <Input
                              id="duration"
                              type="number"
                              min="0.5"
                              step="0.5"
                              value={newTraining.duration}
                              onChange={(e) => setNewTraining({ ...newTraining, duration: e.target.value })}
                              placeholder="2.0"
                              data-testid="input-training-duration"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="validityPeriod">Validity Period (months)</Label>
                            <Input
                              id="validityPeriod"
                              type="number"
                              min="1"
                              value={newTraining.validityPeriod}
                              onChange={(e) => setNewTraining({ ...newTraining, validityPeriod: e.target.value })}
                              placeholder="12"
                              data-testid="input-validity-period"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="complianceStandard">Compliance Standard</Label>
                            <Input
                              id="complianceStandard"
                              value={newTraining.complianceStandard}
                              onChange={(e) => setNewTraining({ ...newTraining, complianceStandard: e.target.value })}
                              placeholder="e.g., ISO 45001, OSHA 29 CFR"
                              data-testid="input-compliance-standard"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="prerequisites">Prerequisites</Label>
                          <Textarea
                            id="prerequisites"
                            value={newTraining.prerequisites}
                            onChange={(e) => setNewTraining({ ...newTraining, prerequisites: e.target.value })}
                            placeholder="List any required prerequisites or prior training..."
                            rows={2}
                            data-testid="textarea-prerequisites"
                          />
                        </div>

                        {/* Trainer Information */}
                        <div className="border-t pt-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Trainer Information</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="trainerName">Trainer Name</Label>
                              <Input
                                id="trainerName"
                                value={newTraining.trainerName}
                                onChange={(e) => setNewTraining({ ...newTraining, trainerName: e.target.value })}
                                placeholder="e.g., John Smith or TBD"
                                data-testid="input-trainer-name"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="trainerType">Trainer Type</Label>
                              <Select 
                                value={newTraining.trainerType} 
                                onValueChange={(value) => setNewTraining({ ...newTraining, trainerType: value })}
                              >
                                <SelectTrigger data-testid="select-trainer-type">
                                  <SelectValue placeholder="Select trainer type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="internal">Internal Employee</SelectItem>
                                  <SelectItem value="external">External Trainer</SelectItem>
                                  <SelectItem value="contractor">Contractor</SelectItem>
                                  <SelectItem value="vendor">Vendor/Provider</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* External Training Specific Fields */}
                        {newTraining.type === 'external' && (
                          <>
                            <div className="border-t pt-6">
                              <h4 className="text-lg font-medium text-gray-900 mb-4">External Training Details</h4>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="providerName">Provider/Institute Name *</Label>
                                  <Input
                                    id="providerName"
                                    value={newTraining.providerName}
                                    onChange={(e) => setNewTraining({ ...newTraining, providerName: e.target.value })}
                                    placeholder="e.g., Safety Training Institute"
                                    data-testid="input-provider-name"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="location">Location</Label>
                                  <Input
                                    id="location"
                                    value={newTraining.location}
                                    onChange={(e) => setNewTraining({ ...newTraining, location: e.target.value })}
                                    placeholder="e.g., Chicago, IL or Online"
                                    data-testid="input-location"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                  <Label htmlFor="cost">Cost ($)</Label>
                                  <Input
                                    id="cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newTraining.cost}
                                    onChange={(e) => setNewTraining({ ...newTraining, cost: e.target.value })}
                                    placeholder="500.00"
                                    data-testid="input-cost"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="providerContact">Provider Contact</Label>
                                  <Input
                                    id="providerContact"
                                    value={newTraining.providerContact}
                                    onChange={(e) => setNewTraining({ ...newTraining, providerContact: e.target.value })}
                                    placeholder="contact@provider.com or (555) 123-4567"
                                    data-testid="input-provider-contact"
                                  />
                                </div>
                              </div>
                              
                              <div className="mt-4">
                                <Label htmlFor="externalUrl">Provider Website/Course URL</Label>
                                <Input
                                  id="externalUrl"
                                  type="url"
                                  value={newTraining.externalUrl}
                                  onChange={(e) => setNewTraining({ ...newTraining, externalUrl: e.target.value })}
                                  placeholder="https://provider.com/course-page"
                                  data-testid="input-external-url"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <div className="flex justify-end space-x-3 pt-6">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsCreateModalOpen(false)}
                            data-testid="button-cancel-training"
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            onClick={handleCreateTraining}
                            disabled={
                              createTrainingMutation.isPending || 
                              !newTraining.title || 
                              !newTraining.type || 
                              !newTraining.category || 
                              !newTraining.duration ||
                              (newTraining.type === 'external' && !newTraining.providerName.trim())
                            }
                            className="bg-manufacturing-blue hover:bg-blue-700"
                            data-testid="button-create-training"
                          >
                            {createTrainingMutation.isPending ? "Creating..." : "Create Training"}
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

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <nav className="px-6">
            <div className="flex space-x-8">
              {[
                { id: "catalog", label: "Training Catalog", icon: BookOpen },
                { id: "feedback", label: "Training Feedback", icon: MessageSquare },
                { id: "evaluations", label: "Manager Evaluations", icon: TrendingUp, roles: ["manager", "hr_admin"] },
                { id: "evidence", label: "Evidence Attachments", icon: FileText },
                { id: "compliance", label: "Compliance Management", icon: Shield, roles: ["manager", "hr_admin"] },
                { id: "reports", label: "Training Hours Report", icon: BarChart3, roles: ["manager", "hr_admin"] },
              ].filter(tab => !tab.roles || tab.roles.includes(user?.role || "")).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "catalog" && (
          <div className="p-6">
          {isLoadingCatalog ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-gray-500">Loading training catalog...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredTraining.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500" data-testid="text-no-training">
                  {searchTerm || filterCategory ? "No training courses match your filters" : "No training courses available"}
                </div>
              ) : (
                filteredTraining.map((training: any) => (
                  <Card key={training.id} className="hover:shadow-lg transition-shadow" data-testid={`card-training-${training.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            training.category === 'safety' ? 'bg-red-100 text-red-600' :
                            training.category === 'quality' ? 'bg-blue-100 text-blue-600' :
                            training.category === 'compliance' ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg" data-testid={`text-training-title-${training.id}`}>
                              {training.title}
                            </CardTitle>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs" data-testid={`badge-category-${training.id}`}>
                                {training.category}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${training.type === 'internal' ? 'text-blue-600' : 'text-green-600'}`}
                                data-testid={`badge-type-${training.id}`}
                              >
                                {training.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {training.isRequired && (
                          <Badge variant="destructive" className="text-xs" data-testid={`badge-required-${training.id}`}>
                            Required
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3" data-testid={`text-description-${training.id}`}>
                        {training.description || "No description available"}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-2" />
                          <span data-testid={`text-duration-${training.id}`}>{training.duration} hours</span>
                        </div>
                        
                        {training.validityPeriod && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Award className="h-4 w-4 mr-2" />
                            <span data-testid={`text-validity-${training.id}`}>Valid for {training.validityPeriod} months</span>
                          </div>
                        )}
                        
                        {training.complianceStandard && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="h-4 w-4 mr-2" />
                            <span data-testid={`text-standard-${training.id}`}>{training.complianceStandard}</span>
                          </div>
                        )}

                        {/* Trainer information */}
                        {training.trainerName && (
                          <div className="flex items-center text-sm text-blue-600 font-medium">
                            <Users className="h-4 w-4 mr-2" />
                            <span data-testid={`text-trainer-${training.id}`}>
                              {training.trainerName} {training.trainerType && `(${training.trainerType})`}
                            </span>
                          </div>
                        )}

                        {/* External training specific info */}
                        {training.type === 'external' && (
                          <>
                            {training.providerName && (
                              <div className="flex items-center text-sm text-gray-500">
                                <BookOpen className="h-4 w-4 mr-2" />
                                <span data-testid={`text-provider-${training.id}`}>{training.providerName}</span>
                              </div>
                            )}
                            {training.location && (
                              <div className="flex items-center text-sm text-gray-500">
                                <Users className="h-4 w-4 mr-2" />
                                <span data-testid={`text-location-${training.id}`}>{training.location}</span>
                              </div>
                            )}
                            {training.cost && (
                              <div className="flex items-center text-sm text-green-600 font-medium">
                                <span data-testid={`text-cost-${training.id}`}>
                                  ${(training.cost / 100).toFixed(2)} {training.currency || 'USD'}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-xs text-gray-400" data-testid={`text-created-${training.id}`}>
                          Created {new Date(training.createdAt).toLocaleDateString()}
                        </span>
                        <div className="space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-manufacturing-blue hover:text-blue-700" 
                            data-testid={`button-view-${training.id}`}
                            onClick={() => {
                              setSelectedTraining(training);
                              setIsDetailsModalOpen(true);
                            }}
                          >
                            View Details
                          </Button>
                          {canCreateTraining && (
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900" data-testid={`button-edit-${training.id}`}>
                              Edit
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
          </div>
        )}

        {/* Other Tab Contents */}
        {activeTab === "feedback" && (
          <div className="p-6">
            <TrainingFeedback />
          </div>
        )}

        {activeTab === "evaluations" && (
          <div className="p-6">
            <ManagerEvaluations />
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="p-6">
            <EvidenceAttachments />
          </div>
        )}

        {activeTab === "compliance" && (
          <div className="p-6">
            <ComplianceManagement />
          </div>
        )}

        {activeTab === "reports" && (
          <div className="p-6">
            <TrainingHoursReport />
          </div>
        )}
      </main>

      {/* Training Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {selectedTraining?.title}
            </DialogTitle>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {selectedTraining?.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {selectedTraining?.type}
              </Badge>
              {selectedTraining?.isRequired && (
                <Badge variant="destructive" className="text-xs">Required</Badge>
              )}
            </div>
          </DialogHeader>
          
          {selectedTraining && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">
                  {selectedTraining.description || "No description available"}
                </p>
              </div>

              {/* Training Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Training Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{selectedTraining.duration} hours</span>
                    </div>
                    {selectedTraining.validityPeriod && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Valid for:</span>
                        <span className="font-medium">{selectedTraining.validityPeriod} months</span>
                      </div>
                    )}
                    {selectedTraining.complianceStandard && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Standard:</span>
                        <span className="font-medium">{selectedTraining.complianceStandard}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Trainer Info */}
                {(selectedTraining.trainerName || selectedTraining.trainerType) && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Trainer Information</h4>
                    <div className="space-y-2">
                      {selectedTraining.trainerName && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trainer:</span>
                          <span className="font-medium">{selectedTraining.trainerName}</span>
                        </div>
                      )}
                      {selectedTraining.trainerType && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">{selectedTraining.trainerType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* External Training Details */}
              {selectedTraining.type === 'external' && (selectedTraining.providerName || selectedTraining.location || selectedTraining.cost) && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">External Training Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedTraining.providerName && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Provider:</span>
                        <span className="font-medium">{selectedTraining.providerName}</span>
                      </div>
                    )}
                    {selectedTraining.location && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="font-medium">{selectedTraining.location}</span>
                      </div>
                    )}
                    {selectedTraining.cost && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost:</span>
                        <span className="font-medium text-green-600">
                          ${(selectedTraining.cost / 100).toFixed(2)} {selectedTraining.currency || 'USD'}
                        </span>
                      </div>
                    )}
                    {selectedTraining.providerContact && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contact:</span>
                        <span className="font-medium">{selectedTraining.providerContact}</span>
                      </div>
                    )}
                  </div>
                  {selectedTraining.externalUrl && (
                    <div className="mt-3">
                      <span className="text-gray-600">Course URL: </span>
                      <a 
                        href={selectedTraining.externalUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {selectedTraining.externalUrl}
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Prerequisites */}
              {selectedTraining.prerequisites && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Prerequisites</h4>
                  <p className="text-gray-600">{selectedTraining.prerequisites}</p>
                </div>
              )}

              {/* Creation Info */}
              <div className="border-t pt-4 text-sm text-gray-500">
                Created on {new Date(selectedTraining.createdAt).toLocaleDateString()} 
                {selectedTraining.updatedAt && selectedTraining.updatedAt !== selectedTraining.createdAt && 
                  ` • Updated on ${new Date(selectedTraining.updatedAt).toLocaleDateString()}`
                }
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
