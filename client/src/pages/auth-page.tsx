import { useState, useEffect, memo } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Disable HMR for this component to prevent reload loops
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // This intentionally does nothing on HMR updates for this file
    console.log("HMR update for auth-page.tsx - ignored to prevent reload loops");
  });
}

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// SignUp form schema
const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

// Use memo to prevent unnecessary re-renders
const AuthPage = memo(function AuthPage() {
  const [, navigate] = useLocation();
  const { login, socialLogin, user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Determine if we should show the hero section based on screen width
  // We'll only calculate this once when the component mounts
  const [showHero] = useState(() => {
    return typeof window !== 'undefined' && window.innerWidth >= 1024;
  });

  // Check user auth status once
  useEffect(() => {
    if (user) {
      navigate("/home");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // SignUp form
  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      displayName: "",
    },
  });

  // Login form submission
  const onLoginSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(values);
      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: t('auth.loginFailed'),
        description: error instanceof Error ? error.message : t('auth.generalError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // SignUp form submission
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    setIsLoading(true);
    try {
      // Call register API endpoint
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }
      
      // If registration successful, log them in with same credentials
      await login({
        username: values.username,
        password: values.password,
      });
      
      // Navigate to onboarding chat or home
      navigate("/onboarding-chat");
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: t('auth.registrationFailed'),
        description: error instanceof Error ? error.message : t('auth.generalError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await socialLogin("google");
    } catch (error) {
      console.error("Google login error:", error);
      toast({
        title: t('auth.socialLoginFailed'),
        description: t('auth.generalError'),
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  // Create a single Form component to prevent flickering
  const renderForm = () => (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white">BondQuest</h1>
        <p className="text-purple-200 mt-2">Strengthen your relationship through fun activities</p>
      </div>

      <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        {/* Login Form */}
        <TabsContent value="login" className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-white/20">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('auth.username')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('auth.usernamePlaceholder')}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('auth.password')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder={t('auth.passwordPlaceholder')}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? t('common.loading') : t('common.login')}
                </Button>
              </form>
            </Form>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-white/20"></div>
            <span className="relative px-2 bg-gradient-to-b from-purple-900 to-purple-800 text-xs text-white/60">
              {t('auth.orContinueWith')}
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isGoogleLoading ? t('common.loading') : t('auth.continueWithGoogle')}
          </Button>
        </TabsContent>

        {/* Sign Up Form */}
        <TabsContent value="signup" className="space-y-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 shadow-xl border border-white/20">
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('auth.displayName')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('auth.displayNamePlaceholder')}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('auth.username')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('auth.usernamePlaceholder')}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('auth.email')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder={t('auth.emailPlaceholder')}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">{t('auth.password')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="password"
                          placeholder={t('auth.passwordPlaceholder')}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? t('common.loading') : t('auth.createAccount')}
                </Button>
              </form>
            </Form>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute w-full border-t border-white/20"></div>
            <span className="relative px-2 bg-gradient-to-b from-purple-900 to-purple-800 text-xs text-white/60">
              {t('auth.orContinueWith')}
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isGoogleLoading ? t('common.loading') : t('auth.signUpWithGoogle')}
          </Button>
        </TabsContent>
      </Tabs>

      <div className="mt-8 text-center">
        <Button 
          variant="link" 
          className="text-white hover:text-purple-200"
          onClick={() => navigate("/")}
        >
          {t('common.back')}
        </Button>
      </div>
    </div>
  );

  // Hero section for large screens  
  const renderHero = () => (
    <div className="z-10 max-w-md text-center">
      <div className="mb-6 inline-flex p-4 bg-pink-600 bg-opacity-30 rounded-full backdrop-blur-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-4">Strengthen Your Relationship</h2>
      
      <p className="text-white text-opacity-90 mb-8">
        BondQuest helps couples build stronger connections through fun activities, 
        personalized insights, and AI-powered relationship guidance.
      </p>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-white mb-2">Relationship Quizzes</h3>
          <p className="text-white text-opacity-80 text-sm">Test how well you know each other and learn new things about your partner</p>
        </div>
        
        <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-white mb-2">AI Relationship Assistant</h3>
          <p className="text-white text-opacity-80 text-sm">Get personalized advice from Casanova & Venus to enhance your relationship</p>
        </div>
        
        <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-white mb-2">Compete Together</h3>
          <p className="text-white text-opacity-80 text-sm">Join challenges with other couples and win exciting rewards</p>
        </div>
        
        <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
          <h3 className="font-semibold text-white mb-2">Relationship Insights</h3>
          <p className="text-white text-opacity-80 text-sm">Track your relationship's growth with data-driven analysis</p>
        </div>
      </div>
      
      <div className="inline-flex items-center justify-center space-x-2 text-white text-opacity-80">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Your data is secure and encrypted</span>
      </div>
    </div>
  );

  // Static layout that doesn't depend on CSS media queries
  return (
    <div className="flex flex-row min-h-screen">
      {/* Left column (Form) */}
      <div 
        className="bg-gradient-to-b from-purple-900 via-purple-800 to-fuchsia-900 flex flex-col items-center justify-center p-8"
        style={{ 
          width: showHero ? '50%' : '100%',
          minWidth: showHero ? '50%' : '100%',
        }}
      >
        {renderForm()}
      </div>

      {/* Right column (Hero) - Only shown on larger screens */}
      {showHero && (
        <div 
          className="bg-purple-800 bg-opacity-90 flex flex-col items-center justify-center p-12 relative overflow-hidden"
          style={{ width: '50%', minWidth: '50%' }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}></div>
          
          {renderHero()}
        </div>
      )}
    </div>
  );
});

// Export the memoized component
export default AuthPage;