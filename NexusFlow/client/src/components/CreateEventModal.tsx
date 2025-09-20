import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userCommunities: Array<{
    id: string;
    name: string;
    role: string;
  }>;
}

export default function CreateEventModal({ open, onOpenChange, userCommunities }: CreateEventModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    communityId: "",
    schedule: "",
    location: "",
    isVirtual: false,
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/events", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      resetForm();
      onOpenChange(false);
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
        description: "Failed to create event.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      communityId: "",
      schedule: "",
      location: "",
      isVirtual: false,
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Event title is required.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.communityId) {
      toast({
        title: "Validation Error",
        description: "Please select a community for the event.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.schedule) {
      toast({
        title: "Validation Error",
        description: "Event date and time is required.",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      ...formData,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      location: formData.isVirtual ? undefined : formData.location.trim() || undefined,
    };

    createEventMutation.mutate(eventData);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Filter communities where user can create events (lead or volunteer)
  const eligibleCommunities = userCommunities.filter(
    (community) => community.role === "lead" || community.role === "volunteer"
  );

  // Generate datetime-local input value format
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const minDateTime = now.toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="modal-create-event">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
          <DialogDescription>
            Organize a new event for your community.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {eligibleCommunities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                You need to be a community lead or volunteer to create events.
              </p>
            </div>
          ) : (
            <>
              {/* Event Title */}
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter event title"
                  data-testid="input-event-title"
                />
              </div>

              {/* Community Selection */}
              <div>
                <Label htmlFor="community">Community</Label>
                <Select 
                  value={formData.communityId} 
                  onValueChange={(value) => setFormData({ ...formData, communityId: value })}
                >
                  <SelectTrigger data-testid="select-event-community">
                    <SelectValue placeholder="Select a community" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleCommunities.map((community) => (
                      <SelectItem key={community.id} value={community.id}>
                        {community.name} ({community.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Description */}
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your event"
                  rows={3}
                  data-testid="textarea-event-description"
                />
              </div>

              {/* Event Date and Time */}
              <div>
                <Label htmlFor="schedule">Date and Time</Label>
                <Input
                  id="schedule"
                  type="datetime-local"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  min={minDateTime}
                  data-testid="input-event-schedule"
                />
              </div>

              {/* Virtual Event Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isVirtual"
                  checked={formData.isVirtual}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, isVirtual: !!checked })
                  }
                  data-testid="checkbox-event-virtual"
                />
                <Label htmlFor="isVirtual">This is a virtual event</Label>
              </div>

              {/* Location (only if not virtual) */}
              {!formData.isVirtual && (
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Enter event location"
                    data-testid="input-event-location"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                  data-testid="button-cancel-event"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createEventMutation.isPending}
                  data-testid="button-submit-event"
                >
                  {createEventMutation.isPending ? "Creating..." : "Create Event"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
