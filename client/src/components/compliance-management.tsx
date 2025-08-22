import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Edit, Trash2, Search, Filter, AlertTriangle } from "lucide-react";

interface ComplianceRequirement {
  id: number;
  standard: string;
  requirement: string;
  description: string;
  frequency: string;
  department: string;
  role: string;
  trainingCatalogId: number | null;
  isActive: boolean;
  createdAt: string;
}

interface RequirementFormData {
  standard: string;
  requirement: string;
  description: string;
  frequency: string;
  department: string;
  role: string;
  trainingCatalogId: string;
  isActive: boolean;
}

export default function ComplianceManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<ComplianceRequirement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStandard, setFilterStandard] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [requirementForm, setRequirementForm] = useState<RequirementFormData>({
    standard: "",
    requirement: "",
    description: "",
    frequency: "",
    department: "",
    role: "",
    trainingCatalogId: "",
    isActive: true,
  });

  // Get compliance requirements
  const { data: complianceRequirements = [], isLoading } = useQuery({
    queryKey: ["/api/compliance-requirements"],
    retry: false,
    enabled: user?.role === 'hr_admin' || user?.role === 'manager',
  });

  // Get training catalog for linking
  const { data: trainingCatalog = [] } = useQuery({
    queryKey: ["/api/training-catalog"],
    retry: false,
    enabled: user?.role === 'hr_admin' || user?.role === 'manager',
  });

  const createRequirementMutation = useMutation({
    mutationFn: async (requirementData: RequirementFormData) => {
      const response = await apiRequest("POST", "/api/compliance-requirements", {
        ...requirementData,
        trainingCatalogId: requirementData.trainingCatalogId ? parseInt(requirementData.trainingCatalogId) : null,
      });
      if (!response.ok) {
        throw new Error("Failed to create requirement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-requirements"] });
      setIsModalOpen(false);
      resetForm();
      toast({
        title: "Requirement Created",
        description: "Compliance requirement has been created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create compliance requirement",
        variant: "destructive",
      });
    },
  });

  const updateRequirementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RequirementFormData }) => {
      const response = await apiRequest("PUT", `/api/compliance-requirements/${id}`, {
        ...data,
        trainingCatalogId: data.trainingCatalogId ? parseInt(data.trainingCatalogId) : null,
      });
      if (!response.ok) {
        throw new Error("Failed to update requirement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-requirements"] });
      setIsModalOpen(false);
      resetForm();
      toast({
        title: "Requirement Updated",
        description: "Compliance requirement has been updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update compliance requirement",
        variant: "destructive",
      });
    },
  });

  const deleteRequirementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/compliance-requirements/${id}`, {});
      if (!response.ok) {
        throw new Error("Failed to delete requirement");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-requirements"] });
      toast({
        title: "Requirement Deleted",
        description: "Compliance requirement has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete compliance requirement",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setRequirementForm({
      standard: "",
      requirement: "",
      description: "",
      frequency: "",
      department: "",
      role: "",
      trainingCatalogId: "",
      isActive: true,
    });
    setEditingRequirement(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (requirement: ComplianceRequirement) => {
    setEditingRequirement(requirement);
    setRequirementForm({
      standard: requirement.standard,
      requirement: requirement.requirement,
      description: requirement.description || "",
      frequency: requirement.frequency || "",
      department: requirement.department || "",
      role: requirement.role || "",
      trainingCatalogId: requirement.trainingCatalogId?.toString() || "",
      isActive: requirement.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!requirementForm.standard || !requirementForm.requirement) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (editingRequirement) {
      updateRequirementMutation.mutate({ id: editingRequirement.id, data: requirementForm });
    } else {
      createRequirementMutation.mutate(requirementForm);
    }
  };

  const handleDelete = (requirement: ComplianceRequirement) => {
    if (confirm(`Are you sure you want to delete the requirement "${requirement.requirement}"?`)) {
      deleteRequirementMutation.mutate(requirement.id);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse text-lg">Loading...</div>;
  }

  if (user?.role !== 'hr_admin' && user?.role !== 'manager') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Access denied. Only HR admins and managers can view this page.</p>
      </div>
    );
  }

  // Filter requirements
  const filteredRequirements = (complianceRequirements as ComplianceRequirement[]).filter((req) => {
    const matchesSearch = req.requirement.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.standard.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStandard = !filterStandard || req.standard === filterStandard;
    const matchesDepartment = !filterDepartment || req.department === filterDepartment;
    return matchesSearch && matchesStandard && matchesDepartment;
  });

  // Get unique standards and departments for filtering
  const uniqueStandards = Array.from(new Set((complianceRequirements as ComplianceRequirement[]).map(req => req.standard)));
  const uniqueDepartments = Array.from(new Set((complianceRequirements as ComplianceRequirement[]).map(req => req.department).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Compliance Requirements Management</h2>
        {user?.role === 'hr_admin' && (
          <Button onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Requirement
          </Button>
        )}
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requirements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStandard} onValueChange={setFilterStandard}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Standard" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Standards</SelectItem>
                {uniqueStandards.map((standard) => (
                  <SelectItem key={standard} value={standard}>
                    {standard}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={setFilterDepartment}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {uniqueDepartments.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requirements list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Compliance Requirements ({filteredRequirements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequirements.length === 0 ? (
            <p className="text-gray-500">No compliance requirements found.</p>
          ) : (
            <div className="space-y-4">
              {filteredRequirements.map((requirement) => (
                <div key={requirement.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{requirement.requirement}</h3>
                        {!requirement.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{requirement.description}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{requirement.standard}</Badge>
                        {requirement.frequency && (
                          <Badge variant="outline">Frequency: {requirement.frequency}</Badge>
                        )}
                        {requirement.department && (
                          <Badge variant="outline">Dept: {requirement.department}</Badge>
                        )}
                        {requirement.role && (
                          <Badge variant="outline">Role: {requirement.role}</Badge>
                        )}
                      </div>
                      {requirement.trainingCatalogId && (
                        <p className="text-xs text-blue-600 mt-1">
                          Linked to training catalog
                        </p>
                      )}
                    </div>
                    {user?.role === 'hr_admin' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(requirement)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(requirement)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRequirement ? "Edit Compliance Requirement" : "Create Compliance Requirement"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="standard">Compliance Standard *</Label>
                <Input
                  id="standard"
                  placeholder="e.g., ISO45001, OSHA, GDPR"
                  value={requirementForm.standard}
                  onChange={(e) => setRequirementForm({ ...requirementForm, standard: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Select value={requirementForm.frequency} onValueChange={(value) => setRequirementForm({ ...requirementForm, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="biannual">Biannual</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="requirement">Requirement Title *</Label>
              <Input
                id="requirement"
                placeholder="Brief title of the requirement"
                value={requirementForm.requirement}
                onChange={(e) => setRequirementForm({ ...requirementForm, requirement: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the compliance requirement"
                value={requirementForm.description}
                onChange={(e) => setRequirementForm({ ...requirementForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={requirementForm.department} onValueChange={(value) => setRequirementForm({ ...requirementForm, department: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Departments</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Quality">Quality</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={requirementForm.role} onValueChange={(value) => setRequirementForm({ ...requirementForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Roles</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="hr_admin">HR Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="trainingCatalogId">Linked Training</Label>
              <Select value={requirementForm.trainingCatalogId} onValueChange={(value) => setRequirementForm({ ...requirementForm, trainingCatalogId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Link to training course (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No linked training</SelectItem>
                  {(trainingCatalog as any[]).map((training) => (
                    <SelectItem key={training.id} value={training.id.toString()}>
                      {training.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={requirementForm.isActive}
                onChange={(e) => setRequirementForm({ ...requirementForm, isActive: e.target.checked })}
              />
              <Label htmlFor="isActive">Active Requirement</Label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createRequirementMutation.isPending || updateRequirementMutation.isPending}
            >
              {createRequirementMutation.isPending || updateRequirementMutation.isPending 
                ? "Saving..." 
                : editingRequirement ? "Update Requirement" : "Create Requirement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}