import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Calendar, Edit } from "lucide-react";

export default function Profile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: userPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/posts"],
    retry: false,
  });

  const { data: userCommunities, isLoading: communitiesLoading } = useQuery({
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

  if (authLoading || !isAuthenticated || !user) {
    return <div>Loading...</div>;
  }

  const userOwnPosts = userPosts?.filter((post: any) => post.userId === user.id) || [];

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
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <Avatar className="h-24 w-24 mx-auto md:mx-0">
                <AvatarImage 
                  src={user.profileImageUrl || undefined} 
                  alt={`${user.firstName} ${user.lastName}`}
                />
                <AvatarFallback className="text-2xl">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold" data-testid="text-user-name">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-muted-foreground mb-2" data-testid="text-user-email">
                  {user.email}
                </p>
                <Badge variant={getRoleColor(user.role)} data-testid="badge-user-role">
                  {getRoleLabel(user.role)}
                </Badge>
                {user.bio && (
                  <p className="mt-3 text-sm" data-testid="text-user-bio">
                    {user.bio}
                  </p>
                )}
              </div>
              
              <Button size="sm" data-testid="button-edit-profile">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Communities</CardTitle>
              <Users className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-communities-count">
                {communitiesLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  userCommunities?.length || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Communities you're part of
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts Created</CardTitle>
              <Calendar className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-posts-count">
                {postsLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  userOwnPosts.length
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Total posts you've shared
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Communities List */}
        <Card>
          <CardHeader>
            <CardTitle>My Communities</CardTitle>
          </CardHeader>
          <CardContent>
            {communitiesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : userCommunities?.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                You haven't joined any communities yet.
              </p>
            ) : (
              <div className="space-y-3">
                {userCommunities?.map((community: any) => (
                  <div key={community.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-community-${community.id}`}>
                        {community.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getRoleLabel(community.role)}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {community.memberCount} members
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>My Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {postsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : userOwnPosts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                You haven't created any posts yet.
              </p>
            ) : (
              <div className="space-y-4">
                {userOwnPosts.slice(0, 5).map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
