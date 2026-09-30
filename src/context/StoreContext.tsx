'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  UniversityLocation,
  Order,
  WingaAgent,
  PayoutRequest,
  OrderStatus,
  TradeInRequest,
  TradeInStatus,
  StoreSettings,
} from '@/lib/types';
import {
  ALL_UNIVERSITIES,
  MBEYA_UNIVERSITIES,
  MOCK_ORDERS,
  MOCK_PRODUCTS,
  MOCK_WINGA_AGENTS,
  MOCK_PAYOUTS,
  MOCK_TRADE_IN_REQUESTS,
  DEFAULT_STORE_SETTINGS,
} from '@/lib/mockData';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface StoreContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  selectedCampus: UniversityLocation;
  setSelectedCampus: (campus: UniversityLocation) => void;
  cartCount: number;
  cartSubtotal: number;
  cartTotalSavings: number;
  allUniversities: UniversityLocation[];
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  approveOrder: (orderId: string) => void;
  updateOrderReceipt: (orderId: string, itemSerialNumber: string, warrantyDays: 30 | 60 | 90) => void;
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  wingaAgents: WingaAgent[];
  payoutRequests: PayoutRequest[];
  requestPayout: (agentId: string, amount: number) => { success: boolean; message: string };
  markPayoutPaid: (payoutId: string) => void;
  currentAgent: WingaAgent;
  setCurrentAgent: (agent: WingaAgent) => void;
  registerWingaAgent: (agent: WingaAgent) => void;
  uploadKycStudentId: (agentId: string, idUrl: string) => void;
  verifyKycStudentId: (agentId: string) => void;
  tradeInRequests: TradeInRequest[];
  submitTradeInRequest: (req: TradeInRequest) => void;
  updateTradeInStatus: (id: string, status: TradeInStatus, notes?: string, offeredPrice?: number) => void;
  storeSettings: StoreSettings;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<UniversityLocation>(MBEYA_UNIVERSITIES[0]); // MUST default
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [wingaAgents, setWingaAgents] = useState<WingaAgent[]>(MOCK_WINGA_AGENTS);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(MOCK_PAYOUTS);
  const [currentAgent, setCurrentAgent] = useState<WingaAgent>(MOCK_WINGA_AGENTS[0]);
  const [tradeInRequests, setTradeInRequests] = useState<TradeInRequest[]>(MOCK_TRADE_IN_REQUESTS);
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(DEFAULT_STORE_SETTINGS);

  const registerWingaAgent = (agent: WingaAgent) => {
    setWingaAgents((previous) => previous.some((existing) => existing.id === agent.id) ? previous : [agent, ...previous]);
    setCurrentAgent(agent);
  };

  // Hydrate from localStorage on client. The state updates intentionally apply the external persisted snapshot.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('unisoko_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedOrders = localStorage.getItem('unisoko_orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));

      const savedProducts = localStorage.getItem('unisoko_products');
      if (savedProducts) setProducts(JSON.parse(savedProducts));

      const savedAgents = localStorage.getItem('unisoko_agents');
      if (savedAgents) {
        const parsedAgents = JSON.parse(savedAgents);
        setWingaAgents(parsedAgents);
        if (parsedAgents.length > 0) setCurrentAgent(parsedAgents[0]);
      }

      const savedPayouts = localStorage.getItem('unisoko_payouts');
      if (savedPayouts) setPayoutRequests(JSON.parse(savedPayouts));

      const savedTradeIns = localStorage.getItem('unisoko_tradeins');
      if (savedTradeIns) setTradeInRequests(JSON.parse(savedTradeIns));

      const savedSettings = localStorage.getItem('unisoko_settings');
      if (savedSettings) setStoreSettings(JSON.parse(savedSettings));

      const savedCampusId = localStorage.getItem('unisoko_campus_id');
      if (savedCampusId) {
        const found = ALL_UNIVERSITIES.find((u) => u.id === savedCampusId);
        if (found) setSelectedCampus(found);
      }
    } catch (e) {
      console.error('Failed to load local storage state:', e);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    fetch('/api/store-settings', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ settings?: StoreSettings; persisted?: boolean }> : null)
      .then((result) => {
        if (result?.persisted && result.settings) setStoreSettings({ ...DEFAULT_STORE_SETTINGS, ...result.settings });
      })
      .catch(() => undefined);
  }, []);

  // Sync back to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('unisoko_cart', JSON.stringify(cart));
    } catch (e) {
      console.error(e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('unisoko_orders', JSON.stringify(orders));
    } catch (e) {
      console.error(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('unisoko_products', JSON.stringify(products));
    } catch (e) {
      console.error(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('unisoko_agents', JSON.stringify(wingaAgents));
    } catch (e) {
      console.error(e);
    }
  }, [wingaAgents]);

  useEffect(() => {
    try {
      localStorage.setItem('unisoko_payouts', JSON.stringify(payoutRequests));
    } catch (e) {
      console.error(e);
    }
  }, [payoutRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('unisoko_tradeins', JSON.stringify(tradeInRequests));
    } catch (e) {
      console.error(e);
    }
  }, [tradeInRequests]);

  useEffect(() => {
    try {
      localStorage.setItem('unisoko_settings', JSON.stringify(storeSettings));
    } catch (e) {
      console.error(e);
    }
  }, [storeSettings]);

  const addToCart = (product: Product, quantity: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);

    // If order used Winga code, add commission to pending balance of that agent
    if (order.wingaCodeUsed) {
      const commission = Math.round(order.totalAmount * 0.05);
      setWingaAgents((prevAgents) =>
        prevAgents.map((agent) => {
          if (agent.promoCode.toUpperCase() === order.wingaCodeUsed?.toUpperCase()) {
            return {
              ...agent,
              totalEarnings: agent.totalEarnings + commission,
              pendingBalance: agent.pendingBalance + commission,
              salesCount: (agent.salesCount || 0) + 1,
            };
          }
          return agent;
        })
      );
    }

    clearCart();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status } : ord))
    );
  };

  const approveOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    // Update order status to Approved
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'Approved' as OrderStatus, approvedAt: new Date().toISOString() } : ord
      )
    );

    // If a Winga code was used, move commission from pendingBalance into availableBalance
    if (targetOrder.wingaCodeUsed) {
      const commission = Math.round(targetOrder.totalAmount * 0.05);
      setWingaAgents((prevAgents) =>
        prevAgents.map((agent) => {
          if (
            agent.promoCode.toUpperCase() ===
            targetOrder.wingaCodeUsed?.toUpperCase()
          ) {
            const updatedPending = Math.max(0, agent.pendingBalance - commission);
            const updatedAvailable = agent.availableBalance + commission;
            return {
              ...agent,
              pendingBalance: updatedPending,
              availableBalance: updatedAvailable,
            };
          }
          return agent;
        })
      );
    }
  };

  const updateOrderReceipt = (orderId: string, itemSerialNumber: string, warrantyDays: 30 | 60 | 90) => {
    setOrders((previous) => previous.map((order) => order.id === orderId ? { ...order, itemSerialNumber: itemSerialNumber.trim(), warrantyDays } : order));
  };

  const addProduct = (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
  };

  const updateProduct = (updatedProd: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
  };

  const uploadKycStudentId = (agentId: string, idUrl: string) => {
    setWingaAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, studentIdCardUrl: idUrl, kycStatus: 'Pending Verification' }
          : a
      )
    );
    if (currentAgent.id === agentId) {
      setCurrentAgent((prev) => ({
        ...prev,
        studentIdCardUrl: idUrl,
        kycStatus: 'Pending Verification',
      }));
    }
  };

  const verifyKycStudentId = (agentId: string) => {
    setWingaAgents((prev) =>
      prev.map((a) =>
        a.id === agentId ? { ...a, kycStatus: 'Verified' } : a
      )
    );
    if (currentAgent.id === agentId) {
      setCurrentAgent((prev) => ({ ...prev, kycStatus: 'Verified' }));
    }
  };

  const requestPayout = (agentId: string, amount: number) => {
    const agent = wingaAgents.find((a) => a.id === agentId);
    if (!agent) return { success: false, message: 'Agent not found.' };
    if (agent.kycStatus !== 'Verified') {
      return { success: false, message: 'Submit your student ID and wait for admin verification before requesting a cash-out.' };
    }

    const minThreshold = storeSettings.minPayoutThreshold || 20000;
    if (amount < minThreshold) {
      return { success: false, message: `Minimum payout threshold is TZS ${minThreshold.toLocaleString()}.` };
    }

    if (agent.availableBalance < amount) {
      return { success: false, message: 'Insufficient available balance.' };
    }

    const newPayout: PayoutRequest = {
      id: `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      agentId: agent.id,
      agentName: agent.fullName,
      promoCode: agent.promoCode,
      phone: agent.phone,
      university: agent.university,
      amount: amount,
      status: 'Pending',
      requestedAt: new Date().toISOString(),
      kycStatus: agent.kycStatus || 'Not Submitted',
    };

    setPayoutRequests((prev) => [newPayout, ...prev]);

    // Deduct from agent available balance
    setWingaAgents((prev) =>
      prev.map((a) =>
        a.id === agentId
          ? { ...a, availableBalance: a.availableBalance - amount }
          : a
      )
    );

    return {
      success: true,
      message: `Payout request of ${amount} TZS submitted successfully!`,
    };
  };

  const markPayoutPaid = (payoutId: string) => {
    const targetPayout = payoutRequests.find((p) => p.id === payoutId);
    if (!targetPayout || targetPayout.status === 'Paid') return;

    const b2cRef = `MPB2C${Math.floor(10000000 + Math.random() * 90000000)}`;

    setPayoutRequests((prev) =>
      prev.map((p) =>
        p.id === payoutId
          ? {
              ...p,
              status: 'Paid',
              paidAt: new Date().toISOString(),
              b2cReferenceId: b2cRef,
            }
          : p
      )
    );

    // Update agent's paidOut metric
    setWingaAgents((prev) =>
      prev.map((a) =>
        a.id === targetPayout.agentId
          ? { ...a, paidOut: a.paidOut + targetPayout.amount }
          : a
      )
    );
  };

  const submitTradeInRequest = (req: TradeInRequest) => {
    setTradeInRequests((prev) => [req, ...prev]);
  };

  const updateTradeInStatus = (
    id: string,
    status: TradeInStatus,
    notes?: string,
    offeredPrice?: number
  ) => {
    setTradeInRequests((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              adminNotes: notes !== undefined ? notes : t.adminNotes,
              offeredPrice: offeredPrice !== undefined ? offeredPrice : t.offeredPrice,
            }
          : t
      )
    );
  };

  const updateStoreSettings = (newSettings: Partial<StoreSettings>) => {
    setStoreSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleSelectCampus = (campus: UniversityLocation) => {
    if (!campus) return;
    setSelectedCampus(campus);
    try {
      localStorage.setItem('unisoko_campus_id', campus.id);
    } catch (e) {
      console.error(e);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const cartSubtotal = cart.reduce((sum, item) => {
    const isWholesale = item.quantity >= (item.product.minWholesaleQty || 3);
    const unitPrice = isWholesale ? item.product.priceWholesale : item.product.priceRetail;
    return sum + unitPrice * item.quantity;
  }, 0);

  const cartTotalSavings = cart.reduce((sum, item) => {
    const isWholesale = item.quantity >= (item.product.minWholesaleQty || 3);
    if (isWholesale) {
      const standardTotal = item.product.priceRetail * item.quantity;
      const wholesaleTotal = item.product.priceWholesale * item.quantity;
      return sum + (standardTotal - wholesaleTotal);
    }
    return sum;
  }, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        selectedCampus,
        setSelectedCampus: handleSelectCampus,
        cartCount,
        cartSubtotal,
        cartTotalSavings,
        allUniversities: ALL_UNIVERSITIES,
        orders,
        addOrder,
        updateOrderStatus,
        approveOrder,
        updateOrderReceipt,
        products,
        addProduct,
        updateProduct,
        wingaAgents,
        payoutRequests,
        requestPayout,
        markPayoutPaid,
        currentAgent,
        setCurrentAgent,
        registerWingaAgent,
        uploadKycStudentId,
        verifyKycStudentId,
        tradeInRequests,
        submitTradeInRequest,
        updateTradeInStatus,
        storeSettings,
        updateStoreSettings,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
