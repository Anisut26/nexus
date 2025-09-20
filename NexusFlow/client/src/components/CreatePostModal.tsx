import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>("");

  const { data: userCommunities } = useQuery({
    queryKey: ["/api/users/communities"],
    retry: false,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; communityId?: string }) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      setSelectedCommunityId("");
      onOpenChange(false);
      toast({
        title: "Post created",
        description: "Your post has been shared successfully.",
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
        description: "Failed to create post.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Validation Error",
        description: "Post content is required.",
        variant: "destructive",
      });
      return;
    }

    const postData: { content: string; communityId?: string } = {
      content: content.trim(),
    };

    if (selectedCommunityId) {
      postData.communityId = selectedCommunityId;
    }

    createPostMutation.mutate(postData);
  };

  const handleClose = () => {
    setContent("");
    setSelectedCommunityId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]" data-testid="modal-create-post">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share your thoughts with the community.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium" data-testid="text-post-author">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                Posting as {user?.firstName}
              </p>
            </div>
          </div>

          {/* Community Selection */}
          <div>
            <Label htmlFor="community">Post to Community (Optional)</Label>
            <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
              <SelectTrigger data-testid="select-post-community">
                <SelectValue placeholder="Select a community (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Personal Post</SelectItem>
                {userCommunities?.map((community: any) => (
                  <SelectItem key={community.id} value={community.id}>
                    {community.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Content */}
          <div>
            <Label htmlFor="content">What's on your mind?</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, ideas, or updates..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
              data-testid="textarea-post-content"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-muted-foreground">
                {content.length}/2000 characters
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              data-testid="button-cancel-post"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!content.trim() || createPostMutation.isPending || content.length > 2000}
              data-testid="button-submit-post"
            >
              {createPostMutation.isPending ? "Posting..." : "Share Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
