import React, { useState } from 'react';
import { Link } from 'wouter';
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
  ChevronDown, ChevronUp, Search, Plus, Copy, Check, X, DollarSign,
  Tag, LineChart, RefreshCw, FileText, Send, Download, Link as LinkIcon, Globe, Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAffiliateAuth } from '@/hooks/use-affiliate-auth';

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

interface AffiliateReferral {
  id: number;
  partnerId: number;
  referralCode: string;
  referralUrl: string;
  name: string;
  clickCount: number;
  conversionCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AffiliateTransaction {
  id: number;
  amount: number;
  commissionAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentDate: string | null;
  transactionType: string;
}

interface AffiliatePayment {
  id: number;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  paymentDate: string | null;
  reference: string | null;
}

// Coupon Form
interface CouponFormData {
  code: string;
  type: string;
  value: number;
  description: string;
}

// Referral Form
interface ReferralFormData {
  name: string;
  referralCode: string;
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
const PartnerPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [isAddReferralOpen, setIsAddReferralOpen] = useState(false);
  const [couponFormData, setCouponFormData] = useState<CouponFormData>({
    code: "",
    type: "percentage",
    value: 10,
    description: ""
  });
  const [referralFormData, setReferralFormData] = useState<ReferralFormData>({
    name: "",
    referralCode: ""
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Queries
  const { partner, isLoading: partnerLoading } = useAffiliateAuth();

  const { data: coupons = [], isLoading: couponsLoading } = useQuery({
    queryKey: ['/api/affiliate/partners', partner?.id, 'coupons'],
    queryFn: async () => {
      if (!partner) return [];
      const response = await apiRequest('GET', `/api/affiliate/partners/${partner.id}/coupons`);
      return await response.json();
    },
    enabled: !!partner
  });

  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ['/api/affiliate/partners', partner?.id, 'referrals'],
    queryFn: async () => {
      if (!partner) return [];
      const response = await apiRequest('GET', `/api/affiliate/partners/${partner.id}/referrals`);
      return await response.json();
    },
    enabled: !!partner
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/affiliate/partners', partner?.id, 'transactions'],
    queryFn: async () => {
      if (!partner) return [];
      const response = await apiRequest('GET', `/api/affiliate/partners/${partner.id}/transactions`);
      return await response.json();
    },
    enabled: !!partner
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/affiliate/partners', partner?.id, 'payments'],
    queryFn: async () => {
      if (!partner) return [];
      const response = await apiRequest('GET', `/api/affiliate/partners/${partner.id}/payments`);
      return await response.json();
    },
    enabled: !!partner
  });

