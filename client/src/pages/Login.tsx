import { useState } from "react";
import { useLocation } from "wouter";
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

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data);
      
      // Check if user is admin and redirect to admin dashboard if they are
      if (isAdmin) {
        navigate("/admin");
        toast({
          title: "Welcome Administrator!",
          description: "You have successfully logged in to the admin panel.",
        });
      } else {
        navigate("/home"); // Redirect normal users to home
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full p-6 flex flex-col items-center justify-center text-white"
      style={{ background: "var(--gradient-primary)" }}
    >
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold font-poppins mb-8 text-center">Welcome Back to BondQuest</h1>

        {/* Login Form */}
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-2xl p-6 mb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your username"
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
                className="w-full bg-white text-primary-700 font-semibold py-3 px-6 rounded-lg mt-6 shadow-lg hover:shadow-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Log In"}
              </Button>
            </form>
          </Form>
        </div>

        {/* Alternative Login Methods */}
        <div className="space-y-3">
          <Button
            className="w-full flex items-center justify-center bg-white text-gray-700 font-medium py-3 px-6 rounded-lg shadow-sm hover:shadow transition-all"
            variant="outline"
            type="button"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          <Button
            className="w-full flex items-center justify-center bg-[#1877F2] text-white font-medium py-3 px-6 rounded-lg shadow-sm hover:shadow transition-all"
            type="button"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Continue with Facebook
          </Button>
        </div>

        <div className="text-center mt-6">
          <a
            href="#"
            className="text-white hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/signup");
            }}
          >
            Don't have an account? Sign Up
          </a>
        </div>
        
        <div className="text-center mt-4">
          <a
            href="#"
            className="text-white hover:underline text-sm"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            Back to Start
          </a>
        </div>
      </div>
    </div>
  );
}