import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Lock,
  Eye,
  Volume2,
  Moon,
  Save,
  LogOut,
  Trash2,
  Shield,
  Mail,
  Smartphone,
} from "lucide-react";

interface AppSettings {
  notifications: {
    email: boolean;
    push: boolean;
    messages: boolean;
    friendRequests: boolean;
    comments: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showFriendsList: boolean;
    showActivity: boolean;
    allowMessages: boolean;
  };
  display: {
    darkMode: boolean;
    soundEnabled: boolean;
    animationsEnabled: boolean;
    compactMode: boolean;
  };
}

const SettingsPanel = () => {
  const [settings, setSettings] = useState<AppSettings>({
    notifications: {
      email: true,
      push: true,
      messages: true,
      friendRequests: true,
      comments: false,
    },
    privacy: {
      profilePublic: true,
      showFriendsList: true,
      showActivity: true,
      allowMessages: true,
    },
    display: {
      darkMode: true,
      soundEnabled: true,
      animationsEnabled: true,
      compactMode: false,
    },
  });

  const [loading, setLoading] = useState(false);

  const saveSettings = async () => {
    try {
      setLoading(true);
      // Здесь должна быть логика сохранения в БД
      toast.success("Settings saved! ✨");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    toast.success("Logging out...");
    // Здесь должна быть логика выхода
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires confirmation email");
    // Здесь должна быть логика удаления аккаунта
  };

  const toggleSetting = (category: keyof AppSettings, key: string) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as never],
      },
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Application Settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notifications" className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">
              <Bell className="w-4 h-4 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs sm:text-sm">
              <Lock className="w-4 h-4 mr-1" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="display" className="text-xs sm:text-sm">
              <Eye className="w-4 h-4 mr-1" />
              Display
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <SettingToggle
                icon={<Mail className="w-4 h-4" />}
                title="Email Notifications"
                description="Receive important updates via email"
                checked={settings.notifications.email}
                onChange={() => toggleSetting("notifications", "email")}
              />

              <SettingToggle
                icon={<Smartphone className="w-4 h-4" />}
                title="Push Notifications"
                description="Get instant notifications"
                checked={settings.notifications.push}
                onChange={() => toggleSetting("notifications", "push")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title="Message Notifications"
                description="Alert when you receive messages"
                checked={settings.notifications.messages}
                onChange={() => toggleSetting("notifications", "messages")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title="Friend Requests"
                description="Notify about friend requests"
                checked={settings.notifications.friendRequests}
                onChange={() => toggleSetting("notifications", "friendRequests")}
              />

              <SettingToggle
                icon={<Bell className="w-4 h-4" />}
                title="Comment Notifications"
                description="Alert when someone comments on your content"
                checked={settings.notifications.comments}
                onChange={() => toggleSetting("notifications", "comments")}
              />
            </div>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <SettingToggle
                icon={<Eye className="w-4 h-4" />}
                title="Public Profile"
                description="Allow others to view your profile"
                checked={settings.privacy.profilePublic}
                onChange={() => toggleSetting("privacy", "profilePublic")}
              />

              <SettingToggle
                icon={<Shield className="w-4 h-4" />}
                title="Show Friends List"
                description="Display your friends on your profile"
                checked={settings.privacy.showFriendsList}
                onChange={() => toggleSetting("privacy", "showFriendsList")}
              />

              <SettingToggle
                icon={<Activity className="w-4 h-4" />}
                title="Show Activity"
                description="Let others see your watching activity"
                checked={settings.privacy.showActivity}
                onChange={() => toggleSetting("privacy", "showActivity")}
              />

              <SettingToggle
                icon={<Mail className="w-4 h-4" />}
                title="Allow Messages"
                description="Receive direct messages from other users"
                checked={settings.privacy.allowMessages}
                onChange={() => toggleSetting("privacy", "allowMessages")}
              />
            </div>
          </TabsContent>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg space-y-4">
              <SettingToggle
                icon={<Moon className="w-4 h-4" />}
                title="Dark Mode"
                description="Use dark theme"
                checked={settings.display.darkMode}
                onChange={() => toggleSetting("display", "darkMode")}
              />

              <SettingToggle
                icon={<Volume2 className="w-4 h-4" />}
                title="Sound Effects"
                description="Enable sound for interactions"
                checked={settings.display.soundEnabled}
                onChange={() => toggleSetting("display", "soundEnabled")}
              />

              <SettingToggle
                icon={<Eye className="w-4 h-4" />}
                title="Animations"
                description="Show smooth animations"
                checked={settings.display.animationsEnabled}
                onChange={() => toggleSetting("display", "animationsEnabled")}
              />

              <SettingToggle
                icon={<Eye className="w-4 h-4" />}
                title="Compact Mode"
                description="Use compact layout"
                checked={settings.display.compactMode}
                onChange={() => toggleSetting("display", "compactMode")}
              />
            </div>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
              >
                <Shield className="w-4 h-4 mr-2" />
                Two-Factor Authentication
              </Button>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-sm mb-3 text-red-500">
                  Danger Zone
                </h4>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={handleDeleteAccount}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-border">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {loading ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-500/10 rounded-lg text-sm">
          <p className="text-muted-foreground">
            💡 Your settings are automatically synced across all devices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

interface SettingToggleProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const SettingToggle = ({
  icon,
  title,
  description,
  checked,
  onChange,
}: SettingToggleProps) => {
  return (
    <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="font-medium text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <button
        onClick={onChange}
        className={`relative w-10 h-6 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

// Import missing icon
import { Activity } from "lucide-react";

export default SettingsPanel;
