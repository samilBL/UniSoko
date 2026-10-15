export type PaymentProviderId = 'lipa_namba' | 'clickpesa' | 'selcom' | 'pesapal' | 'flutterwave';

export type SupportedNetwork = 'M-Pesa' | 'Tigo Pesa' | 'Airtel Money' | 'HaloPesa' | 'CRDB' | 'NMB';

export interface LipaNambaNetworkConfig {
  network: SupportedNetwork;
  networkSlug: string;
  tillNumber: string;
  accountName: string;
  ussdCode: string;
  accentColor: string;
  instructions: string[];
}

export interface PaymentMethodOption {
  id: PaymentProviderId;
  name: string;
  shortLabel: string;
  description: string;
  badge?: string;
  isAutomated: boolean;
  isEnabled: boolean;
  networks?: LipaNambaNetworkConfig[];
}

export interface PaymentInitiationParams {
  orderId: string;
  amount: number;
  buyerName: string;
  buyerPhone: string;
  methodId: PaymentProviderId;
}

export interface PaymentInitiationResponse {
  success: boolean;
  orderId: string;
  requiresManualReference: boolean;
  redirectUrl?: string;
  message: string;
}

export interface PaymentVerificationParams {
  orderId: string;
  transactionReference: string;
  methodId: PaymentProviderId;
  amount?: number;
}

export interface PaymentVerificationResponse {
  verified: boolean;
  status: 'Verified' | 'Pending' | 'Failed';
  transactionReference: string;
  verifiedAt?: string;
  message: string;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  name: string;
  isAutomated: boolean;
  initiatePayment(params: PaymentInitiationParams): Promise<PaymentInitiationResponse>;
  verifyPayment(params: PaymentVerificationParams): Promise<PaymentVerificationResponse>;
}
