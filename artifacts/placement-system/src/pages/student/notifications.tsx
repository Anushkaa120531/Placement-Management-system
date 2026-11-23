import { useListNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { getUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, FileText, Video, Trophy, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StudentNotifications() {
  const user = getUser();
  const { data, isLoading, refetch } = useListNotifications({ userId: user?.id }, { query: { enabled: !!user?.id } });
  const markReadMutation = useMarkNotificationRead();

  const getIcon = (type: string) => {
    switch (type) {
      case 'drive': return <Calendar className="text-blue-400" size={20} />;
      case 'application': return <FileText className="text-secondary" size={20} />;
      case 'interview': return <Video className="text-accent" size={20} />;
      case 'placement': return <Trophy className="text-yellow-500" size={20} />;
      default: return <Bell className="text-primary" size={20} />;
    }
  };

  const handleMarkRead = (id: number) => {
    markReadMutation.mutate({ id }, { onSuccess: () => refetch() });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground">Stay updated on your placement activities.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 glass-card rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {data?.map((notification: any) => (
            <Card 
              key={notification.id} 
              className={`border-border/50 cursor-pointer transition-all ${!notification.isRead ? 'glass-card-purple border-primary/30 glow-purple' : 'glass-card opacity-70'}`}
              onClick={() => !notification.isRead && handleMarkRead(notification.id)}
            >
              <CardContent className="p-4 flex gap-4 items-start">
                <div className={`p-3 rounded-full ${!notification.isRead ? 'bg-primary/20' : 'bg-background/50'}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${!notification.isRead ? 'text-foreground/80' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                )}
              </CardContent>
            </Card>
          ))}
          {!data?.length && (
            <div className="text-center p-12 text-muted-foreground glass-card rounded-xl">
              <Bell className="mx-auto mb-4 opacity-50" size={48} />
              No notifications yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
