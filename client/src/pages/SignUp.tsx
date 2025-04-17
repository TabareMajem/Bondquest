import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "react-i18next";

const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp() {
  const [, navigate] = useLocation();
  const { login, socialLogin } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      displayName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: SignUpFormValues) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      // Log in the user after registration
      login({ ...data, password: form.getValues().password });
      
      // Navigate to onboarding chat first
      navigate("/onboarding-chat");
      
      toast({
        title: "Account created!",
        description: "Your account has been created successfully. Let's get to know each other better!",
      });
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create your account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: SignUpFormValues) => {
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      // Redirect to Google OAuth flow
      await socialLogin('google');
      // The page will redirect, so we don't need to navigate here
    } catch (error: any) {
      toast({
        title: t('auth.signupFailed'),
        description: error.message || "Google authentication failed. Please try again.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };
  


  return (
    <div 
      className="min-h-screen w-full p-6 flex flex-col items-center justify-center text-white"
      style={{ background: "var(--gradient-primary)" }}
    >
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold font-poppins mb-8 text-center">Join BondQuest</h1>
        
        {/* Sign Up Form */}
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-2xl p-6 mb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Display Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      />
                    </FormControl>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      />
                    </FormControl>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Choose a username"
                        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      />
                    </FormControl>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      />
                    </FormControl>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />
              
              <Button
                type="submit"
                className="w-full bg-white text-primary-700 font-semibold py-3 px-6 rounded-lg mt-6 shadow-lg hover:shadow-xl transition-all hover:text-primary-900"
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>
        </div>
        
        {/* Alternative Sign Up Methods */}
        <div className="space-y-3">
          <Button
            className="w-full flex items-center justify-center bg-white text-gray-700 font-medium py-3 px-6 rounded-lg shadow-sm hover:shadow transition-all"
            variant="outline"
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleLoading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isGoogleLoading ? "Connecting..." : "Sign Up with Google"}
          </Button>
        </div>
        
        <div className="text-center mt-6">
          <a 
            href="#" 
            className="text-white hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            Already have an account? Log In
          </a>
        </div>
      </div>
    </div>
  );
}
