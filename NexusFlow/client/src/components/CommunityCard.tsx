import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, UserCheck } from "lucide-react";

interface CommunityCardProps {
  community: {
    id: string;
    name: string;
    description?: string;
    memberCount: number;
    leadId: string;
  };
  isMember: boolean;
  userRole?: string;
  onJoin: () => void;
  onLeave: () => void;
  isJoining: boolean;
  isLeaving: boolean;
}

export default function CommunityCard({ 
  community, 
  isMember, 
  userRole, 
  onJoin, 
  onLeave, 
  isJoining, 
  isLeaving 
}: CommunityCardProps) {
  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "lead": return <Crown className="h-3 w-3" />;
      case "volunteer": return <UserCheck className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "lead": return "Lead";
      case "volunteer": return "Volunteer";
      default: return "Member";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow" data-testid={`community-card-${community.id}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg" data-testid={`text-community-name-${community.id}`}>
                {community.name}
              </h3>
              {isMember && userRole && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {getRoleIcon(userRole)}
                  <span className="ml-1">{getRoleLabel(userRole)}</span>
                </Badge>
              )}
            </div>
          </div>
        </div>

        {community.description && (
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3" data-testid={`text-community-description-${community.id}`}>
            {community.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span data-testid={`text-community-member-count-${community.id}`}>
              {community.memberCount} members
            </span>
          </div>

          {isMember ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onLeave}
              disabled={isLeaving || userRole === "lead"}
              data-testid={`button-leave-community-${community.id}`}
            >
              {userRole === "lead" ? "Leading" : isLeaving ? "Leaving..." : "Leave"}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={onJoin}
              disabled={isJoining}
              data-testid={`button-join-community-${community.id}`}
            >
              {isJoining ? "Joining..." : "Join"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
