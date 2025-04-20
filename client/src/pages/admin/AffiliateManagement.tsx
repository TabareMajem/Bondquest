import React, { useState } from 'react';
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronDown, ChevronUp, Search, Plus, Edit, Trash, Check, X, DollarSign,
  Users, Tag, ShoppingCart, RefreshCw, FileText, Send, Percent
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Types
interface AffiliatePartner {
  id: number;
  name: string;
  email: string;
  status: string;
  commissionRate: number;
  createdAt: string;
  approvedAt: string | null;
  website: string | null;
  notes: string | null;
}

interface AffiliateCoupon {
  id: number;
  partnerId: number;
  code: string;
  type: string;
  value: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  currentUses: number;
  maxUses: number | null;
}

interface AffiliateTransaction {
  id: number;
  partnerId: number;
  userId: number;
  amount: number;
  commissionAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentDate: string | null;
}

interface AffiliatePayment {
  id: number;
  partnerId: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentDate: string | null;
  reference: string | null;
}

// Partner Form
interface PartnerFormData {
  name: string;
  email: string;
  password: string;
  commissionRate: number;
  website: string;
  description: string;
  notes: string;
}

// Coupon Form
interface CouponFormData {
  partnerId: number;
  code: string;
  type: string;
  value: number;
  description: string;
  isActive: boolean;
  maxUses: number | null;
  endDate: string | null;
}

// Payment Form
interface PaymentFormData {
  partnerId: number;
  amount: number;
  currency: string;
  status: string;
  notes: string;
  transactions: number[];
}

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const statusMap: Record<string, { color: string; label: string }> = {
    pending: { color: "bg-yellow-500", label: "Pending" },
    active: { color: "bg-green-500", label: "Active" },
    suspended: { color: "bg-red-500", label: "Suspended" },
    paid: { color: "bg-green-500", label: "Paid" },
    unpaid: { color: "bg-red-500", label: "Unpaid" },
    processing: { color: "bg-blue-500", label: "Processing" },
    completed: { color: "bg-green-500", label: "Completed" },
    cancelled: { color: "bg-gray-500", label: "Cancelled" }
  };

  const { color, label } = statusMap[status.toLowerCase()] || { color: "bg-gray-500", label: status };

  return (
    <Badge className={color}>
      {label}
    </Badge>
  );
};

