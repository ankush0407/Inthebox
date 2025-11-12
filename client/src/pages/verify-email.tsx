import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const urlParams = new URLSearchParams(window.location.search);
  const emailParam = urlParams.get('email') || '';
  
  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsResending(true);
    try {
      await apiRequest("POST", "/api/auth/send-verification-code", { email });

      toast({
        title: "Code sent",
        description: "Check your email for the verification code",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerify = async () => {
    if (!email || !code) {
      toast({
        title: "Missing information",
        description: "Please enter both email and verification code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/auth/verify-email", { email, code });

      setIsVerified(true);
      toast({
        title: "Email verified!",
        description: "Your email has been successfully verified",
      });

      setTimeout(() => {
        setLocation("/auth");
      }, 2000);
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

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/10 to-accent/10">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Email Verified!</h2>
            <p className="text-muted-foreground mb-4">
              Your email has been successfully verified. Redirecting to login...
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
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to your email address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-verify-email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl font-mono tracking-widest"
              data-testid="input-verify-code"
            />
            <p className="text-xs text-muted-foreground text-center">
              Enter the 6-digit code from your email
            </p>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isLoading || code.length !== 6}
            data-testid="button-verify-submit"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify Email
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Didn't receive the code?
            </p>
            <Button
              variant="outline"
              onClick={handleSendCode}
              disabled={isResending}
              className="w-full"
              data-testid="button-resend-code"
            >
              {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isResending ? "Sending..." : "Send Code"}
            </Button>
          </div>

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setLocation("/auth?tab=register")}
              data-testid="link-back-to-signup"
            >
              Change Email / Back to Signup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
