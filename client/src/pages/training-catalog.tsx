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
import { BookOpen, Plus, Search, Clock, Users, Award, Filter } from "lucide-react";

export default function TrainingCatalog() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
      setIsCreateModalOpen(false);
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
        cost: "",
        currency: "USD",
        providerName: "",
        providerContact: "",
        location: "",
        externalUrl: "",
      });
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
                <h2 className="text-2xl font-bold text-gray-900" data-testid="text-catalog-title">Training Catalog</h2>
                <p className="text-gray-600 mt-1">Manage training courses and compliance requirements</p>
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
                          <Button variant="ghost" size="sm" className="text-manufacturing-blue hover:text-blue-700" data-testid={`button-view-${training.id}`}>
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
      </main>
    </div>
  );
}
