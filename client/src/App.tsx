import React, { useState } from 'react';
import { Switch, Route, Link, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster";
import AffiliateManagement from './pages/admin/AffiliateManagement';
import PartnerPortal from './pages/affiliate/PartnerPortal';
import { AuthProvider } from './hooks/use-auth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-primary text-primary-foreground p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">BondQuest</div>
        <div className="flex space-x-4">
          <Link href="/">
            <a className={`${location === '/' ? 'underline' : ''}`}>Home</a>
          </Link>
          <Link href="/admin/affiliate">
            <a className={`${location === '/admin/affiliate' ? 'underline' : ''}`}>Admin</a>
          </Link>
          <Link href="/affiliate/portal">
            <a className={`${location === '/affiliate/portal' ? 'underline' : ''}`}>Partner Portal</a>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to BondQuest</h1>
      <p className="mb-4">
        A cutting-edge relationship enhancement platform leveraging AI to support 
        couples through intelligent communication tools and interactive experiences.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Admin Area</h2>
          <p className="mb-2">Manage affiliate partners, coupons, payments, and more.</p>
          <Link href="/admin/affiliate">
            <a className="bg-primary text-primary-foreground px-4 py-2 rounded-md inline-block">
              Go to Admin
            </a>
          </Link>
        </div>
        <div className="bg-muted p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Partner Portal</h2>
          <p className="mb-2">Affiliate partners can manage their coupons, referrals, and track earnings.</p>
          <Link href="/affiliate/portal">
            <a className="bg-primary text-primary-foreground px-4 py-2 rounded-md inline-block">
              Go to Partner Portal
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Navigation />
          <main className="py-8">
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/admin/affiliate" component={AffiliateManagement} />
              <Route path="/affiliate/portal" component={PartnerPortal} />
              <Route>
                <div className="container mx-auto p-4">
                  <h1 className="text-3xl font-bold">404 - Page Not Found</h1>
                  <p className="mt-4">The page you are looking for does not exist.</p>
                  <Link href="/">
                    <a className="text-primary hover:underline mt-4 inline-block">
                      Go back to home
                    </a>
                  </Link>
                </div>
              </Route>
            </Switch>
          </main>
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}