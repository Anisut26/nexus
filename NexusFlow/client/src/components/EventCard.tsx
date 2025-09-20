import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { format } from "date-fns";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description?: string;
    schedule: string;
    location?: string;
    isVirtual: boolean;
    attendeesCount: number;
    interestedCount: number;
    community: {
      id: string;
      name: string;
    };
    creator: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  onRSVP: (status: string) => void;
  isRSVPing: boolean;
}

export default function EventCard({ event, onRSVP, isRSVPing }: EventCardProps) {
  const eventDate = new Date(event.schedule);
  const isUpcoming = eventDate > new Date();

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`event-card-${event.id}`}>
      <CardContent className="p-6">
        {/* Event Header */}
        <div className="mb-4">
          <div className="flex items-start space-x-3">
            <div className="bg-primary text-primary-foreground rounded-lg p-3 text-center min-w-[64px]">
              <div className="text-xs font-medium">
                {format(eventDate, 'MMM')}
              </div>
              <div className="text-xl font-bold">
                {format(eventDate, 'd')}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg mb-1" data-testid={`text-event-title-${event.id}`}>
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-2" data-testid={`text-event-community-${event.id}`}>
                {event.community.name}
              </p>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span data-testid={`text-event-time-${event.id}`}>
                  {format(eventDate, 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Description */}
        {event.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3" data-testid={`text-event-description-${event.id}`}>
            {event.description}
          </p>
        )}

        {/* Event Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span data-testid={`text-event-date-${event.id}`}>
              {format(eventDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span data-testid={`text-event-location-${event.id}`}>
              {event.isVirtual ? "Virtual Event" : event.location || "Location TBA"}
            </span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span data-testid={`text-event-attendees-${event.id}`}>
              {event.attendeesCount} going • {event.interestedCount} interested
            </span>
          </div>
        </div>

        {/* Event Status and Actions */}
        <div className="flex items-center justify-between">
          <div>
            {!isUpcoming && (
              <Badge variant="secondary">Past Event</Badge>
            )}
          </div>

          {isUpcoming && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => onRSVP("going")}
                disabled={isRSVPing}
                data-testid={`button-rsvp-going-${event.id}`}
              >
                {isRSVPing ? "..." : "Going"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRSVP("interested")}
                disabled={isRSVPing}
                data-testid={`button-rsvp-interested-${event.id}`}
              >
                {isRSVPing ? "..." : "Interested"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
