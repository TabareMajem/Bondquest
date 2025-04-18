import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return; // App is already installed, don't show the prompt
    }

    // Show hint for iOS users after a delay
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    if (isIOS) {
      // For iOS, show hint to use "Add to Home Screen" from Safari menu
      const timer = setTimeout(() => {
        const hasShownIOSHint = localStorage.getItem('pwa-ios-hint-shown');
        if (!hasShownIOSHint) {
          setShowHint(true);
          localStorage.setItem('pwa-ios-hint-shown', 'true');
        }
      }, 60000); // Show after 1 minute
      
      return () => clearTimeout(timer);
    }

    // For other browsers, listen for beforeinstallprompt event
    const handler = (e: Event) => {
      // Prevent default browser prompt
      e.preventDefault();
      
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show our custom prompt after a delay
      const lastPromptTime = localStorage.getItem('pwa-prompt-time');
      const now = Date.now();
      
      if (!lastPromptTime || (now - parseInt(lastPromptTime)) > 7 * 24 * 60 * 60 * 1000) {
        // Show after 5 seconds if we haven't shown it in the last week
        const timer = setTimeout(() => {
          setShowPrompt(true);
          localStorage.setItem('pwa-prompt-time', now.toString());
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    
    // Show the browser's install prompt
    deferredPrompt.prompt();
    
    // Wait for user to respond
    const { outcome } = await deferredPrompt.userChoice;
    
    // Clear the saved prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
    
    // Optionally track the outcome
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User declined the PWA installation');
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    setShowHint(false);
  };

  const dismissHint = () => {
    setShowHint(false);
  };

  if (!showPrompt && !showHint) return null;

  // iOS specific install hint
  if (showHint) {
    return (
      <div className="fixed bottom-20 inset-x-0 z-50 px-4 py-2">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-4 shadow-xl border border-white/20 backdrop-blur-sm text-white relative">
          <button 
            onClick={dismissHint} 
            className="absolute top-2 right-2 p-1 rounded-full bg-white/20 text-white"
          >
            <X size={16} />
          </button>
          <h3 className="font-bold mb-1">Install BondQuest</h3>
          <p className="text-sm mb-2">
            Add BondQuest to your home screen for the best experience!
          </p>
          <div className="flex items-center text-xs bg-white/20 p-2 rounded-lg">
            <span>Tap <span className="mx-1 px-1 bg-white/20 rounded">Share</span> then "Add to Home Screen"</span>
          </div>
        </div>
      </div>
    );
  }

  // Standard install prompt for other browsers
  return (
    <div className="fixed bottom-20 inset-x-0 z-50 px-4 py-2">
      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-4 shadow-xl border border-white/20 backdrop-blur-sm text-white relative">
        <button 
          onClick={dismissPrompt} 
          className="absolute top-2 right-2 p-1 rounded-full bg-white/20 text-white"
        >
          <X size={16} />
        </button>
        <h3 className="font-bold mb-1">Install BondQuest</h3>
        <p className="text-sm mb-3">
          Add BondQuest to your home screen for a faster and better experience.
        </p>
        <div className="flex space-x-2">
          <button 
            onClick={dismissPrompt}
            className="flex-1 py-2 px-4 bg-white/20 rounded-lg text-sm font-medium"
          >
            Not now
          </button>
          <button 
            onClick={installApp}
            className="flex-1 py-2 px-4 bg-white rounded-lg text-sm font-medium text-purple-800"
          >
            Install
          </button>
        </div>
      </div>
    </div>
  );
}