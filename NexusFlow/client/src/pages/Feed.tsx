import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import CreatePostModal from "@/components/CreatePostModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function Feed() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/posts"],
    retry: false,
  });

  const { data: userCommunities } = useQuery({
    queryKey: ["/api/users/communities"],
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const filteredPosts = posts?.filter((post: any) => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "my-communities") {
      return userCommunities?.some((community: any) => community.id === post.communityId);
    }
    return true;
  }) || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Create Post Section */}
        <Card>
          <CardContent className="p-4">
            <Button 
              onClick={() => setIsCreatePostOpen(true)}
              className="w-full justify-start"
              variant="ghost"
              data-testid="button-create-post"
            >
              <Plus className="h-4 w-4 mr-2" />
              What's happening in your community?
            </Button>
          </CardContent>
        </Card>

        {/* Feed Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("all")}
                data-testid="filter-all"
              >
                All Posts
              </Button>
              <Button
                variant={selectedFilter === "my-communities" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("my-communities")}
                data-testid="filter-my-communities"
              >
                My Communities
              </Button>
              <Button
                variant={selectedFilter === "popular" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("popular")}
                data-testid="filter-popular"
              >
                Popular
              </Button>
              <Button
                variant={selectedFilter === "recent" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedFilter("recent")}
                data-testid="filter-recent"
              >
                Recent
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-48 w-full rounded-lg" />
                </CardContent>
              </Card>
            ))
          ) : filteredPosts.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground">
                  No posts found. {selectedFilter !== "all" && "Try changing your filter or "}
                  <Button
                    variant="link"
                    className="p-0 h-auto"
                    onClick={() => setIsCreatePostOpen(true)}
                    data-testid="link-create-first-post"
                  >
                    create your first post
                  </Button>
                  !
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPosts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))
          )}
        </div>

        <CreatePostModal 
          open={isCreatePostOpen} 
          onOpenChange={setIsCreatePostOpen}
        />
      </div>
    </Layout>
  );
}
