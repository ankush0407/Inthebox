import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

type Step = "email" | "verify" | "reset" | "success";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/request-password-reset", { email });

      toast({
        title: "Reset code sent",
        description: "Check your email for the password reset code",
      });
      setStep("verify");
    } catch (error: any) {
      toast({
        title: "Failed to send reset code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/auth/verify-reset-code", { email, code });
      const data = await response.json();

      setResetToken(data.token);
      toast({
        title: "Code verified",
        description: "You can now reset your password",
      });
      setStep("reset");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message || "Invalid or expired code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token: resetToken, newPassword });

      toast({
        title: "Password reset successful",
        description: "You can now login with your new password",
      });
      setStep("success");
      
      setTimeout(() => {
        setLocation("/auth");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Failed to reset password",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-accent/10">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Password Reset Complete!</h2>
            <p className="text-muted-foreground mb-4">
              Your password has been successfully reset. Redirecting to login...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-accent/10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "verify" && "Enter the 6-digit code sent to your email"}
            {step === "reset" && "Create your new password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-reset-email"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email}
                data-testid="button-request-reset"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Reset Code
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setLocation("/auth")}
                  data-testid="link-back-to-login"
                >
                  Back to Login
                </Button>
              </div>
            </form>
          )}

          {step === "verify" && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Reset Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl font-mono tracking-widest"
                  required
                  data-testid="input-reset-code"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || code.length !== 6}
                data-testid="button-verify-code"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify Code
              </Button>
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => setStep("email")}
                  data-testid="link-back-to-email"
                >
                  Use different email
                </Button>
              </div>
            </form>
          )}

          {step === "reset" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !newPassword || !confirmPassword}
                data-testid="button-reset-password"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reset Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
