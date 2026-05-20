import { useState, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { 
  useGetCallerUserProfile, 
  useGetUserPreferences,
  useUpdateUserPreferences,
  useChangePassword,
  useDeleteAccount,
  useCheckGoogleConnection,
  useDisconnectGoogle,
  useInitiateGoogleAuth,
} from '../hooks/useQueries';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  User, Lock, Bell, Shield, Palette, Globe, 
  Mail, Eye, EyeOff, Save, Loader2, AlertTriangle,
  Calendar, CheckCircle2, XCircle, ExternalLink
} from 'lucide-react';

export default function SettingsPage() {
  usePageTitle('Settings');
  
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: preferences, isLoading: preferencesLoading } = useGetUserPreferences();
  const updatePreferences = useUpdateUserPreferences();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();
  
  // Google Calendar
  const { data: googleStatus, isLoading: googleLoading } = useCheckGoogleConnection();
  const disconnectGoogle = useDisconnectGoogle();
  const initiateGoogleAuth = useInitiateGoogleAuth();

  // Handle OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('google_connected') === 'true') {
      toast.success('Google Calendar connected successfully!');
      // Clean up URL
      window.history.replaceState({}, '', '/settings');
    } else if (params.get('google_error')) {
      toast.error(`Google connection failed: ${params.get('google_error')}`);
      window.history.replaceState({}, '', '/settings');
    }
  }, []);

  const handleConnectGoogle = async () => {
    try {
      const data = await initiateGoogleAuth.mutateAsync();
      // Redirect to Google OAuth
      window.location.href = data.authorization_url;
    } catch (error) {
      const msg = error?.body?.error || error?.message || 'Failed to initiate Google connection';
      toast.error(msg);
    }
  };

  const handleDisconnectGoogle = async () => {
    try {
      await disconnectGoogle.mutateAsync();
      toast.success('Google Calendar disconnected');
    } catch (error) {
      toast.error('Failed to disconnect Google Calendar');
    }
  };
  
  // Account Settings
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [applicationUpdates, setApplicationUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  
  // Privacy Settings
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  
  // Theme Settings
  const [theme, setTheme] = useState('system');
  
  // Delete Account
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Load preferences when available
  useEffect(() => {
    if (preferences) {
      setEmailNotifications(preferences.email_notifications ?? true);
      setJobAlerts(preferences.job_alerts ?? true);
      setMessageNotifications(preferences.message_notifications ?? true);
      setApplicationUpdates(preferences.application_updates ?? true);
      setWeeklyDigest(preferences.weekly_digest ?? false);
      setProfileVisibility(preferences.profile_visibility ?? 'public');
      setShowEmail(preferences.show_email ?? false);
      setShowPhone(preferences.show_phone ?? false);
      setTheme(preferences.theme ?? 'system');
    }
  }, [preferences]);
  
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      const errorMessage = error?.body?.current_password?.[0] 
        || error?.body?.detail 
        || error?.message 
        || 'Failed to update password';
      toast.error(errorMessage);
    }
  };
  
  const handleSaveNotifications = async () => {
    try {
      await updatePreferences.mutateAsync({
        email_notifications: emailNotifications,
        job_alerts: jobAlerts,
        message_notifications: messageNotifications,
        application_updates: applicationUpdates,
        weekly_digest: weeklyDigest,
      });
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    }
  };
  
  const handleSavePrivacy = async () => {
    try {
      await updatePreferences.mutateAsync({
        profile_visibility: profileVisibility,
        show_email: showEmail,
        show_phone: showPhone,
      });
      toast.success('Privacy settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };
  
  const handleSaveTheme = async () => {
    try {
      await updatePreferences.mutateAsync({
        theme: theme,
      });
      toast.success('Theme preference saved');
      
      // Apply theme immediately
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // System theme
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch (error) {
      toast.error('Failed to save theme');
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password');
      return;
    }
    
    try {
      await deleteAccount.mutateAsync(deletePassword);
      toast.success('Account deleted successfully');
      logout();
      navigate({ to: '/' });
    } catch (error) {
      const errorMessage = error?.body?.detail || error?.message || 'Failed to delete account';
      toast.error(errorMessage);
    }
  };

  if (profileLoading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* Account Settings */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900 dark:text-white">Account Settings</CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Manage your account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Email Address</Label>
                  <Input 
                    type="email"
                    value={userProfile?.user?.email || ''}
                    disabled
                    className="bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Contact support to change your email address
                  </p>
                </div>
                
                <Separator className="bg-gray-200 dark:bg-gray-800" />
                
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">Change Password</h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-gray-600 dark:text-gray-400"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="current-password" className="text-gray-900 dark:text-white">
                      Current Password
                    </Label>
                    <Input
                      id="current-password"
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-gray-900 dark:text-white">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-gray-900 dark:text-white">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={!currentPassword || !newPassword || !confirmPassword || changePassword.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {changePassword.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900 dark:text-white">Notifications</CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-900 dark:text-white">Email Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
                
                {userProfile?.userType === 'candidate' && (
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-gray-900 dark:text-white">Job Alerts</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Get notified about new job opportunities matching your profile
                      </p>
                    </div>
                    <Switch
                      checked={jobAlerts}
                      onCheckedChange={setJobAlerts}
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-900 dark:text-white">Message Notifications</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Get notified when you receive new messages
                    </p>
                  </div>
                  <Switch
                    checked={messageNotifications}
                    onCheckedChange={setMessageNotifications}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-900 dark:text-white">
                      {userProfile?.userType === 'candidate' ? 'Application Updates' : 'Candidate Updates'}
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {userProfile?.userType === 'candidate' 
                        ? 'Receive updates about your job applications'
                        : 'Get notified about new candidate applications'}
                    </p>
                  </div>
                  <Switch
                    checked={applicationUpdates}
                    onCheckedChange={setApplicationUpdates}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-900 dark:text-white">Weekly Digest</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Receive a weekly summary of your activity
                    </p>
                  </div>
                  <Switch
                    checked={weeklyDigest}
                    onCheckedChange={setWeeklyDigest}
                  />
                </div>
                
                <Button 
                  onClick={handleSaveNotifications}
                  disabled={updatePreferences.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updatePreferences.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900 dark:text-white">Privacy</CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Profile Visibility</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={profileVisibility === 'public' ? 'default' : 'outline'}
                      onClick={() => setProfileVisibility('public')}
                      className={profileVisibility === 'public' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}
                    >
                      Public
                    </Button>
                    <Button
                      type="button"
                      variant={profileVisibility === 'connections' ? 'default' : 'outline'}
                      onClick={() => setProfileVisibility('connections')}
                      className={profileVisibility === 'connections' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}
                    >
                      Connections
                    </Button>
                    <Button
                      type="button"
                      variant={profileVisibility === 'private' ? 'default' : 'outline'}
                      onClick={() => setProfileVisibility('private')}
                      className={profileVisibility === 'private' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}
                    >
                      Private
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {profileVisibility === 'public' && 'Your profile is visible to everyone'}
                    {profileVisibility === 'connections' && 'Only your connections can see your profile'}
                    {profileVisibility === 'private' && 'Your profile is hidden from search'}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-900 dark:text-white">Show Email Address</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Display your email on your public profile
                    </p>
                  </div>
                  <Switch
                    checked={showEmail}
                    onCheckedChange={setShowEmail}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-900 dark:text-white">Show Phone Number</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Display your phone number on your public profile
                    </p>
                  </div>
                  <Switch
                    checked={showPhone}
                    onCheckedChange={setShowPhone}
                  />
                </div>
                
                <Button 
                  onClick={handleSavePrivacy}
                  disabled={updatePreferences.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updatePreferences.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Settings
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-gray-900 dark:text-white">Appearance</CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Customize how Recruitify looks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Theme</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={theme === 'light' ? 'default' : 'outline'}
                      onClick={() => setTheme('light')}
                      className={theme === 'light' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}
                    >
                      Light
                    </Button>
                    <Button
                      type="button"
                      variant={theme === 'dark' ? 'default' : 'outline'}
                      onClick={() => setTheme('dark')}
                      className={theme === 'dark' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}
                    >
                      Dark
                    </Button>
                    <Button
                      type="button"
                      variant={theme === 'system' ? 'default' : 'outline'}
                      onClick={() => setTheme('system')}
                      className={theme === 'system' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'}
                    >
                      System
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose your preferred color scheme
                  </p>
                </div>
                
                <Button 
                  onClick={handleSaveTheme}
                  disabled={updatePreferences.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updatePreferences.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Theme
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Google Calendar Integration — organizations only */}
            {userProfile?.userType === 'organization' && (
              <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-gray-900 dark:text-white">Google Calendar</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Connect Google Calendar to auto-create Google Meet links and send interview invites
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {googleLoading ? (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Checking connection...</span>
                    </div>
                  ) : !googleStatus?.server_configured ? (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-300 text-sm">
                          Google OAuth not configured
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          The server is missing <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">credentials.json</code> from Google Cloud Console.
                          Download it from your Google Cloud project's OAuth 2.0 credentials and place it in the <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">backend/</code> folder.
                        </p>
                      </div>
                    </div>
                  ) : googleStatus?.connected ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-green-800 dark:text-green-300 text-sm">
                            Google Calendar connected
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                            {googleStatus.organization} — Meet links will be auto-created when scheduling interviews
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border-0 flex-shrink-0">
                          Active
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleDisconnectGoogle}
                        disabled={disconnectGoogle.isPending}
                        className="border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        {disconnectGoogle.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Disconnecting...</>
                        ) : (
                          <><XCircle className="mr-2 h-4 w-4" />Disconnect Google Calendar</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-700 dark:text-gray-300 text-sm">
                            Not connected
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Connect to enable automatic Google Meet links and calendar invites for interviews
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleConnectGoogle}
                        disabled={initiateGoogleAuth.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {initiateGoogleAuth.isPending ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting...</>
                        ) : (
                          <><ExternalLink className="mr-2 h-4 w-4" />Connect Google Calendar</>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-900 bg-white dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Irreversible actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showDeleteConfirm ? (
                  <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Delete Account</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Permanently deactivate your account and all associated data
                      </p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Delete Account
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 border border-red-200 dark:border-red-900 rounded-lg space-y-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          Are you absolutely sure?
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          This action will deactivate your account. You won't be able to log in anymore. 
                          Enter your password to confirm.
                        </p>
                        <div className="space-y-3">
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white"
                          />
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeletePassword('');
                              }}
                              className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={handleDeleteAccount}
                              disabled={!deletePassword || deleteAccount.isPending}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            >
                              {deleteAccount.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                'Delete My Account'
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
