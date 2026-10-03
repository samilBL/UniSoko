export type ProductCategory =
  | 'Laptops'
  | 'Laptops & Computers'
  | 'Phones'
  | 'Smart Phones & Accessories'
  | 'Accessories'
  | 'Power & Audio'
  | 'Room Gear'
  | 'Student Lifestyle Gear'
  | 'Campus Essentials';

export type ProductCondition = 'Brand New' | 'Refurbished' | 'Grade A Like-New';

export type StockStatus = 'In Stock' | 'New Stock' | 'Trending' | 'Coming Soon';

export type DeliverySpotType = 'Hostel' | 'Landmark' | 'Off-Campus' | 'Courier';

export type OrderStatus = 'Pending Verification' | 'Approved' | 'Out for Delivery' | 'Completed' | 'Cancelled';

export type PaymentStatus = 'Submitted' | 'Verification' | 'Verified' | 'Failed';

export type FulfillmentStatus = 'Unconfirmed' | 'Confirmed' | 'Preparing' | 'Ready for Dispatch';

export type DeliveryStatus = 'Not Dispatched' | 'With Winga' | 'With Courier' | 'Ready for Pickup' | 'Delivered';

export interface OrderStatusEvent {
  statusType: 'payment' | 'fulfillment' | 'delivery' | 'cancellation';
  status: string;
  label: string;
  changedBy: 'customer' | 'admin';
  changedAt: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  brand?: string;
  model?: string;
  priceRetail: number;
  priceWholesale: number; // min 3 units
  condition: ProductCondition;
  stockStatus: StockStatus;
  images: string[];
  specs?: Record<string, string>;
  specifications?: {
    processor?: string;
    ram?: string;
    storage?: string;
    display?: string;
    battery?: string;
    connectivity?: string;
    details?: Record<string, string>;
  };
  warrantyDays?: number;
  minWholesaleQty?: number;
  featured?: boolean;
}

export interface OrderItem {
  productId: string;
  productTitle: string;
  condition: ProductCondition;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  productId: string;
  productTitle?: string;
  product?: Product;
  buyerName: string;
  buyerPhone: string;
  university: string;
  deliverySpotType: DeliverySpotType;
  deliveryDetails: string; // e.g., Hostel Name, Room No, or Landmark
  quantity: number;
  items?: OrderItem[];
  subtotalAmount?: number;
  shippingFee?: number;
  promoDiscount?: number;
  tradeInRequestId?: string;
  tradeInEstimate?: number;
  tradeInInspectionStatus?: 'Not Required' | 'Trade-In Pending Inspection' | 'Inspected' | 'Rejected';
  cancellationStatus?: 'Not Requested' | 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed';
  totalAmount: number;
  wingaCodeUsed?: string;
  lipaNambaTxId: string;
  itemSerialNumber?: string;
  warrantyDays?: 30 | 60 | 90;
  approvedAt?: string;
  status: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  deliveryStatus?: DeliveryStatus;
  statusHistory?: OrderStatusEvent[];
  trackingToken?: string;
  createdAt: string;
}

export type KycStatus = 'Not Submitted' | 'Pending Verification' | 'Verified';

export interface WingaAgent {
  id: string;
  fullName: string;
  phone: string;
  university: string;
  joinedAt?: string;
  promoCode: string;
  totalEarnings: number;
  pendingBalance: number;
  availableBalance: number;
  paidOut: number;
  commissionRate?: number; // e.g., 0.05 for 5%
  salesCount?: number;
  studentIdCardUrl?: string;
  kycStatus?: KycStatus;
}

export type WingaApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface WingaApplication {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone: string;
  university: string;
  status: WingaApplicationStatus;
  promoCode?: string;
  submittedAt: string;
  reviewedAt?: string;
  studentIdVerified?: boolean;
}

export interface UniversityLocation {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  campus: string;
  popularSpots: string[];
  isMbeya?: boolean;
  region?: string;
  courierHub?: string;
}

export type PayoutStatus = 'Pending' | 'Paid' | 'Rejected';

export interface PayoutRequest {
  id: string;
  agentId: string;
  agentName: string;
  promoCode: string;
  phone: string;
  university: string;
  amount: number;
  status: PayoutStatus;
  requestedAt: string;
  paidAt?: string;
  b2cReferenceId?: string;
  kycStatus?: KycStatus;
}

export type TradeInCondition =
  | 'Brand New'
  | 'Like-New (Grade A)'
  | 'Gently Used (Grade B)'
  | 'Needs Repair';

export type TradeInStatus =
  | 'Pending Review'
  | 'Inspecting'
  | 'Offer Made'
  | 'Accepted'
  | 'Rejected';

export interface TradeInRequest {
  id: string;
  studentName: string;
  phone: string;
  university: string;
  itemTitle: string;
  category: ProductCategory;
  condition: TradeInCondition;
  specs: string;
  expectedPrice: number;
  offeredPrice?: number;
  imageUrl?: string;
  imageUrls?: string[];
  status: TradeInStatus;
  adminNotes?: string;
  submittedAt: string;
  orderId?: string;
  valuationInputs?: Record<string, unknown>;
}

export interface TradeInQuoteAttachment {
  requestId: string;
  token: string;
  estimatedPrice: number;
  itemTitle: string;
}

export interface StoreSettings {
  merchantName: string;
  accountName: string;
  tillNumber: string;
  supportPhone: string;
  supportWhatsApp: string;
  minPayoutThreshold: number;
  bannerNotice: string;
  partnerBadges: { name: string; shortCode: string; category: string; logoUrl?: string; url?: string }[];
  paymentMethods?: { id?: string; network: 'M-Pesa' | 'Tigo Pesa' | 'Airtel Money'; tillNumber: string; accountName: string; enabled: boolean }[];
  officialWhatsAppNumbers?: string[];
  developerProfile: DeveloperProfileSettings;
}

export interface DeveloperProfileSettings {
  name: string;
  story: string;
  phone: string;
  whatsapp: string;
  email: string;
  link: string;
  imageUrl: string;
  imagePath: string;
}

export interface BrandAsset {
  id: string;
  title: string;
  path: string;
  category: 'logo' | 'icon' | 'graphic';
  description: string;
}
