// client-agent/client/src/pages/home.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { loginUser, registerUser, resetPassword } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from 'react';
import { isFirebaseInitialized } from "@/lib/firebase";
import { ActivityTest } from "@/components/activity-test";
import { auth } from "@/lib/firebase";

const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthForm = z.infer<typeof authSchema>;

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkInitialization = () => {
      if (isFirebaseInitialized()) {
        setIsInitializing(false);
        return;
      }
      setTimeout(checkInitialization, 100);
    };
    checkInitialization();
  }, []);

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });
    
    return () => unsubscribe();
  }, []);

  const loginForm = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLogin = async (data: AuthForm) => {
    try {
      if (!isFirebaseInitialized()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Authentication system is still initializing. Please try again in a moment.",
        });
        return;
      }

      console.log("Attempting login with email:", data.email);
      await loginUser(data.email, data.password);
      console.log("Login successful");

      toast({
        title: "Success",
        description: "Logged in successfully",
      });

      // Navigate to messages page after successful login
      setTimeout(() => setLocation("/messages"), 500);

    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.code === 'auth/user-not-found'
        ? "No account found with this email. Please check your email or sign up."
        : error.code === 'auth/wrong-password'
        ? "Incorrect password. Please try again."
        : error.code === 'auth/invalid-email'
        ? "Invalid email format. Please enter a valid email address."
        : error.code === 'auth/invalid-credential'
        ? "Invalid credentials. Please check your email and password."
        : error.message || "Login failed. Please try again.";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const onRegister = async (data: AuthForm) => {
    try {
      console.log("Attempting registration with email:", data.email);
      await registerUser(data.email, data.password);
      console.log("Registration successful");

      toast({
        title: "Success",
        description: "Account created successfully! You can now log in.",
      });

      registerForm.reset();
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = error.code === 'auth/email-already-in-use'
        ? "An account with this email already exists."
        : error.code === 'auth/invalid-email'
        ? "Invalid email format. Please enter a valid email address."
        : error.code === 'auth/weak-password'
        ? "Password is too weak. Please use at least 6 characters."
        : error.message || "Registration failed. Please try again.";

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      console.log("Starting password reset process for email:", email);
      console.log("Current URL origin:", window.location.origin);
      await resetPassword(email);
      console.log("Password reset initiated successfully");
      toast({
        title: "Success",
        description: "Password reset email sent. Please check your inbox.",
      });
      setIsResettingPassword(false);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Reset failed: ${error.message}. Error code: ${error.code || 'unknown'}`,
      });
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-white">
          Initializing authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 pt-8">
      {isLoggedIn ? (
        <div className="space-y-8">
          <Card className="bg-white/90">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl md:text-3xl text-primary">Welcome to PRIZM Agent</CardTitle>
              <CardDescription>
                You are logged in successfully!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <Button
                  onClick={() => {
                    setLocation("/messages");
                  }}
                  className="mx-2"
                >
                  Go to Messages
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      await auth.signOut();
                      toast({
                        title: "Success",
                        description: "Logged out successfully",
                      });
                    } catch (error) {
                      console.error("Logout error:", error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Failed to log out. Please try again.",
                      });
                    }
                  }}
                  className="mx-2"
                >
                  Log Out
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Add the activity test component */}
          <ActivityTest />
        </div>
      ) : (
        <Card className="mt-8 bg-white/90">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl md:text-3xl text-primary">PRIZM Agent</CardTitle>
            <CardDescription>
              Connect with businesses using AI-powered matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="text-foreground">
              <TabsList className="grid w-full grid-cols-2 bg-primary/10">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-white">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form
                    onSubmit={loginForm.handleSubmit(onLogin)}
                    className="space-y-4"
                  >
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              className="bg-primary/5 border-primary/20 focus:border-primary focus:bg-primary/10 text-primary focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-primary" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Enter your password"
                              className="bg-primary/5 border-primary/20 focus:border-primary focus:bg-primary/10 text-primary focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-primary" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" variant="default" className="w-full bg-primary hover:bg-primary/90 text-white">
                      Login
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-primary hover:text-primary/90"
                      onClick={() => {
                        const email = loginForm.getValues("email");
                        if (email) {
                          handleResetPassword(email);
                        } else {
                          toast({
                            variant: "destructive",
                            title: "Error",
                            description: "Please enter your email address first.",
                          });
                        }
                      }}
                    >
                      Forgot Password?
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegister)}
                    className="space-y-4"
                  >
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter your email"
                              className="bg-primary/5 border-primary/20 focus:border-primary focus:bg-primary/10 text-primary focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-primary" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-primary">Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Choose a password"
                              className="bg-primary/5 border-primary/20 focus:border-primary focus:bg-primary/10 text-primary focus:ring-primary/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage className="text-primary" />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" variant="default" className="w-full bg-primary hover:bg-primary/90 text-white">
                      Create Account
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}