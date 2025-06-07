import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { storage } from '../storage';

const router = Router();

// Middleware to check if user is authenticated as affiliate partner
const isAffiliatePartner = async (req: Request, res: Response, next: Function) => {
  if (!req.session.affiliateId) {
    return res.status(401).json({ message: 'Unauthorized: Not logged in as affiliate partner' });
  }
  
  const partner = await storage.getAffiliatePartner(req.session.affiliateId);
  if (!partner) {
    req.session.affiliateId = undefined;
    return res.status(401).json({ message: 'Unauthorized: Partner not found' });
  }
  
  if (partner.status !== 'active') {
    return res.status(403).json({ message: 'Forbidden: Partner account is not active' });
  }
  
  req.affiliatePartner = partner;
  next();
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized: Not logged in' });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
  
  next();
};

// Schema validation
const partnerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  commissionRate: z.number().min(0).max(100),
  website: z.string().url().optional(),
  description: z.string().optional(),
  notes: z.string().optional()
});

const couponSchema = z.object({
  partnerId: z.number().int().positive(),
  code: z.string().min(3).max(20),
  type: z.enum(['percentage', 'fixed', 'free_trial']),
  value: z.number().positive(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().positive().optional().nullable()
});

const partnerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const paymentSchema = z.object({
  partnerId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.string(),
  status: z.string(),
  notes: z.string().optional(),
  transactions: z.array(z.number()).optional()
});

const referralSchema = z.object({
  name: z.string(),
  referralCode: z.string().optional()
});

// Affiliate Partner Routes (Admin)
router.get('/partners', isAdmin, async (req: Request, res: Response) => {
  try {
    const partners = await storage.getAffiliatePartners();
    res.json(partners);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/partners', isAdmin, async (req: Request, res: Response) => {
  try {
    const data = partnerSchema.parse(req.body);
    
    // Check if email already exists
    const existingPartner = await storage.getAffiliatePartnerByEmail(data.email);
    if (existingPartner) {
      return res.status(400).json({ message: 'Partner with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create partner with hashed password
    const partner = await storage.createAffiliatePartner({
      ...data,
      password: hashedPassword,
      status: 'pending'
    });
    
    // Remove password from response
    const { password, ...partnerData } = partner;
    
    res.status(201).json(partnerData);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
});

router.post('/partners/:id/approve', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    const partner = await storage.approveAffiliatePartner(partnerId);
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    // Remove password from response
    const { password, ...partnerData } = partner;
    
    res.json(partnerData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Coupon Routes (Admin)
router.get('/coupons', isAdmin, async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.query;
    
    let coupons;
    if (partnerId) {
      const id = parseInt(partnerId as string);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid partner ID' });
      }
      coupons = await storage.getAffiliateCouponsByPartnerId(id);
    } else {
      coupons = await storage.getAffiliateCoupons();
    }
    
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/coupons', isAdmin, async (req: Request, res: Response) => {
  try {
    const data = couponSchema.parse(req.body);
    
    // Check if partner exists
    const partner = await storage.getAffiliatePartnerById(data.partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    // Check if coupon code already exists
    const existingCoupon = await storage.getAffiliateCouponByCode(data.code);
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    
    const coupon = await storage.createAffiliateCoupon({
      ...data,
      isActive: data.isActive ?? true,
      currentUses: 0
    });
    
    res.status(201).json(coupon);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
});

router.patch('/coupons/:id', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const couponId = parseInt(id);
    
    if (isNaN(couponId)) {
      return res.status(400).json({ message: 'Invalid coupon ID' });
    }
    
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean' });
    }
    
    const coupon = await storage.updateAffiliateCouponStatus(couponId, isActive);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }
    
    res.json(coupon);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Transaction & Payment Routes (Admin)
router.get('/transactions', isAdmin, async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.query;
    
    if (!partnerId) {
      return res.status(400).json({ message: 'Partner ID is required' });
    }
    
    const id = parseInt(partnerId as string);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    const transactions = await storage.getAffiliateTransactionsByPartnerId(id);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/payments', isAdmin, async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.query;
    
    if (!partnerId) {
      return res.status(400).json({ message: 'Partner ID is required' });
    }
    
    const id = parseInt(partnerId as string);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    const payments = await storage.getAffiliatePaymentsByPartnerId(id);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/payments', isAdmin, async (req: Request, res: Response) => {
  try {
    const data = paymentSchema.parse(req.body);
    
    // Check if partner exists
    const partner = await storage.getAffiliatePartnerById(data.partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    const payment = await storage.createAffiliatePayment({
      partnerId: data.partnerId,
      amount: data.amount,
      currency: data.currency,
      status: data.status,
      notes: data.notes,
      reference: `PAY-${Date.now()}`
    });
    
    // If transactions are provided, mark them as paid
    if (data.transactions && data.transactions.length > 0) {
      await Promise.all(data.transactions.map(transactionId => 
        storage.updateAffiliateTransactionStatus(transactionId, 'paid', payment.id)
      ));
    }
    
    res.status(201).json(payment);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
});

router.patch('/payments/:id/status', isAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentId = parseInt(id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({ message: 'Invalid payment ID' });
    }
    
    const { status } = req.body;
    
    if (!status || typeof status !== 'string') {
      return res.status(400).json({ message: 'Status is required and must be a string' });
    }
    
    const payment = await storage.updateAffiliatePaymentStatus(paymentId, status);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Affiliate Partner Login/Authentication
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = partnerLoginSchema.parse(req.body);
    
    const partner = await storage.getAffiliatePartnerByEmail(email);
    if (!partner) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const passwordMatch = await bcrypt.compare(password, partner.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (partner.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }
    
    // Set affiliate session
    req.session.affiliateId = partner.id;
    
    // Remove password from response
    const { password: _, ...partnerData } = partner;
    
    res.json(partnerData);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  req.session.affiliateId = undefined;
  res.status(200).json({ message: 'Logged out successfully' });
});

router.get('/me', async (req: Request, res: Response) => {
  if (!req.session.affiliateId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  try {
    const partner = await storage.getAffiliatePartner(req.session.affiliateId);
    
    if (!partner) {
      req.session.affiliateId = undefined;
      return res.status(401).json({ message: 'Partner not found' });
    }
    
    // Remove password from response
    const { password, ...partnerData } = partner;
    
    res.json(partnerData);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Partner Routes (for logged-in Affiliate Partners)
router.get('/partners/:id/coupons', isAffiliatePartner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    // Ensure partners can only access their own data
    if (partnerId !== req.affiliatePartner.id) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own data' });
    }
    
    const coupons = await storage.getAffiliateCouponsByPartnerId(partnerId);
    res.json(coupons);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/partners/:id/coupons', isAffiliatePartner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    // Ensure partners can only create coupons for themselves
    if (partnerId !== req.affiliatePartner.id) {
      return res.status(403).json({ message: 'Forbidden: You can only create coupons for yourself' });
    }
    
    const { code, type, value, description } = req.body;
    
    if (!code || !type || value === undefined) {
      return res.status(400).json({ message: 'code, type, and value are required' });
    }
    
    // Check if coupon code already exists
    const existingCoupon = await storage.getAffiliateCouponByCode(code);
    if (existingCoupon) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }
    
    const coupon = await storage.createAffiliateCoupon({
      partnerId,
      code,
      type,
      value,
      description,
      isActive: true,
      currentUses: 0
    });
    
    res.status(201).json(coupon);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/partners/:id/referrals', isAffiliatePartner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    // Ensure partners can only access their own data
    if (partnerId !== req.affiliatePartner.id) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own data' });
    }
    
    const referrals = await storage.getAffiliateReferralsByPartnerId(partnerId);
    res.json(referrals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/partners/:id/referrals', isAffiliatePartner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    // Ensure partners can only create referrals for themselves
    if (partnerId !== req.affiliatePartner.id) {
      return res.status(403).json({ message: 'Forbidden: You can only create referrals for yourself' });
    }
    
    const data = referralSchema.parse(req.body);
    
    // Generate referral code if not provided
    let referralCode = data.referralCode;
    if (!referralCode) {
      referralCode = `${req.affiliatePartner.name.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    
    // Check if referral code already exists
    const existingReferral = await storage.getAffiliateReferralByCode(referralCode);
    if (existingReferral) {
      return res.status(400).json({ message: 'Referral code already exists' });
    }
    
    // Create base URL
    const baseUrl = process.env.BASE_URL || 'https://bondquest.app';
    const referralUrl = `${baseUrl}/register?ref=${referralCode}`;
    
    const referral = await storage.createAffiliateReferral({
      partnerId,
      name: data.name,
      referralCode,
      referralUrl,
      clickCount: 0,
      conversionCount: 0,
      status: 'active'
    });
    
    res.status(201).json(referral);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', errors: error.errors });
    }
    res.status(500).json({ message: error.message });
  }
});

router.get('/partners/:id/transactions', isAffiliatePartner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    // Ensure partners can only access their own data
    if (partnerId !== req.affiliatePartner.id) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own data' });
    }
    
    const transactions = await storage.getAffiliateTransactionsByPartnerId(partnerId);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/partners/:id/payments', isAffiliatePartner, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const partnerId = parseInt(id);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ message: 'Invalid partner ID' });
    }
    
    // Ensure partners can only access their own data
    if (partnerId !== req.affiliatePartner.id) {
      return res.status(403).json({ message: 'Forbidden: You can only access your own data' });
    }
    
    const payments = await storage.getAffiliatePaymentsByPartnerId(partnerId);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// User-facing coupon routes
router.post('/validate-coupon', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }
    
    const coupon = await storage.getAffiliateCouponByCode(code);
    
    if (!coupon) {
      return res.json({ valid: false, message: 'Invalid coupon code' });
    }
    
    if (!coupon.isActive) {
      return res.json({ valid: false, message: 'This coupon is no longer active' });
    }
    
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return res.json({ valid: false, message: 'This coupon has reached its usage limit' });
    }
    
    // Check if the coupon is expired (if we had an expiration date field)
    // if (coupon.expirationDate && new Date(coupon.expirationDate) < new Date()) {
    //   return res.json({ valid: false, message: 'This coupon has expired' });
    // }
    
    res.json({ 
      valid: true,
      discount: {
        type: coupon.type,
        value: coupon.value
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/apply-coupon', async (req: Request, res: Response) => {
  try {
    const { code, subscriptionId } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: 'Coupon code is required' });
    }
    
    const coupon = await storage.getAffiliateCouponByCode(code);
    
    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }
    
    if (!coupon.isActive) {
      return res.status(400).json({ message: 'This coupon is no longer active' });
    }
    
    if (coupon.maxUses !== null && coupon.currentUses >= coupon.maxUses) {
      return res.status(400).json({ message: 'This coupon has reached its usage limit' });
    }
    
    // Calculate discount amount (this would be used with actual subscription data)
    let discountAmount = 0;
    
    if (subscriptionId) {
      // Fetch subscription and calculate actual discount
      const subscription = await storage.getSubscriptionTier(subscriptionId);
      
      if (subscription) {
        if (coupon.type === 'percentage') {
          discountAmount = (subscription.monthlyPrice * coupon.value) / 100;
        } else if (coupon.type === 'fixed') {
          discountAmount = Math.min(coupon.value, subscription.monthlyPrice);
        }
        // For free_trial type, we would typically extend the trial period
      }
    }
    
    // Increment coupon usage
    await storage.incrementAffiliateCouponUsage(coupon.id);
    
    // If user is authenticated, record this redemption
    if (req.isAuthenticated()) {
      // Create a transaction for the partner
      await storage.createAffiliateTransaction({
        partnerId: coupon.partnerId,
        userId: req.user.id,
        couponId: coupon.id,
        amount: discountAmount,
        // Commission calculation (example: 10% of the transaction amount)
        commissionAmount: discountAmount * (coupon.partner.commissionRate / 100),
        currency: 'USD',
        status: 'unpaid',
        transactionType: 'coupon_redemption'
      });
    }
    
    res.json({
      success: true,
      discount: {
        type: coupon.type,
        value: coupon.value,
        discountAmount
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Types for Express
declare global {
  namespace Express {
    interface Request {
      affiliatePartner?: any;
    }
    
    interface User {
      id: number;
      isAdmin: boolean;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    affiliateId?: number;
    user?: any;
  }
}

export default router;