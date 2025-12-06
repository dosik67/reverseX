import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import supabase from "@/utils/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Check } from "lucide-react";

const QRAuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Array<{ id: string; email: string; username: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const sessionId = searchParams.get('session');

  // Fetch user's accounts from localStorage (in real app, would be from backend)
  useEffect(() => {
    // Simulate fetching accounts
    const storedAccounts = localStorage.getItem('user_accounts');
    if (storedAccounts) {
      try {
        const parsed = JSON.parse(storedAccounts);
        setAccounts(parsed);
      } catch (error) {
        console.error('Error parsing accounts:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleSelectAccount = async (accountId: string) => {
    if (!sessionId) {
      toast.error('Invalid session');
      return;
    }

    try {
      setAuthenticating(true);
      setSelectedAccount(accountId);

      // Get the account
      const account = accounts.find(a => a.id === accountId);
      if (!account) {
        toast.error('Account not found');
        return;
      }

      // In real app, this would get a valid session token from backend
      // For now, we'll use a placeholder
      const token = `${account.id}|temp_token_${Date.now()}`;

      // Send auth data to parent window via localStorage
      localStorage.setItem(`qr_auth_${sessionId}`, JSON.stringify({
        token,
        userId: account.id
      }));

      toast.success(`Authenticated as ${account.email}`);

      // Close or redirect after short delay
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error: any) {
      toast.error('Authentication failed: ' + error.message);
      setAuthenticating(false);
      setSelectedAccount(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading accounts...</p>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive">Invalid QR session</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Accounts Found</CardTitle>
            <CardDescription>
              No accounts found on this device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Select Account</CardTitle>
          <CardDescription>
            Choose which account to sign in with
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {accounts.map((account) => (
            <Button
              key={account.id}
              onClick={() => handleSelectAccount(account.id)}
              disabled={authenticating || selectedAccount !== null}
              variant={selectedAccount === account.id ? 'default' : 'outline'}
              className="w-full justify-between group"
            >
              <div className="text-left">
                <p className="font-semibold text-sm">{account.username}</p>
                <p className="text-xs text-muted-foreground">{account.email}</p>
              </div>
              {selectedAccount === account.id && authenticating && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background"></div>
              )}
              {selectedAccount === account.id && !authenticating && (
                <Check className="w-4 h-4" />
              )}
            </Button>
          ))}

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Don't see your account?
            </p>
            <Button 
              onClick={() => navigate('/auth')}
              variant="ghost"
              className="w-full"
              disabled={authenticating}
            >
              Sign in with Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRAuthPage;
