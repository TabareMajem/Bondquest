import { useState } from "react";
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

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { login, socialLogin, isAdmin } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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
          title: t('auth.loginSuccess'),
          description: "You have successfully logged in to the admin panel.",
        });
      } else {
        navigate("/home"); // Redirect normal users to home
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.loginSuccess'),
        });
      }
    } catch (error: any) {
      toast({
        title: t('auth.loginFailed'),
        description: error.message || t('auth.loginFailed'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      // Redirect to Google OAuth flow
      await socialLogin('google');
      // The page will redirect, so we don't need to navigate here
    } catch (error: any) {
      toast({
        title: t('auth.loginFailed'),
        description: error.message || "Google authentication failed. Please try again.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };
  


  return (
    <div
      className="min-h-screen w-full px-4 py-6 flex flex-col items-center justify-center text-white overflow-hidden"
      style={{ 
        background: "linear-gradient(135deg, #9b59b6 0%, #6a0dad 100%)",
        backgroundSize: "200% 200%",
        animation: "gradientAnimation 15s ease infinite"
      }}
    >
      <style>{`
        @keyframes gradientAnimation {
          0% { background-position: 0% 50% }
          50% { background-position: 100% 50% }
          100% { background-position: 0% 50% }
        }
        @keyframes floatAnimation {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .float-animation {
          animation: floatAnimation 6s ease-in-out infinite;
        }
        .form-appear {
          animation: formAppear 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(20px);
        }
        @keyframes formAppear {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .staggered-item {
          opacity: 0;
          transform: translateY(10px);
        }
        .staggered-item:nth-child(1) { animation: staggerFade 0.5s 0.1s ease-out forwards; }
        .staggered-item:nth-child(2) { animation: staggerFade 0.5s 0.2s ease-out forwards; }
        .staggered-item:nth-child(3) { animation: staggerFade 0.5s 0.3s ease-out forwards; }
        @keyframes staggerFade {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    
      <div className="w-full max-w-md mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center animate-in slide-in-from-top-10 duration-700 float-animation">
          {t('common.appName')}
        </h1>

        {/* Login Form */}
        <div className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-sm rounded-2xl p-8 mb-6 shadow-xl border border-white border-opacity-20 form-appear">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem className="staggered-item">
                    <FormLabel className="text-white text-lg">{t('common.username')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('common.username')}
                        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
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
                  <FormItem className="staggered-item">
                    <FormLabel className="text-white text-lg">{t('common.password')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-25 border border-white border-opacity-30 text-white placeholder:text-white placeholder:opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                      />
                    </FormControl>
                    <FormMessage className="text-red-200" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-white text-primary-700 font-semibold py-4 px-6 rounded-lg mt-6 shadow-lg hover:shadow-xl hover:bg-opacity-90 hover:translate-y-[-2px] transition-all duration-300 staggered-item"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.loading')}
                  </span>
                ) : (
                  t('common.login')
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Alternative Login Methods */}
        <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-5 duration-700 delay-300">
          <Button
            className="w-full flex items-center justify-center bg-white text-gray-700 font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]"
            variant="outline"
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="truncate">
              {isGoogleLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.loading')}
                </span>
              ) : (
                t('auth.continueWith', { provider: 'Google' })
              )}
            </span>
          </Button>
        </div>

        <div className="text-center mt-6 animate-in fade-in-50 duration-1000 delay-500">
          <a
            href="#"
            className="text-white hover:underline transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              navigate("/signup");
            }}
          >
            {t('auth.dontHaveAccount')} <span className="font-bold">Sign Up</span>
          </a>
        </div>
        
        <div className="text-center mt-4 animate-in fade-in-50 duration-1000 delay-700">
          <a
            href="#"
            className="text-white opacity-80 hover:opacity-100 hover:underline transition-all duration-300"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            {t('common.back')}
          </a>
        </div>
      </div>
    </div>
  );
}