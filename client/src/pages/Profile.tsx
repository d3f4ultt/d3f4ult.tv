import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Profile() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Not Logged In</CardTitle>
            <CardDescription>Please log in to view your profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayName = profile.discord_username || profile.username || 'User';
  const avatarUrl = profile.discord_avatar || profile.avatar_url || '';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  <p className="text-muted-foreground">{user.email || 'Discord Account'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="font-mono text-sm">{profile.id}</p>
                </div>

                {profile.discord_id && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Discord ID</label>
                    <p className="font-mono text-sm">{profile.discord_id}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-sm">{new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges & Roles Card */}
          <Card>
            <CardHeader>
              <CardTitle>Badges & Roles</CardTitle>
              <CardDescription>Your special privileges and roles</CardDescription>
            </CardHeader>
            <CardContent>
              {profile.has_special_badge ? (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">VIP Member</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You have special access and privileges in the d3f4ult.tv community!
                  </p>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Join our Discord server and get verified to unlock special badges!
                  </p>
                </div>
              )}

              {profile.discord_roles && profile.discord_roles.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Discord Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {profile.discord_roles.map((role, index) => (
                      <Badge key={index} variant="secondary">
                        {role.role_name || role.role_id}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Accounts Card */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>Linked social accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.discord_username && (
                  <div className="flex items-center justify-between p-3 bg-[#5865F2]/10 rounded-lg">
                    <div>
                      <p className="font-medium">Discord</p>
                      <p className="text-sm text-muted-foreground">{profile.discord_username}</p>
                    </div>
                    <Badge variant="outline" className="bg-[#5865F2]/20 border-[#5865F2]/30">Connected</Badge>
                  </div>
                )}

                {profile.twitter_username && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                    <div>
                      <p className="font-medium">Twitter / X</p>
                      <p className="text-sm text-muted-foreground">@{profile.twitter_username}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30">Connected</Badge>
                  </div>
                )}

                {!profile.twitter_username && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg opacity-50">
                    <div>
                      <p className="font-medium">Twitter / X</p>
                      <p className="text-sm text-muted-foreground">Not connected</p>
                    </div>
                    <Badge variant="outline">Disconnected</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Card (placeholder for future features) */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Stats</CardTitle>
              <CardDescription>Your platform usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <p>Activity tracking coming soon!</p>
                <p className="text-sm mt-2">Watchlists, price alerts, and more...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
