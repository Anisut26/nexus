import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import Layout from "@/components/Layout";
import EventCard from "@/components/EventCard";
import CreateEventModal from "@/components/CreateEventModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";

export default function Events() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events"],
    retry: false,
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ["/api/events/upcoming"],
    retry: false,
  });

  const { data: userCommunities } = useQuery({
    queryKey: ["/api/users/communities"],
    retry: false,
  });

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, status }: { eventId: string; status: string }) => {
      const res = await apiRequest("POST", `/api/events/${eventId}/rsvp`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/upcoming"] });
      toast({
        title: "RSVP updated",
        description: "Your RSVP has been updated successfully.",
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
        description: "Failed to update RSVP.",
        variant: "destructive",
      });
    },
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

  const userCommunityIds = new Set(userCommunities?.map((uc: any) => uc.id) || []);

  const filteredEvents = events?.filter((event: any) => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "my-communities") {
      return matchesSearch && userCommunityIds.has(event.communityId);
    }
    
    if (filterType === "upcoming") {
      const eventDate = new Date(event.schedule);
      const now = new Date();
      return matchesSearch && eventDate > now;
    }
    
    return matchesSearch;
  }) || [];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h1 className="text-3xl font-bold">Events</h1>
          {userCommunities && userCommunities.length > 0 && (
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-event">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-events"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("all")}
                data-testid="filter-all-events"
              >
                All Events
              </Button>
              <Button
                variant={filterType === "upcoming" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("upcoming")}
                data-testid="filter-upcoming"
              >
                Upcoming
              </Button>
              <Button
                variant={filterType === "my-communities" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType("my-communities")}
                data-testid="filter-my-communities"
              >
                My Communities
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events Highlight */}
        {upcomingEvents && upcomingEvents.length > 0 && filterType === "all" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.slice(0, 3).map((event: any) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="bg-primary text-primary-foreground rounded-lg p-2 text-center min-w-[48px]">
                          <div className="text-xs font-medium">
                            {format(new Date(event.schedule), 'MMM')}
                          </div>
                          <div className="text-lg font-bold">
                            {format(new Date(event.schedule), 'd')}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm mb-1 truncate" data-testid={`text-upcoming-event-${event.id}`}>
                            {event.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">
                            {event.community.name}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(event.schedule), 'h:mm a')}</span>
                            {event.location && (
                              <>
                                <MapPin className="h-3 w-3 ml-2" />
                                <span className="truncate">{event.location}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                            <Users className="h-3 w-3" />
                            <span>{event.attendeesCount} going</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Events */}
        <Card>
          <CardHeader>
            <CardTitle>
              {filterType === "all" && "All Events"}
              {filterType === "upcoming" && "Upcoming Events"}
              {filterType === "my-communities" && "Events from My Communities"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm ? "No events found matching your search." : 
                   filterType === "my-communities" ? "No events in your communities yet." :
                   "No events available."}
                </p>
                {userCommunities && userCommunities.length > 0 && (
                  <Button 
                    className="mt-4" 
                    onClick={() => setIsCreateOpen(true)}
                    data-testid="button-create-first-event"
                  >
                    Create Your First Event
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event: any) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRSVP={(status) => rsvpMutation.mutate({ eventId: event.id, status })}
                    isRSVPing={rsvpMutation.isPending}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <CreateEventModal 
          open={isCreateOpen} 
          onOpenChange={setIsCreateOpen}
          userCommunities={userCommunities || []}
        />
      </div>
    </Layout>
  );
}