  // Mutations
  const addCouponMutation = useMutation({
    mutationFn: async (data: CouponFormData) => {
      const response = await apiRequest('POST', `/api/affiliate/partners/${partner.id}/coupons`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/partners', partner?.id, 'coupons'] });
      toast({
        title: "Success",
        description: "Coupon added successfully",
      });
      setIsAddCouponOpen(false);
      setCouponFormData({
        code: "",
        type: "percentage",
        value: 10,
        description: ""
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

  const addReferralMutation = useMutation({
    mutationFn: async (data: ReferralFormData) => {
      const response = await apiRequest('POST', `/api/affiliate/partners/${partner.id}/referrals`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/affiliate/partners', partner?.id, 'referrals'] });
      toast({
        title: "Success",
        description: "Referral link created successfully",
      });
      setIsAddReferralOpen(false);
      setReferralFormData({
        name: "",
        referralCode: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create referral link",
        variant: "destructive"
      });
    }
  });

  // Helper Functions
  const handleAddCoupon = () => {
    addCouponMutation.mutate(couponFormData);
  };

  const handleAddReferral = () => {
    addReferralMutation.mutate(referralFormData);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    
    toast({
      title: "Copied!",
      description: `Code "${code}" copied to clipboard`,
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    
    toast({
      title: "Copied!",
      description: "Referral URL copied to clipboard",
    });
  };

  const filteredCoupons = coupons.filter((coupon: AffiliateCoupon) => 
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReferrals = referrals.filter((referral: AffiliateReferral) => 
    referral.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    referral.referralCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate earnings statistics
  const totalEarnings = transactions
    .filter(t => t.status === 'paid' || t.status === 'completed')
    .reduce((sum, t) => sum + t.commissionAmount, 0);

  const pendingEarnings = transactions
    .filter(t => t.status === 'pending' || t.status === 'unpaid')
    .reduce((sum, t) => sum + t.commissionAmount, 0);

  const totalConversions = transactions.length;
  
  const conversionRate = referrals.length > 0
    ? (referrals.reduce((sum, r) => sum + r.conversionCount, 0) / referrals.reduce((sum, r) => sum + r.clickCount, 0)) * 100
    : 0;

  // Generate data for the Last 30 Days section
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - i);
    return date.toISOString().split('T')[0];
  }).reverse();

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Affiliate Partner Portal</CardTitle>
            <CardDescription>
              Manage your affiliate marketing, coupons, referrals, and earnings
            </CardDescription>
          </div>
          {partner && (
            <Badge variant="outline" className="text-sm font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              {partner.status === 'active' ? 'Active Partner' : 'Partner'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {partnerLoading ? (
          <div className="flex justify-center my-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2">Loading your account...</span>
          </div>
        ) : !partner ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <h3 className="text-xl font-semibold">Not logged in</h3>
            <p className="text-muted-foreground">Please log in to access your affiliate dashboard</p>
            <Link href="/affiliate/login">
              <Button variant="default">Log In</Button>
            </Link>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <LineChart size={16} />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="coupons" className="flex items-center gap-2">
                <Tag size={16} />
                Coupons
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <LinkIcon size={16} />
                Referrals
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center gap-2">
                <DollarSign size={16} />
                Earnings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lifetime earnings from your affiliate account
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Earnings waiting to be paid out
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Conversions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalConversions}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of customers who used your links
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Conversion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Percentage of clicks that converted to sales
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.slice(0, 5).map((transaction: AffiliateTransaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {transaction.transactionType === 'new_subscription' ? 'New Subscription' : 
                             transaction.transactionType === 'renewal' ? 'Renewal' :
                             transaction.transactionType}
                          </TableCell>
                          <TableCell>{transaction.currency} {transaction.commissionAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <StatusBadge status={transaction.status} />
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No transactions yet. Start sharing your affiliate links and coupons!
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Affiliate Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Account Information</h3>
                      <dl className="grid grid-cols-3 gap-1">
                        <dt className="text-sm text-muted-foreground">Name:</dt>
                        <dd className="text-sm col-span-2">{partner.name}</dd>
                        
                        <dt className="text-sm text-muted-foreground">Email:</dt>
                        <dd className="text-sm col-span-2">{partner.email}</dd>
                        
                        <dt className="text-sm text-muted-foreground">Website:</dt>
                        <dd className="text-sm col-span-2">
                          {partner.website ? (
                            <a 
                              href={partner.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {partner.website} <Globe size={12} />
                            </a>
                          ) : "Not specified"}
                        </dd>
                        
                        <dt className="text-sm text-muted-foreground">Joined:</dt>
                        <dd className="text-sm col-span-2">
                          {new Date(partner.createdAt).toLocaleDateString()}
                        </dd>
                        
                        <dt className="text-sm text-muted-foreground">Commission Rate:</dt>
                        <dd className="text-sm col-span-2">{partner.commissionRate}%</dd>
                      </dl>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Quick Actions</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddCouponOpen(true)}
                          className="flex items-center gap-1"
                        >
                          <Tag size={14} />
                          Create Coupon
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsAddReferralOpen(true)}
                          className="flex items-center gap-1"
                        >
                          <LinkIcon size={14} />
                          Create Referral Link
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Download size={14} />
                          Download Report
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Calendar size={14} />
                          View Commission Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coupons" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <Dialog open={isAddCouponOpen} onOpenChange={setIsAddCouponOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus size={16} />
                      Create New Coupon
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Coupon</DialogTitle>
                      <DialogDescription>
                        Create a new discount coupon for your customers to use.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
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
                        <Label htmlFor="description" className="text-right">Description</Label>
                        <Textarea 
                          id="description"
                          value={couponFormData.description}
                          onChange={(e) => setCouponFormData({...couponFormData, description: e.target.value})}
                          className="col-span-3"
                          placeholder="Optional description for this coupon"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddCouponOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleAddCoupon} 
                        disabled={addCouponMutation.isPending || !couponFormData.code}
                      >
                        {addCouponMutation.isPending ? "Creating..." : "Create Coupon"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search coupons..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
              
              {couponsLoading ? (
                <div className="flex justify-center my-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading coupons...</span>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Uses</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCoupons.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No coupons found. Create your first coupon to get started!
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCoupons.map((coupon: AffiliateCoupon) => (
                            <TableRow key={coupon.id}>
                              <TableCell className="font-mono font-bold">{coupon.code}</TableCell>
                              <TableCell>
                                {coupon.type === 'percentage' ? `${coupon.value}% off` :
                                coupon.type === 'fixed' ? `$${coupon.value.toFixed(2)} off` :
                                coupon.type === 'free_trial' ? `${coupon.value} day free trial` : coupon.type}
                              </TableCell>
                              <TableCell>{coupon.description || "—"}</TableCell>
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
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCopyCode(coupon.code)}
                                  className="h-8 flex items-center gap-1"
                                >
                                  {copiedCode === coupon.code ? <Check size={14} /> : <Copy size={14} />}
                                  {copiedCode === coupon.code ? "Copied!" : "Copy Code"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sharing Instructions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Share these coupon codes with your audience to earn commissions on their purchases. 
                    You can include them in your blog posts, social media, or email newsletters.
                  </p>
                  
                  <div className="bg-muted p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Sample Message:</h4>
                    <p className="italic">
                      "Looking to improve your relationship? Try BondQuest and use my code 
                      <span className="font-mono font-bold mx-1">{filteredCoupons[0]?.code || 'YOURCODE'}</span>
                      to get 
                      {filteredCoupons[0]?.type === 'percentage' ? `${filteredCoupons[0]?.value}% off` :
                       filteredCoupons[0]?.type === 'fixed' ? `$${filteredCoupons[0]?.value.toFixed(2)} off` :
                       filteredCoupons[0]?.type === 'free_trial' ? `a ${filteredCoupons[0]?.value} day free trial` : 'a discount'} 
                      your subscription!"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="referrals" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <Dialog open={isAddReferralOpen} onOpenChange={setIsAddReferralOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2">
                      <Plus size={16} />
                      Create Referral Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Referral Link</DialogTitle>
                      <DialogDescription>
                        Create a new referral link for a specific campaign or channel.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Campaign Name</Label>
                        <Input 
                          id="name"
                          value={referralFormData.name}
                          onChange={(e) => setReferralFormData({...referralFormData, name: e.target.value})}
                          className="col-span-3"
                          placeholder="e.g., Blog Post, Instagram, Email"
                        />
                      </div>
                      
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="referralCode" className="text-right">Custom Code (Optional)</Label>
                        <Input 
                          id="referralCode"
                          value={referralFormData.referralCode}
                          onChange={(e) => setReferralFormData({...referralFormData, referralCode: e.target.value})}
                          className="col-span-3"
                          placeholder="Leave blank for auto-generated code"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddReferralOpen(false)}>Cancel</Button>
                      <Button 
                        onClick={handleAddReferral} 
                        disabled={addReferralMutation.isPending || !referralFormData.name}
                      >
                        {addReferralMutation.isPending ? "Creating..." : "Create Referral Link"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search referrals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-[300px]"
                  />
                </div>
              </div>
              
              {referralsLoading ? (
                <div className="flex justify-center my-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2">Loading referrals...</span>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Referral Code</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Conversions</TableHead>
                          <TableHead>Conversion Rate</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReferrals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No referral links found. Create your first referral link to get started!
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredReferrals.map((referral: AffiliateReferral) => (
                            <TableRow key={referral.id}>
                              <TableCell>{referral.name}</TableCell>
                              <TableCell className="font-mono">{referral.referralCode}</TableCell>
                              <TableCell>{referral.clickCount}</TableCell>
                              <TableCell>{referral.conversionCount}</TableCell>
                              <TableCell>
                                {referral.clickCount > 0 
                                  ? ((referral.conversionCount / referral.clickCount) * 100).toFixed(1) 
                                  : "0"}%
                              </TableCell>
                              <TableCell>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCopyUrl(referral.referralUrl)}
                                  className="h-8 flex items-center gap-1"
                                >
                                  <Link size={14} />
                                  Copy Link
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Referral Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Your referral links include tracking so you get credit for every signup.
                    Here are some effective ways to share them:
                  </p>
                  
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Add your referral link to your website or blog</li>
                    <li>Share it on social media platforms</li>
                    <li>Include it in your email signature</li>
                    <li>Create different links for different marketing channels to track performance</li>
                    <li>Combine with coupon codes for higher conversion rates</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Earned
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Payments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${pendingEarnings.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Commission Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{partner.commissionRate}%</div>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Transaction Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary inline mr-2" />
                            Loading transactions...
                          </TableCell>
                        </TableRow>
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4">
                            No transactions yet. Start sharing your affiliate links!
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction: AffiliateTransaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              {new Date(transaction.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{transaction.currency} {transaction.amount.toFixed(2)}</TableCell>
                            <TableCell>{transaction.currency} {transaction.commissionAmount.toFixed(2)}</TableCell>
                            <TableCell>
                              {transaction.transactionType === 'new_subscription' ? 'New Subscription' : 
                               transaction.transactionType === 'renewal' ? 'Renewal' :
                               transaction.transactionType}
                            </TableCell>
                            <TableCell>
                              <StatusBadge status={transaction.status} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            <RefreshCw className="h-4 w-4 animate-spin text-primary inline mr-2" />
                            Loading payments...
                          </TableCell>
                        </TableRow>
                      ) : payments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4">
                            No payments processed yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        payments.map((payment: AffiliatePayment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{payment.currency} {payment.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <StatusBadge status={payment.status} />
                            </TableCell>
                            <TableCell>{payment.reference || "—"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-muted-foreground">
          {partner && `Logged in as ${partner.name} • Commission Rate: ${partner.commissionRate}%`}
        </div>
        <Button variant="link" size="sm">
          <FileText className="h-4 w-4 mr-2" />
          View Terms and Conditions
        </Button>
      </CardFooter>
    </Card>
  );
};

export default PartnerPortal;