// Main Component
const AffiliateManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState("partners");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [partnerFormData, setPartnerFormData] = useState<PartnerFormData>({
    name: "",
    email: "",
    password: "",
    commissionRate: 10,
    website: "",
    description: "",
    notes: ""
  });
  const [couponFormData, setCouponFormData] = useState<CouponFormData>({
    partnerId: 0,
    code: "",
    type: "percentage",
    value: 10,
    description: "",
    isActive: true,
    maxUses: null,
    endDate: null
  });
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    partnerId: 0,
    amount: 0,
    currency: "USD",
    status: "processing",
    notes: "",
    transactions: []
  });
  const [selectedPartnerId, setSelectedPartnerId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Queries
  const { data: partners = [], isLoading: partnersLoading } = useQuery({
    queryKey: ['/api/affiliate/partners'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/affiliate/partners');
      return await response.json();
    }
  });

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ['/api/affiliate/coupons', selectedPartnerId],
    queryFn: async () => {
      const url = selectedPartnerId 
        ? `/api/affiliate/coupons?partnerId=${selectedPartnerId}` 
        : '/api/affiliate/coupons';
      const response = await apiRequest('GET', url);
      return await response.json();
    },
    enabled: activeTab === "coupons"
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/affiliate/transactions', selectedPartnerId],
    queryFn: async () => {
      if (!selectedPartnerId) return [];
      const response = await apiRequest('GET', `/api/affiliate/transactions?partnerId=${selectedPartnerId}`);
      return await response.json();
    },
    enabled: activeTab === "transactions" && !!selectedPartnerId
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/affiliate/payments', selectedPartnerId],
    queryFn: async () => {
      if (!selectedPartnerId) return [];
      const response = await apiRequest('GET', `/api/affiliate/payments?partnerId=${selectedPartnerId}`);
      return await response.json();
    },
    enabled: activeTab === "payments" && !!selectedPartnerId
  });

  // Mutations
  const addPartnerMutation = useMutation({
    mutationFn: async (data: PartnerFormData) => {
      const response = await apiRequest('POST', '/api/affiliate/partners', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/partners'] });
      toast({
        title: "Success",
        description: "Partner added successfully",
      });
      setIsAddPartnerOpen(false);
      setPartnerFormData({
        name: "",
        email: "",
        password: "",
        commissionRate: 10,
        website: "",
        description: "",
        notes: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add partner",
        variant: "destructive"
      });
    }
  });

  const approvePartnerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/affiliate/partners/${id}/approve`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/partners'] });
      toast({
        title: "Success",
        description: "Partner approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve partner",
        variant: "destructive"
      });
    }
  });

  const addCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const response = await apiRequest('POST', '/api/affiliate/coupons', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/coupons'] });
      toast({
        title: "Success",
        description: "Coupon added successfully",
      });
      setIsAddCouponOpen(false);
      setCouponFormData({
        partnerId: 0,
        code: "",
        type: "percentage",
        value: 10,
        description: "",
        isActive: true,
        maxUses: null,
        endDate: null
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add coupon",
        variant: "destructive"
      });
    }
  });

  const updateCouponStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number, isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/affiliate/coupons/${id}`, { isActive });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/coupons'] });
      toast({
        title: "Success",
        description: "Coupon status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update coupon status",
        variant: "destructive"
      });
    }
  });

  const addPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const response = await apiRequest('POST', '/api/affiliate/payments', data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/transactions'] });
      toast({
        title: "Success",
        description: "Payment added successfully",
      });
      setIsAddPaymentOpen(false);
      setPaymentFormData({
        partnerId: 0,
        amount: 0,
        currency: "USD",
        status: "processing",
        notes: "",
        transactions: []
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment",
        variant: "destructive"
      });
    }
  });

  const updatePaymentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const response = await apiRequest('PATCH', `/api/affiliate/payments/${id}/status`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/payments'] });
      toast({
        title: "Success",
        description: "Payment status updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment status",
        variant: "destructive"
      });
    }
  });

  // Helper Functions
  const handleAddPartner = () => {
    addPartnerMutation.mutate(partnerFormData);
  };

  const handleApprovePartner = (id: number) => {
    approvePartnerMutation.mutate(id);
  };

  const handleAddCoupon = () => {
    addCouponMutation.mutate(couponFormData);
  };

  const handleUpdateCouponStatus = (id: number, isActive: boolean) => {
    updateCouponStatusMutation.mutate({ id, isActive });
  };

  const handleAddPayment = () => {
    addPaymentMutation.mutate(paymentFormData);
  };

  const handleUpdatePaymentStatus = (id: number, status: string) => {
    updatePaymentStatusMutation.mutate({ id, status });
  };

  const filteredPartners = partners.filter((partner: AffiliatePartner) => 
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCoupons = coupons.filter((coupon: AffiliateCoupon) => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find partner name by ID
  const getPartnerName = (id: number) => {
    const partner = partners.find((p: AffiliatePartner) => p.id === id);
    return partner ? partner.name : "Unknown Partner";
  };

  // Calculate total unpaid commissions
  const calculateUnpaidCommissions = (partnerId: number) => {
    return transactions
      .filter((t: AffiliateTransaction) => t.partnerId === partnerId && t.status === 'unpaid')
      .reduce((sum: number, t: AffiliateTransaction) => sum + t.commissionAmount, 0);
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Affiliate Program Management</CardTitle>
        <CardDescription>
          Manage affiliate partners, coupons, transactions, and payments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="partners" className="flex items-center gap-2">
                <Users size={16} />
                Partners
              </TabsTrigger>
              <TabsTrigger value="coupons" className="flex items-center gap-2">
                <Tag size={16} />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <ShoppingCart size={16} />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2">
                <DollarSign size={16} />
                Payments
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              {activeTab === 'partners' && (
                <Dialog open={isAddPartnerOpen} onOpenChange={setIsAddPartnerOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus size={16} />
                      Add Partner
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Affiliate Partner</DialogTitle>
                      <DialogDescription>
                        Fill in the details to add a new affiliate partner to the program.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input 
                          id="name"
                          value={partnerFormData.name}
                          onChange={(e) => setPartnerFormData({...partnerFormData, name: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input 
                          id="email"
                          type="email"
                          value={partnerFormData.email}
                          onChange={(e) => setPartnerFormData({...partnerFormData, email: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">Password</Label>
                        <Input 
                          id="password"
                          type="password"
                          value={partnerFormData.password}
                          onChange={(e) => setPartnerFormData({...partnerFormData, password: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="commission" className="text-right">Commission (%)</Label>
                        <Input 
                          id="commission"
                          type="number"
                          value={partnerFormData.commissionRate}
                          onChange={(e) => setPartnerFormData({...partnerFormData, commissionRate: parseFloat(e.target.value)})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="website" className="text-right">Website</Label>
                        <Input 
                          id="website"
                          value={partnerFormData.website}
                          onChange={(e) => setPartnerFormData({...partnerFormData, website: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea 
                          id="description"
                          value={partnerFormData.description}
                          onChange={(e) => setPartnerFormData({...partnerFormData, description: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">Admin Notes</Label>
                        <Textarea 
                          id="notes"
                          value={partnerFormData.notes}
                          onChange={(e) => setPartnerFormData({...partnerFormData, notes: e.target.value})}
                          className="col-span-3"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddPartnerOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddPartner} disabled={addPartnerMutation.isPending}>
                        {addPartnerMutation.isPending ? "Adding..." : "Add Partner"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              {activeTab === 'coupons' && (
                <Dialog open={isAddCouponOpen} onOpenChange={setIsAddCouponOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus size={16} />
                      Add Coupon
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Coupon</DialogTitle>
                      <DialogDescription>
                        Create a new discount coupon for an affiliate partner.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="partnerId" className="text-right">Partner</Label>
                        <Select 
                          value={couponFormData.partnerId.toString()} 
                          onValueChange={(value) => setCouponFormData({...couponFormData, partnerId: parseInt(value)})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a partner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {partners
                                .filter((p: AffiliatePartner) => p.status === 'active')
                                .map((partner: AffiliatePartner) => (
                                  <SelectItem key={partner.id} value={partner.id.toString()}>
                                    {partner.name}
                                  </SelectItem>
                                ))
                              }
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="code" className="text-right">Coupon Code</Label>
                        <Input 
                          id="code"
                          value={couponFormData.code}
                          onChange={(e) => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})}
                          className="col-span-3"
                          placeholder="e.g., SUMMER20"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="type" className="text-right">Discount Type</Label>
                        <Select 
                          value={couponFormData.type} 
                          onValueChange={(value) => setCouponFormData({...couponFormData, type: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                            <SelectItem value="free_trial">Free Trial</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="value" className="text-right">
                          {couponFormData.type === 'percentage' ? 'Percentage' : 
                           couponFormData.type === 'fixed' ? 'Amount' : 'Days'}
                        </Label>
                        <Input 
                          id="value"
                          type="number"
                          value={couponFormData.value}
                          onChange={(e) => setCouponFormData({...couponFormData, value: parseFloat(e.target.value)})}
                          className="col-span-3"
                          placeholder={couponFormData.type === 'percentage' ? "10" : 
                                       couponFormData.type === 'fixed' ? "10.00" : "14"}
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="maxUses" className="text-right">Max Uses</Label>
                        <Input 
                          id="maxUses"
                          type="number"
                          value={couponFormData.maxUses || ""}
                          onChange={(e) => setCouponFormData({
                            ...couponFormData, 
                            maxUses: e.target.value ? parseInt(e.target.value) : null
                          })}
                          className="col-span-3"
                          placeholder="Unlimited"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea 
                          id="description"
                          value={couponFormData.description}
                          onChange={(e) => setCouponFormData({...couponFormData, description: e.target.value})}
                          className="col-span-3"
                          placeholder="Optional description for internal use"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddCouponOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleAddCoupon} 
                        disabled={addCouponMutation.isPending || !couponFormData.partnerId}
                      >
                        {addCouponMutation.isPending ? "Creating..." : "Create Coupon"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              {activeTab === 'payments' && (
                <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus size={16} />
                      Create Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Payment</DialogTitle>
                      <DialogDescription>
                        Process a payment for affiliate commissions.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="paymentPartnerId" className="text-right">Partner</Label>
                        <Select 
                          value={paymentFormData.partnerId.toString()} 
                          onValueChange={(value) => {
                            const partnerId = parseInt(value);
                            setPaymentFormData({
                              ...paymentFormData, 
                              partnerId,
                              amount: calculateUnpaidCommissions(partnerId),
                            });
                          }}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a partner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {partners
                                .filter((p: AffiliatePartner) => p.status === 'active')
                                .map((partner: AffiliatePartner) => {
                                  const unpaidAmount = calculateUnpaidCommissions(partner.id);
                                  return (
                                    <SelectItem key={partner.id} value={partner.id.toString()}>
                                      {partner.name} (${unpaidAmount.toFixed(2)} unpaid)
                                    </SelectItem>
                                  );
                                })
                              }
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">Amount</Label>
                        <Input 
                          id="amount"
                          type="number"
                          step="0.01"
                          value={paymentFormData.amount}
                          onChange={(e) => setPaymentFormData({...paymentFormData, amount: parseFloat(e.target.value)})}
                          className="col-span-3"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="currency" className="text-right">Currency</Label>
                        <Select 
                          value={paymentFormData.currency} 
                          onValueChange={(value) => setPaymentFormData({...paymentFormData, currency: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                            <SelectItem value="AUD">AUD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">Notes</Label>
                        <Textarea 
                          id="notes"
                          value={paymentFormData.notes}
                          onChange={(e) => setPaymentFormData({...paymentFormData, notes: e.target.value})}
                          className="col-span-3"
                          placeholder="Payment notes, reference numbers, etc."
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleAddPayment} 
                        disabled={addPaymentMutation.isPending || !paymentFormData.partnerId || paymentFormData.amount <= 0}
                      >
                        {addPaymentMutation.isPending ? "Creating..." : "Create Payment"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>

          <TabsContent value="partners" className="border rounded-md p-4">
            {partnersLoading ? (
              <div className="flex justify-center my-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading partners...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commission Rate</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No partners found. Add your first affiliate partner to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.map((partner: AffiliatePartner) => (
                      <TableRow key={partner.id}>
                        <TableCell>{partner.id}</TableCell>
                        <TableCell>{partner.name}</TableCell>
                        <TableCell>{partner.email}</TableCell>
                        <TableCell>
                          <StatusBadge status={partner.status} />
                        </TableCell>
                        <TableCell>{partner.commissionRate}%</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(partner.createdAt), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {partner.status === 'pending' && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleApprovePartner(partner.id)}
                                className="h-8 flex items-center gap-1"
                              >
                                <Check size={14} />
                                Approve
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedPartnerId(partner.id)}
                              className="h-8 flex items-center gap-1"
                            >
                              <FileText size={14} />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="coupons" className="border rounded-md p-4">
            <div className="mb-4">
              <Select
                value={selectedPartnerId?.toString() || ""}
                onValueChange={(value) => setSelectedPartnerId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Filter by partner (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Partners</SelectItem>
                  {partners.map((partner: AffiliatePartner) => (
                    <SelectItem key={partner.id} value={partner.id.toString()}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {couponsLoading ? (
              <div className="flex justify-center my-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading coupons...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Partner</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No coupons found. Create your first coupon to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoupons.map((coupon: AffiliateCoupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>{coupon.id}</TableCell>
                        <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                        <TableCell>{getPartnerName(coupon.partnerId)}</TableCell>
                        <TableCell>
                          {coupon.type === 'percentage' ? `${coupon.value}% off` :
                           coupon.type === 'fixed' ? `$${coupon.value.toFixed(2)} off` :
                           coupon.type === 'free_trial' ? `${coupon.value} day free trial` : coupon.type}
                        </TableCell>
                        <TableCell>
                          <Badge className={coupon.isActive ? "bg-green-500" : "bg-red-500"}>
                            {coupon.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {coupon.currentUses}
                          {coupon.maxUses && ` / ${coupon.maxUses}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant={coupon.isActive ? "destructive" : "default"}
                              onClick={() => handleUpdateCouponStatus(coupon.id, !coupon.isActive)}
                              className="h-8 flex items-center gap-1"
                            >
                              {coupon.isActive ? <X size={14} /> : <Check size={14} />}
                              {coupon.isActive ? "Disable" : "Enable"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="transactions" className="border rounded-md p-4">
            <div className="mb-4">
              <Select
                value={selectedPartnerId?.toString() || ""}
                onValueChange={(value) => setSelectedPartnerId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a partner to view transactions" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner: AffiliatePartner) => (
                    <SelectItem key={partner.id} value={partner.id.toString()}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!selectedPartnerId ? (
              <div className="flex justify-center items-center h-64 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Select a partner to view their transactions</p>
              </div>
            ) : transactionsLoading ? (
              <div className="flex justify-center my-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading transactions...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No transactions found for this partner.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction: AffiliateTransaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{transaction.currency} {transaction.amount.toFixed(2)}</TableCell>
                        <TableCell>{transaction.currency} {transaction.commissionAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          <StatusBadge status={transaction.status} />
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 flex items-center gap-1"
                          >
                            <FileText size={14} />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="payments" className="border rounded-md p-4">
            <div className="mb-4">
              <Select
                value={selectedPartnerId?.toString() || ""}
                onValueChange={(value) => setSelectedPartnerId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a partner to view payments" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((partner: AffiliatePartner) => (
                    <SelectItem key={partner.id} value={partner.id.toString()}>
                      {partner.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {!selectedPartnerId ? (
              <div className="flex justify-center items-center h-64 border rounded-md bg-muted/20">
                <p className="text-muted-foreground">Select a partner to view their payments</p>
              </div>
            ) : paymentsLoading ? (
              <div className="flex justify-center my-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading payments...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No payments found for this partner.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment: AffiliatePayment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.id}</TableCell>
                        <TableCell>
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{payment.currency} {payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <StatusBadge status={payment.status} />
                        </TableCell>
                        <TableCell>{payment.reference || "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payment.status === "processing" && (
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleUpdatePaymentStatus(payment.id, "completed")}
                                className="h-8 flex items-center gap-1"
                              >
                                <Check size={14} />
                                Complete
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 flex items-center gap-1"
                            >
                              <FileText size={14} />
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {activeTab === "partners" ? `Showing ${filteredPartners.length} partners` :
           activeTab === "coupons" ? `Showing ${filteredCoupons.length} coupons` :
           activeTab === "transactions" && selectedPartnerId ? `Showing ${transactions.length} transactions` :
           activeTab === "payments" && selectedPartnerId ? `Showing ${payments.length} payments` :
           "Select options to view data"}
        </div>
        <div className="flex items-center">
          <Button variant="link" size="sm">
            <Send className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AffiliateManagement;