import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';

interface CouponFormProps {
  onApplied: (discount: {
    type: string;
    value: number;
    discountAmount: number;
    code: string;
  }) => void;
  subscriptionId?: number;
  className?: string;
}

const CouponForm: React.FC<CouponFormProps> = ({ 
  onApplied, 
  subscriptionId,
  className
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const { toast } = useToast();
  
  // Validate coupon without applying it
  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest('POST', '/api/affiliate/validate-coupon', { code });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.valid) {
        setIsValid(true);
        setErrorMessage('');
      } else {
        setIsValid(false);
        setErrorMessage(data.message || 'Invalid coupon code');
      }
      setValidating(false);
    },
    onError: (error: any) => {
      setIsValid(false);
      setErrorMessage(error.message || 'Failed to validate coupon');
      setValidating(false);
    }
  });
  
  // Apply coupon to subscription
  const applyCouponMutation = useMutation({
    mutationFn: async ({ code, subscriptionId }: { code: string; subscriptionId?: number }) => {
      const response = await apiRequest('POST', '/api/affiliate/apply-coupon', { 
        code, 
        subscriptionId 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      // Call the passed function to apply the discount in the parent component
      if (data.success) {
        onApplied({
          type: data.discount.type,
          value: data.discount.value,
          discountAmount: data.discount.discountAmount,
          code: couponCode
        });
        
        toast({
          title: "Discount Applied!",
          description: `Coupon "${couponCode}" has been applied to your subscription.`,
        });
      }
    },
    onError: (error: any) => {
      setIsValid(false);
      setErrorMessage(error.message || 'Failed to apply coupon');
      toast({
        title: "Error",
        description: error.message || "Failed to apply coupon code",
        variant: "destructive"
      });
    }
  });
  
  const handleValidate = () => {
    if (!couponCode.trim()) {
      setErrorMessage('Please enter a coupon code');
      return;
    }
    
    setValidating(true);
    setIsValid(null);
    validateCouponMutation.mutate(couponCode.trim());
  };
  
  const handleApply = () => {
    if (!couponCode.trim()) return;
    
    applyCouponMutation.mutate({ 
      code: couponCode.trim(), 
      subscriptionId 
    });
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="couponCode">Coupon Code</Label>
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Input
            id="couponCode"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase());
              setIsValid(null);
            }}
            className={`${
              isValid === true ? 'border-green-500 pr-8' :
              isValid === false ? 'border-red-500 pr-8' : ''
            }`}
          />
          {isValid === true && (
            <Check className="absolute right-2 top-2.5 h-4 w-4 text-green-500" />
          )}
          {isValid === false && (
            <X className="absolute right-2 top-2.5 h-4 w-4 text-red-500" />
          )}
        </div>
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleValidate}
          disabled={validateCouponMutation.isPending || !couponCode.trim()}
        >
          Validate
        </Button>
        <Button 
          type="button" 
          onClick={handleApply}
          disabled={!isValid || applyCouponMutation.isPending}
        >
          Apply
        </Button>
      </div>
      
      {errorMessage && (
        <p className="text-sm text-red-500 mt-1">{errorMessage}</p>
      )}
      
      {isValid && (
        <p className="text-sm text-green-500 mt-1">
          Valid coupon code! Click "Apply" to use it.
        </p>
      )}
    </div>
  );
};

export default CouponForm;