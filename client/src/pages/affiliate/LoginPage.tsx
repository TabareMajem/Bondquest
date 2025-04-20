import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAffiliateAuth } from '@/hooks/use-affiliate-auth';

// Form schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { partner, loginMutation } = useAffiliateAuth();
  
  // Redirect if already logged in
  if (partner) {
    navigate('/affiliate/portal');
    return null;
  }

  // Form with validation
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Form submission handler
  const onSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: 'Login successful',
          description: 'Welcome to your affiliate partner dashboard',
        });
        navigate('/affiliate/portal');
      }
    });
  };

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8">
        {/* Form Column */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl">Affiliate Partner Login</CardTitle>
            <CardDescription>
              Access your affiliate dashboard to manage promotions and track earnings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Logging in...' : 'Log In'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col items-start">
            <p className="text-sm text-muted-foreground mb-2">
              Not a partner yet? Contact us to join our affiliate program.
            </p>
            <Button variant="link" className="p-0" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </CardFooter>
        </Card>
        
        {/* Hero Column */}
        <div className="hidden md:flex flex-col justify-center p-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white">
          <h2 className="text-3xl font-bold mb-6">Grow with BondQuest</h2>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="mr-4 text-2xl">💰</div>
              <div>
                <h3 className="font-semibold mb-1">Earn Commission</h3>
                <p className="text-sm opacity-90">
                  Get up to 30% commission on every subscription you refer
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 text-2xl">🔍</div>
              <div>
                <h3 className="font-semibold mb-1">Track Performance</h3>
                <p className="text-sm opacity-90">
                  Get detailed analytics on clicks, conversions, and earnings
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 text-2xl">🎯</div>
              <div>
                <h3 className="font-semibold mb-1">Custom Coupons</h3>
                <p className="text-sm opacity-90">
                  Create unique discount codes to increase conversion rates
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="mr-4 text-2xl">🔗</div>
              <div>
                <h3 className="font-semibold mb-1">Easy Sharing</h3>
                <p className="text-sm opacity-90">
                  Generate trackable links for your website, social media, or email campaigns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;