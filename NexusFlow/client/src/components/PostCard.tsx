import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share, MoreHorizontal, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: {
    id: string;
    content: string;
    mediaUrl?: string;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    createdAt: string;
    isLiked?: boolean;
    author: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
      role: string;
    };
    community?: {
      id: string;
      name: string;
    };
  };
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/posts/${post.id}/like`, {});
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/like`, {});
      }
    },
    onMutate: () => {
      // Optimistic update
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error) => {
      // Revert optimistic update
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount + 1 : likesCount - 1);
      
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
        description: "Failed to update like status.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${post.id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Post deleted",
        description: "Your post has been deleted successfully.",
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
        description: "Failed to delete post.",
        variant: "destructive",
      });
    },
  });

  const canDeletePost = user?.id === post.author.id || user?.role === "admin" || user?.role === "staff";

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "staff": return "secondary";
      case "community_lead": return "default";
      case "volunteer": return "outline";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "staff": return "Staff";
      case "community_lead": return "Community Lead";
      case "volunteer": return "Volunteer";
      default: return "User";
    }
  };

  return (
    <Card data-testid={`post-card-${post.id}`}>
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.profileImageUrl || undefined} />
              <AvatarFallback>
                {post.author.firstName[0]}{post.author.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium" data-testid={`text-post-author-${post.id}`}>
                  {post.author.firstName} {post.author.lastName}
                </h4>
                <Badge variant={getRoleColor(post.author.role)} className="text-xs">
                  {getRoleLabel(post.author.role)}
                </Badge>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {post.community && (
                  <>
                    <span data-testid={`text-post-community-${post.id}`}>{post.community.name}</span>
                    <span>•</span>
                  </>
                )}
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span data-testid={`text-post-time-${post.id}`}>
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {canDeletePost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid={`button-post-menu-${post.id}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                  data-testid={`button-delete-post-${post.id}`}
                >
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-foreground whitespace-pre-wrap" data-testid={`text-post-content-${post.id}`}>
            {post.content}
          </p>
          {post.mediaUrl && (
            <div className="mt-3">
              <img 
                src={post.mediaUrl} 
                alt="Post media" 
                className="w-full h-64 object-cover rounded-lg"
                data-testid={`img-post-media-${post.id}`}
              />
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
              className={`flex items-center space-x-2 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'}`}
              data-testid={`button-like-${post.id}`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              <span data-testid={`text-likes-count-${post.id}`}>{likesCount}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-blue-500"
              data-testid={`button-comment-${post.id}`}
            >
              <MessageCircle className="h-4 w-4" />
              <span data-testid={`text-comments-count-${post.id}`}>{post.commentsCount}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-green-500"
              data-testid={`button-share-${post.id}`}
            >
              <Share className="h-4 w-4" />
              <span data-testid={`text-shares-count-${post.id}`}>{post.sharesCount}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
