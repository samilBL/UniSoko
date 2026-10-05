'use client';

import React, { useState, useMemo } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import { useStore } from '@/context/StoreContext';
import { formatTZS } from '@/lib/mockData';
import {
  Product,
  ProductCategory,
  ProductCondition,
  StockStatus,
  Order,
  WingaApplication,
  TradeInRequest,
  TradeInStatus,
  StoreSettings,
  DeveloperProfileSettings,
} from '@/lib/types';
import {
  Package,
  ShoppingBag,
  Wallet,
  CheckCircle2,
  Truck,
  Plus,
  Edit2,
  Search,
  Check,
  X,
  ShieldCheck,
  CreditCard,
  Phone,
  MapPin,
  Settings,
  Repeat,
  MessageCircle,
  Save,
  Building,
  Eye,
  BedDouble,
  Megaphone,
  LifeBuoy,
  Activity,
  BarChart3,
  Wrench,
  School,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { getLegacyOrderStatus, getNextOrderAction } from '@/lib/orderTracking';

type AdminHostelListing = { id: string; campusId: string; campusName: string; title: string; address: string; description: string; pricePerTerm: number; distanceKm: number; amenities: string[]; photos: string[]; status: 'Draft' | 'Published' | 'Archived'; verified: boolean };
type AdminRoomBounty = { id: string; studentName: string; phone: string; university: string; location: string; landlordName: string; landlordPhone: string; details: string; bountyAmount: number; status: 'Pending' | 'Verifying' | 'Leased' | 'Rejected'; payoutStatus: 'Not Due' | 'Due' | 'Paid'; submittedAt: string; adminNotes: string };
type AdminBanner = { id: string; kind: 'Promotion' | 'Sponsor' | 'Flash Deal'; title: string; body: string; ctaLabel: string; ctaUrl: string; imagePath: string; imageUrl: string; status: 'Draft' | 'Active' | 'Paused'; startsAt: string; endsAt: string };
type AdminCancellation = { id: string; orderId: string; reason: string; details: string; status: 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed'; refundAmount: number; refundReference: string; adminNotes: string; requestedAt: string; buyerName: string; buyerPhone: string; paymentStatus: string; orderTotal: number; deliveryStatus: string };
type AdminAuditEvent = { id: number; actor: string; action: string; resourceType: string; resourceId: string; metadata: Record<string, string | number | boolean | null>; createdAt: string };
type AdminSupportTicket = { id: string; order_id?: string; buyer_name: string; buyer_phone: string; subject: string; message: string; status: 'Open' | 'In Progress' | 'Waiting for Customer' | 'Resolved' | 'Closed'; admin_notes: string; created_at: string; updated_at?: string };
type AdminWarrantyClaim = { id: string; order_id: string; buyer_name: string; buyer_phone: string; claim_type: string; description: string; status: 'Submitted' | 'Under Review' | 'Return Received' | 'Inspecting' | 'Resolved' | 'Rejected'; resolution?: 'Replacement' | 'Repair' | 'Refund' | 'Rejected'; admin_notes: string; submitted_at: string; reviewed_at?: string; resolved_at?: string };
type AdminOperationalIssue = { id: string; category: string; title: string; description: string; related_id?: string; status: 'Open' | 'Investigating' | 'Waiting' | 'Resolved' | 'Closed'; assigned_to?: string; internal_notes: string; created_at: string };
type AdminUniversityRow = { id: string; name: string; short_name: string; city: string; is_active: boolean; delivery_fee: number; estimated_delivery_time: string; hostels: string[]; landmarks: string[] };

export default function AdminPanelPage() {
  const router = useRouter();
  const {
    orders,
    approveOrder,
    updateOrderStatus,
    updateOrderReceipt,
    products,
    addProduct,
    updateProduct,
    payoutRequests,
    markPayoutPaid,
    wingaAgents,
    verifyKycStudentId,
    tradeInRequests,
    updateTradeInStatus,
    storeSettings,
    updateStoreSettings,
    allUniversities,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'trade-ins' | 'payouts' | 'winga-applications' | 'hostels' | 'room-bounties' | 'banners' | 'cancellations' | 'support' | 'warranty' | 'issues' | 'universities' | 'health' | 'audit-logs' | 'settings'>('orders');

  // Support, Warranty, Issues, and Universities states
  const [supportTickets, setSupportTickets] = useState<AdminSupportTicket[]>([]);
  const [warrantyClaims, setWarrantyClaims] = useState<AdminWarrantyClaim[]>([]);
  const [operationalIssues, setOperationalIssues] = useState<AdminOperationalIssue[]>([]);
  const [dbUniversities, setDbUniversities] = useState<AdminUniversityRow[]>([]);
  const [newIssueForm, setNewIssueForm] = useState({ category: 'Payment', title: '', description: '', relatedId: '', assignedTo: '' });
  const [newUnivForm, setNewUnivForm] = useState({ name: '', shortName: '', city: '', deliveryFee: 0, estimatedDeliveryTime: 'Same-day delivery (under 2 hrs)', hostels: '', landmarks: '' });
  const [issueMessage, setIssueMessage] = useState('');
  const [univMessage, setUnivMessage] = useState('');

  // Orders Tab Filter & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('All');

  // Inventory Tab Edit/Add Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [prodFormTitle, setProdFormTitle] = useState('');
  const [prodFormCategory, setProdFormCategory] = useState<ProductCategory>('Laptops');
  const [prodFormRetail, setProdFormRetail] = useState<number>(650000);
  const [prodFormWholesale, setProdFormWholesale] = useState<number>(580000);
  const [prodFormCondition, setProdFormCondition] = useState<ProductCondition>('Grade A Like-New');
  const [prodFormStockStatus, setProdFormStockStatus] = useState<StockStatus>('In Stock');
  const [prodFormDesc, setProdFormDesc] = useState('');
  const [prodFormImage, setProdFormImage] = useState('https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80');

  // Trade-In state
  const [tradeInSearch, setTradeInSearch] = useState('');
  const [tradeInFilter, setTradeInFilter] = useState<string>('All');
  const [activeTradeInModal, setActiveTradeInModal] = useState<TradeInRequest | null>(null);
  const [offerPriceInput, setOfferPriceInput] = useState<number>(0);
  const [adminNotesInput, setAdminNotesInput] = useState<string>('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(storeSettings);
  const [settingsSavedToast, setSettingsSavedToast] = useState(false);
  const [settingsSaveWarning, setSettingsSaveWarning] = useState('');
  const [developerImageFile, setDeveloperImageFile] = useState<File | null>(null);
  const [developerImagePreview, setDeveloperImagePreview] = useState('');
  const [removeDeveloperImage, setRemoveDeveloperImage] = useState(false);
  const [developerProfileError, setDeveloperProfileError] = useState('');
  const [developerProfileMessage, setDeveloperProfileMessage] = useState('');
  const [cancellationRequests, setCancellationRequests] = useState<AdminCancellation[]>([]);
  const [cancellationForms, setCancellationForms] = useState<Record<string, { status: AdminCancellation['status']; refundAmount: number; refundReference: string; adminNotes: string }>>({});
  const [cancellationError, setCancellationError] = useState('');
  const [auditEvents, setAuditEvents] = useState<AdminAuditEvent[]>([]);
  const [campusVotes, setCampusVotes] = useState<Record<string, number>>({});
  const [remoteTradeIns, setRemoteTradeIns] = useState<TradeInRequest[]>([]);
  const [remoteOrders, setRemoteOrders] = useState<Order[]>([]);
  const [wingaApplications, setWingaApplications] = useState<WingaApplication[]>([]);
  const [isReviewingWingaId, setIsReviewingWingaId] = useState<string | null>(null);
  const [wingaApplicationError, setWingaApplicationError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [orderUpdateError, setOrderUpdateError] = useState('');
  const [hostelListings, setHostelListings] = useState<AdminHostelListing[]>([]);
  const [roomBountySubmissions, setRoomBountySubmissions] = useState<AdminRoomBounty[]>([]);
  const [hostelPhotos, setHostelPhotos] = useState<File[]>([]);
  const [hostelError, setHostelError] = useState('');
  const [hostelMessage, setHostelMessage] = useState('');
  const [hostelForm, setHostelForm] = useState({ campusId: '', title: '', address: '', description: '', pricePerTerm: '', distanceKm: '', amenities: '', verified: false });
  const [bountyForms, setBountyForms] = useState<Record<string, { status: AdminRoomBounty['status']; amount: number; notes: string }>>({});
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [editingBannerId, setEditingBannerId] = useState('');
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerError, setBannerError] = useState('');
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerForm, setBannerForm] = useState({ kind: 'Promotion' as AdminBanner['kind'], title: '', body: '', ctaLabel: '', ctaUrl: '', status: 'Draft' as AdminBanner['status'], startsAt: '', endsAt: '' });

  // Sync settings form when storeSettings updates
  React.useEffect(() => {
    const syncTimer = window.setTimeout(() => setSettingsForm(storeSettings), 0);
    return () => window.clearTimeout(syncTimer);
  }, [storeSettings]);

  React.useEffect(() => () => {
    if (developerImagePreview.startsWith('blob:')) URL.revokeObjectURL(developerImagePreview);
  }, [developerImagePreview]);

  React.useEffect(() => {
    const syncTimer = window.setTimeout(() => {
      try {
        setCampusVotes(JSON.parse(localStorage.getItem('unisoko_campus_votes') || '{}') as Record<string, number>);
      } catch {
        setCampusVotes({});
      }
    }, 0);
    return () => window.clearTimeout(syncTimer);
  }, []);

  React.useEffect(() => {
    fetch('/api/admin/campus-votes', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ votes?: Record<string, number> }> : null)
      .then((result) => { if (result?.votes) setCampusVotes(result.votes); })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    fetch('/api/admin/trade-ins', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ requests?: TradeInRequest[] }> : null)
      .then((result) => { if (result?.requests) setRemoteTradeIns(result.requests); })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    fetch('/api/admin/orders', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ orders?: Order[]; configured?: boolean }> : null)
      .then((result) => { if (result?.configured && result.orders) setRemoteOrders(result.orders); })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    fetch('/api/admin/winga-applications', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ applications?: WingaApplication[] }> : null)
      .then((result) => { if (result?.applications) setWingaApplications(result.applications); })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    fetch('/api/admin/hostels', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ listings?: AdminHostelListing[] }> : null)
      .then((result) => { if (result?.listings) setHostelListings(result.listings); })
      .catch(() => undefined);
    fetch('/api/admin/room-bounties', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ submissions?: AdminRoomBounty[] }> : null)
      .then((result) => {
        if (result?.submissions) {
          setRoomBountySubmissions(result.submissions);
          setBountyForms(Object.fromEntries(result.submissions.map((item) => [item.id, { status: item.status, amount: item.bountyAmount, notes: item.adminNotes || '' }])));
        }
      })
      .catch(() => undefined);
    fetch('/api/admin/banners', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ banners?: AdminBanner[] }> : null)
      .then((result) => { if (result?.banners) setBanners(result.banners); })
      .catch(() => undefined);
    fetch('/api/admin/cancellations', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ requests?: AdminCancellation[] }> : null)
      .then((result) => {
        if (result?.requests) {
          setCancellationRequests(result.requests);
          setCancellationForms(Object.fromEntries(result.requests.map((item) => [item.id, { status: item.status, refundAmount: item.refundAmount, refundReference: item.refundReference, adminNotes: item.adminNotes }])));
        }
      })
      .catch(() => undefined);
    fetch('/api/admin/audit-logs', { cache: 'no-store' })
      .then(async (response) => response.ok ? response.json() as Promise<{ events?: AdminAuditEvent[] }> : null)
      .then((result) => { if (result?.events) setAuditEvents(result.events); })
      .catch(() => undefined);
    fetch('/api/admin/support-tickets', { cache: 'no-store' })
      .then(async (res) => res.ok ? res.json() as Promise<{ tickets?: AdminSupportTicket[] }> : null)
      .then((data) => { if (data?.tickets) setSupportTickets(data.tickets); })
      .catch(() => undefined);
    fetch('/api/admin/warranty-claims', { cache: 'no-store' })
      .then(async (res) => res.ok ? res.json() as Promise<{ claims?: AdminWarrantyClaim[] }> : null)
      .then((data) => { if (data?.claims) setWarrantyClaims(data.claims); })
      .catch(() => undefined);
    fetch('/api/admin/operational-issues', { cache: 'no-store' })
      .then(async (res) => res.ok ? res.json() as Promise<{ issues?: AdminOperationalIssue[] }> : null)
      .then((data) => { if (data?.issues) setOperationalIssues(data.issues); })
      .catch(() => undefined);
    fetch('/api/admin/universities', { cache: 'no-store' })
      .then(async (res) => res.ok ? res.json() as Promise<{ universities?: AdminUniversityRow[] }> : null)
      .then((data) => { if (data?.universities) setDbUniversities(data.universities); })
      .catch(() => undefined);
  }, []);

  const updateSupportTicket = async (id: string, status: string, adminNotes: string) => {
    const res = await fetch('/api/admin/support-tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, adminNotes }),
    });
    if (!res.ok) { window.alert('Could not update support ticket.'); return; }
    const result = await res.json();
    if (result.ticket) {
      setSupportTickets((prev) => prev.map((t) => t.id === id ? result.ticket : t));
    }
  };

  const updateWarrantyClaim = async (id: string, status: string, resolution: string, adminNotes: string) => {
    const res = await fetch('/api/admin/warranty-claims', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, resolution, adminNotes }),
    });
    if (!res.ok) { window.alert('Could not update warranty claim.'); return; }
    const result = await res.json();
    if (result.claim) {
      setWarrantyClaims((prev) => prev.map((c) => c.id === id ? result.claim : c));
    }
  };

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueMessage('');
    const res = await fetch('/api/admin/operational-issues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newIssueForm),
    });
    if (!res.ok) { window.alert('Could not create operational issue.'); return; }
    const result = await res.json();
    if (result.issue) {
      setOperationalIssues((prev) => [result.issue, ...prev]);
      setNewIssueForm({ category: 'Payment', title: '', description: '', relatedId: '', assignedTo: '' });
      setIssueMessage('Issue logged successfully.');
    }
  };

  const updateIssueStatus = async (id: string, status: string, internalNotes?: string) => {
    const res = await fetch('/api/admin/operational-issues', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, internalNotes }),
    });
    if (!res.ok) { window.alert('Could not update issue.'); return; }
    const result = await res.json();
    if (result.issue) {
      setOperationalIssues((prev) => prev.map((i) => i.id === id ? result.issue : i));
    }
  };

  const handleCreateUniversity = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnivMessage('');
    const payload = {
      name: newUnivForm.name,
      shortName: newUnivForm.shortName,
      city: newUnivForm.city,
      deliveryFee: Number(newUnivForm.deliveryFee),
      estimatedDeliveryTime: newUnivForm.estimatedDeliveryTime,
      hostels: newUnivForm.hostels.split(',').map((s) => s.trim()).filter(Boolean),
      landmarks: newUnivForm.landmarks.split(',').map((s) => s.trim()).filter(Boolean),
    };
    const res = await fetch('/api/admin/universities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) { window.alert('Could not onboard university.'); return; }
    const result = await res.json();
    if (result.university) {
      setDbUniversities((prev) => [...prev.filter((u) => u.id !== result.university.id), result.university]);
      setNewUnivForm({ name: '', shortName: '', city: '', deliveryFee: 0, estimatedDeliveryTime: 'Same-day delivery (under 2 hrs)', hostels: '', landmarks: '' });
      setUnivMessage('University saved & activated.');
    }
  };

  const toggleUniversityActive = async (id: string, currentActive: boolean) => {
    const res = await fetch('/api/admin/universities', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !currentActive }),
    });
    if (!res.ok) { window.alert('Could not toggle university status.'); return; }
    const result = await res.json();
    if (result.university) {
      setDbUniversities((prev) => prev.map((u) => u.id === id ? result.university : u));
    }
  };

  const reviewWingaApplication = async (application: WingaApplication, status: 'Approved' | 'Rejected') => {
    setIsReviewingWingaId(application.id);
    setWingaApplicationError('');
    try {
      const response = await fetch('/api/admin/winga-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id, status }),
      });
      const result = await response.json() as { application?: WingaApplication; error?: string };
      if (!response.ok || !result.application) throw new Error(result.error || 'Could not review this application.');
      setWingaApplications((previous) => previous.map((item) => item.id === application.id ? result.application! : item));
    } catch (reviewError) {
      setWingaApplicationError(reviewError instanceof Error ? reviewError.message : 'Could not review this application.');
    } finally {
      setIsReviewingWingaId(null);
    }
  };

  const setWingaIdVerification = async (application: WingaApplication) => {
    setIsReviewingWingaId(application.id);
    setWingaApplicationError('');
    try {
      const response = await fetch('/api/admin/winga-applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: application.id, studentIdVerified: !application.studentIdVerified }),
      });
      const result = await response.json() as { application?: WingaApplication; error?: string };
      if (!response.ok || !result.application) throw new Error(result.error || 'Could not update student ID verification.');
      setWingaApplications((previous) => previous.map((item) => item.id === application.id ? result.application! : item));
    } catch (error) {
      setWingaApplicationError(error instanceof Error ? error.message : 'Could not update student ID verification.');
    } finally {
      setIsReviewingWingaId(null);
    }
  };

  const allOrders = useMemo(() => [...remoteOrders, ...orders.filter((order) => !remoteOrders.some((remote) => remote.id === order.id))], [remoteOrders, orders]);

  const allTradeInRequests = useMemo(() => [...remoteTradeIns, ...tradeInRequests.filter((request) => !remoteTradeIns.some((remote) => remote.id === request.id))], [remoteTradeIns, tradeInRequests]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      if (orderStatusFilter !== 'All' && ord.status !== orderStatusFilter) return false;
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchesBuyer = ord.buyerName.toLowerCase().includes(q);
        const matchesTx = ord.lipaNambaTxId.toLowerCase().includes(q);
        const matchesUni = ord.university.toLowerCase().includes(q);
        const matchesId = ord.id.toLowerCase().includes(q);
        if (!matchesBuyer && !matchesTx && !matchesUni && !matchesId) return false;
      }
      return true;
    });
  }, [allOrders, orderStatusFilter, orderSearch]);

  const handlePersistedOrderTransition = async (order: Order) => {
    const next = getNextOrderAction(order);
    if (!next) return;
    setUpdatingOrderId(order.id);
    setOrderUpdateError('');
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, statusType: next.type, status: next.status }),
      });
      const result = await response.json() as { order?: Order; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || 'Could not update this order.');
      setRemoteOrders((previous) => previous.map((existing) => existing.id === order.id ? result.order! : existing));
    } catch (error) {
      setOrderUpdateError(error instanceof Error ? error.message : 'Could not update this order.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Filtered Trade-Ins
  const filteredTradeIns = useMemo(() => {
    return allTradeInRequests.filter((req) => {
      if (tradeInFilter !== 'All' && req.status !== tradeInFilter) return false;
      if (tradeInSearch.trim()) {
        const q = tradeInSearch.toLowerCase();
        const matchesName = req.studentName.toLowerCase().includes(q);
        const matchesItem = req.itemTitle.toLowerCase().includes(q);
        const matchesPhone = req.phone.toLowerCase().includes(q);
        const matchesUni = req.university.toLowerCase().includes(q);
        if (!matchesName && !matchesItem && !matchesPhone && !matchesUni) return false;
      }
      return true;
    });
  }, [allTradeInRequests, tradeInFilter, tradeInSearch]);

  // Handle Edit Product Setup
  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdFormTitle(prod.title);
    setProdFormCategory(prod.category);
    setProdFormRetail(prod.priceRetail);
    setProdFormWholesale(prod.priceWholesale);
    setProdFormCondition(prod.condition);
    setProdFormStockStatus(prod.stockStatus);
    setProdFormDesc(prod.description);
    setProdFormImage(prod.images[0] || '');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        title: prodFormTitle,
        category: prodFormCategory,
        priceRetail: Number(prodFormRetail),
        priceWholesale: Number(prodFormWholesale),
        condition: prodFormCondition,
        stockStatus: prodFormStockStatus,
        description: prodFormDesc,
        images: [prodFormImage || editingProduct.images[0]],
      };
      updateProduct(updated);
      setEditingProduct(null);
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        title: prodFormTitle,
        category: prodFormCategory,
        priceRetail: Number(prodFormRetail),
        priceWholesale: Number(prodFormWholesale),
        condition: prodFormCondition,
        stockStatus: prodFormStockStatus,
        description: prodFormDesc,
        minWholesaleQty: 3,
        images: [prodFormImage || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80'],
      };
      addProduct(newProd);
      setIsAddProductOpen(false);
    }
  };

  const handleOpenTradeInDetail = (req: TradeInRequest) => {
    setActiveTradeInModal(req);
    setOfferPriceInput(req.offeredPrice || req.expectedPrice);
    setAdminNotesInput(req.adminNotes || '');
  };

  const handleUpdateTradeIn = (newStatus: TradeInStatus) => {
    if (!activeTradeInModal) return;
    if (remoteTradeIns.some((request) => request.id === activeTradeInModal.id)) {
      void fetch('/api/admin/trade-ins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeTradeInModal.id, status: newStatus, adminNotes: adminNotesInput, offeredPrice: offerPriceInput }),
      }).then((response) => {
        if (!response.ok) throw new Error('Unable to save trade-in decision.');
        setRemoteTradeIns((requests) => requests.map((request) => request.id === activeTradeInModal.id ? { ...request, status: newStatus, adminNotes: adminNotesInput, offeredPrice: offerPriceInput } : request));
      }).catch(() => window.alert('Could not save this decision to the trade-in database.'));
    }
    updateTradeInStatus(
      activeTradeInModal.id,
      newStatus,
      adminNotesInput,
      offerPriceInput
    );
    setActiveTradeInModal(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const primaryMethod = settingsForm.paymentMethods?.find((method) => method.enabled && method.tillNumber.trim());
    const updatedSettings = {
      ...settingsForm,
      tillNumber: primaryMethod?.tillNumber || settingsForm.tillNumber,
      accountName: primaryMethod?.accountName || settingsForm.accountName,
      supportWhatsApp: (settingsForm.officialWhatsAppNumbers?.[0] || settingsForm.supportWhatsApp).trim(),
    };
    updateStoreSettings(updatedSettings);
    setSettingsSaveWarning('');
    try {
      const response = await fetch('/api/admin/store-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings),
      });
      if (response.status === 503) setSettingsSaveWarning('Saved in this browser only: configure Supabase for durable shared settings.');
      else if (!response.ok) setSettingsSaveWarning('Changes are active in this browser, but cloud save failed. Please retry.');
    } catch {
      setSettingsSaveWarning('Changes are active in this browser, but cloud save was unavailable. Please retry.');
    }
    setSettingsSavedToast(true);
    setTimeout(() => setSettingsSavedToast(false), 3500);
  };

  const handleSaveDeveloperProfile = async () => {
    setDeveloperProfileError('');
    setDeveloperProfileMessage('');
    const formData = new FormData();
    formData.append('profile', JSON.stringify(settingsForm.developerProfile));
    formData.append('removeImage', String(removeDeveloperImage));
    if (developerImageFile) formData.append('image', developerImageFile);
    try {
      const response = await fetch('/api/admin/developer-profile', { method: 'POST', body: formData });
      const result = await response.json() as { profile?: DeveloperProfileSettings; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error || 'Could not save developer profile.');
      setSettingsForm((previous) => ({ ...previous, developerProfile: result.profile! }));
      updateStoreSettings({ developerProfile: result.profile });
      setDeveloperImageFile(null);
      setRemoveDeveloperImage(false);
      setDeveloperProfileMessage('Developer profile saved.');
    } catch (error) {
      setDeveloperProfileError(error instanceof Error ? error.message : 'Could not save developer profile.');
    }
  };

  const handleCreateHostel = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHostelError('');
    setHostelMessage('');
    if (hostelPhotos.length < 1 || hostelPhotos.length > 6 || hostelPhotos.some((photo) => !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type) || photo.size > 5_000_000)) {
      setHostelError('Choose 1 to 6 JPG, PNG, or WebP photos under 5 MB each.');
      return;
    }
    const formData = new FormData();
    formData.append('listing', JSON.stringify({
      ...hostelForm,
      pricePerTerm: Number(hostelForm.pricePerTerm),
      distanceKm: Number(hostelForm.distanceKm),
      amenities: hostelForm.amenities.split(',').map((item) => item.trim()).filter(Boolean),
      status: 'Draft',
      verified: hostelForm.verified,
    }));
    hostelPhotos.forEach((photo) => formData.append('photos', photo));
    try {
      const response = await fetch('/api/admin/hostels', { method: 'POST', body: formData });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not create listing.');
      const refreshed = await fetch('/api/admin/hostels', { cache: 'no-store' });
      const refreshedResult = await refreshed.json() as { listings?: AdminHostelListing[] };
      if (refreshed.ok && refreshedResult.listings) setHostelListings(refreshedResult.listings);
      setHostelForm({ campusId: '', title: '', address: '', description: '', pricePerTerm: '', distanceKm: '', amenities: '', verified: false });
      setHostelPhotos([]);
      setHostelMessage('Draft listing saved with photos. Publish it after reviewing its details.');
    } catch (error) {
      setHostelError(error instanceof Error ? error.message : 'Could not create listing.');
    }
  };

  const updateHostelListing = async (listing: AdminHostelListing, status: AdminHostelListing['status'], verified: boolean) => {
    const response = await fetch('/api/admin/hostels', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: listing.id, status, verified }) });
    if (!response.ok) { window.alert('Could not update the hostel listing.'); return; }
    setHostelListings((previous) => previous.map((item) => item.id === listing.id ? { ...item, status, verified } : item));
  };

  const deleteHostelListing = async (listing: AdminHostelListing) => {
    if (!window.confirm(`Delete ${listing.title} and its photos?`)) return;
    const response = await fetch(`/api/admin/hostels?id=${encodeURIComponent(listing.id)}`, { method: 'DELETE' });
    if (!response.ok) { window.alert('Could not delete the hostel listing.'); return; }
    setHostelListings((previous) => previous.filter((item) => item.id !== listing.id));
  };

  const saveRoomBounty = async (submission: AdminRoomBounty, payoutStatus?: 'Paid') => {
    const form = bountyForms[submission.id] || { status: submission.status, amount: submission.bountyAmount, notes: submission.adminNotes || '' };
    const response = await fetch('/api/admin/room-bounties', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: submission.id, status: form.status, bountyAmount: form.amount, adminNotes: form.notes, payoutStatus }),
    });
    const result = await response.json() as { error?: string; payoutStatus?: AdminRoomBounty['payoutStatus'] };
    if (!response.ok) { window.alert(result.error || 'Could not update this room lead.'); return; }
    setRoomBountySubmissions((previous) => previous.map((item) => item.id === submission.id ? { ...item, status: form.status, bountyAmount: form.amount, payoutStatus: result.payoutStatus || item.payoutStatus, adminNotes: form.notes } : item));
  };

  const handleSaveBanner = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBannerError('');
    setBannerMessage('');
    const formData = new FormData();
    formData.append('banner', JSON.stringify({
      ...bannerForm,
      id: editingBannerId || undefined,
      startsAt: new Date(bannerForm.startsAt).toISOString(),
      endsAt: new Date(bannerForm.endsAt).toISOString(),
    }));
    if (bannerImage) formData.append('image', bannerImage);
    try {
      const response = await fetch('/api/admin/banners', { method: 'POST', body: formData });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not save banner.');
      const refreshed = await fetch('/api/admin/banners', { cache: 'no-store' });
      const refreshedResult = await refreshed.json() as { banners?: AdminBanner[] };
      if (refreshed.ok && refreshedResult.banners) setBanners(refreshedResult.banners);
      setEditingBannerId('');
      setBannerImage(null);
      setBannerForm({ kind: 'Promotion', title: '', body: '', ctaLabel: '', ctaUrl: '', status: 'Draft', startsAt: '', endsAt: '' });
      setBannerMessage('Banner saved. It appears on the homepage only when active and within its schedule.');
    } catch (error) {
      setBannerError(error instanceof Error ? error.message : 'Could not save banner.');
    }
  };

  const editBanner = (banner: AdminBanner) => {
    const toLocalInput = (value: string) => new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
    setEditingBannerId(banner.id);
    setBannerImage(null);
    setBannerForm({ kind: banner.kind, title: banner.title, body: banner.body, ctaLabel: banner.ctaLabel, ctaUrl: banner.ctaUrl, status: banner.status, startsAt: toLocalInput(banner.startsAt), endsAt: toLocalInput(banner.endsAt) });
  };

  const updateBannerStatus = async (banner: AdminBanner, status: AdminBanner['status']) => {
    const response = await fetch('/api/admin/banners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: banner.id, status }) });
    if (!response.ok) { window.alert('Could not update banner status.'); return; }
    setBanners((previous) => previous.map((item) => item.id === banner.id ? { ...item, status } : item));
  };

  const deleteBanner = async (banner: AdminBanner) => {
    if (!window.confirm(`Delete the ${banner.title} banner?`)) return;
    const response = await fetch(`/api/admin/banners?id=${encodeURIComponent(banner.id)}`, { method: 'DELETE' });
    if (!response.ok) { window.alert('Could not delete banner.'); return; }
    setBanners((previous) => previous.filter((item) => item.id !== banner.id));
  };

  const saveCancellation = async (request: AdminCancellation) => {
    const form = cancellationForms[request.id] || { status: request.status, refundAmount: request.refundAmount, refundReference: request.refundReference, adminNotes: request.adminNotes };
    setCancellationError('');
    try {
      const response = await fetch('/api/admin/cancellations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: request.id, ...form }),
      });
      const result = await response.json() as { request?: Partial<AdminCancellation>; error?: string };
      if (!response.ok || !result.request) throw new Error(result.error || 'Could not update cancellation request.');
      setCancellationRequests((previous) => previous.map((item) => item.id === request.id ? { ...item, ...result.request } as AdminCancellation : item));
    } catch (error) {
      setCancellationError(error instanceof Error ? error.message : 'Could not update cancellation request.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <nav className="flex flex-wrap gap-2" aria-label="Multi-vendor marketplace administration">
          <a href="/admin/marketplace" className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white">Marketplace control center</a>
          <a href="/admin/sellers" className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">Seller accounts</a>
          <a href="/admin/subscriptions" className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">Plans & payments</a>
          <a href="/admin/product-moderation" className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">Product approvals</a>
        </nav>
        {/* Admin Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                Staff Control
              </span>
              <span className="text-xs text-slate-400">UniSoko Central Admin</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white font-heading">
              Campus Operations & Store Management
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Verify Lipa Namba payments, inspect trade-ins, disburse Winga commissions, and configure live store settings.
            </p>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Orders</span>
              <span className="text-base font-black text-amber-400">
                {orders.filter((o) => o.status === 'Pending Verification').length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Trade-In Queue</span>
              <span className="text-base font-black text-indigo-400">
                {allTradeInRequests.filter((t) => t.status === 'Pending Review' || t.status === 'Inspecting').length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2.5 backdrop-blur-md border border-white/10">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Payouts</span>
              <span className="text-base font-black text-emerald-400">
                {payoutRequests.filter((p) => p.status === 'Pending').length}
              </span>
            </div>
            <button onClick={() => { void fetch('/api/admin/logout', { method: 'POST' }).finally(() => router.replace('/admin/login')); }} className="rounded-xl border border-white/20 px-3 py-2.5 font-bold text-white transition hover:bg-white/10">Sign out</button>
            <button onClick={() => router.push('/admin/sellers')} className="rounded-xl bg-emerald-500 px-3 py-2.5 font-bold text-slate-950 transition hover:bg-emerald-400">Seller applications</button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'orders'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Orders & Verification ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trade-ins')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'trade-ins'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Repeat className="h-4 w-4" />
            <span>Trade-In Requests ({allTradeInRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Catalog & Pricing ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'payouts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="h-4 w-4" />
            <span>Winga KYC & Payouts ({payoutRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('winga-applications')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'winga-applications'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Winga Applications ({wingaApplications.filter((application) => application.status === 'Pending').length} pending)</span>
          </button>

          <button onClick={() => setActiveTab('health')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'health' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}`}><BarChart3 className="h-4 w-4" /><span>Business Health & KPIs</span></button>
          <button onClick={() => setActiveTab('support')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'support' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}`}><LifeBuoy className="h-4 w-4" /><span>Support Tickets ({supportTickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length})</span></button>
          <button onClick={() => setActiveTab('warranty')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'warranty' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}`}><ShieldCheck className="h-4 w-4" /><span>Warranty & Returns ({warrantyClaims.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length})</span></button>
          <button onClick={() => setActiveTab('issues')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'issues' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}`}><Wrench className="h-4 w-4" /><span>Operational Issues ({operationalIssues.filter(i => i.status === 'Open' || i.status === 'Investigating').length})</span></button>
          <button onClick={() => setActiveTab('universities')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'universities' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100'}`}><School className="h-4 w-4" /><span>Universities & Delivery</span></button>
          <button onClick={() => setActiveTab('hostels')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'hostels' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><BedDouble className="h-4 w-4" /><span>Hostel Listings</span></button>
          <button onClick={() => setActiveTab('room-bounties')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'room-bounties' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><MapPin className="h-4 w-4" /><span>Room Finder Fees ({roomBountySubmissions.filter((submission) => submission.payoutStatus === 'Due').length} due)</span></button>
          <button onClick={() => setActiveTab('banners')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'banners' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><Megaphone className="h-4 w-4" /><span>Promo Banners</span></button>
          <button onClick={() => setActiveTab('cancellations')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'cancellations' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><span>Cancellation Requests ({cancellationRequests.filter((item) => ['Pending', 'Under Review', 'Approved'].includes(item.status)).length})</span></button>
          <button onClick={() => setActiveTab('audit-logs')} className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${activeTab === 'audit-logs' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}><span>Audit Log</span></button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Store Settings</span>
          </button>
        </div>

        {activeTab === 'health' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">Business Health & Unit Economics</h3>
              <p className="mt-1 text-xs text-slate-500">Live operational snapshot of gross merchandise value, campus volume, Winga network velocity, and fulfillment health.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-slate-500">Gross Volume (GMV)</span>
                <p className="text-xl font-black text-slate-900 mt-1">{formatTZS(orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0))}</p>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Verified: {formatTZS(orders.filter(o => o.paymentStatus === 'Verified').reduce((sum, o) => sum + (o.totalAmount || 0), 0))}</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-slate-500">Total Orders</span>
                <p className="text-xl font-black text-slate-900 mt-1">{orders.length}</p>
                <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">{orders.filter(o => o.deliveryStatus === 'Delivered').length} Delivered to Hostel/Campus</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-slate-500">Winga-Driven Orders</span>
                <p className="text-xl font-black text-slate-900 mt-1">{orders.filter(o => Boolean(o.wingaCodeUsed)).length}</p>
                <span className="text-[10px] text-purple-600 font-semibold mt-1 block">{wingaAgents.length} registered campus ambassadors</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-slate-500">Active Operational Issues</span>
                <p className="text-xl font-black text-amber-600 mt-1">{operationalIssues.filter(i => i.status === 'Open' || i.status === 'Investigating').length}</p>
                <span className="text-[10px] text-slate-500 font-semibold mt-1 block">{supportTickets.filter(t => t.status === 'Open').length} open customer tickets</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <School className="w-4 h-4 text-indigo-600" />
                  Campus Launch Readiness Checklist
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">1. Mbeya Core Hub (MUST / TEKU / TIA)</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">Operational</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">2. Winga Recruitment & KYC</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">{wingaAgents.length} Agents Ready</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">3. Lipa Namba (5849201) Verification</span>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">Active</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">4. Regional Courier Hubs (BM Coach / Hood)</span>
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold text-blue-800">Connected</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Quality & Returns Health
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">Warranty Claims Received</span>
                    <span className="font-bold text-slate-900">{warrantyClaims.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">Cancellation Requests</span>
                    <span className="font-bold text-slate-900">{cancellationRequests.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-medium text-slate-800">Trade-Ins Processed</span>
                    <span className="font-bold text-slate-900">{allTradeInRequests.filter(t => t.status === 'Accepted').length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">Customer Support Tickets</h3>
              <p className="mt-1 text-xs text-slate-500">Manage buyer tickets, update resolution status, and add internal notes.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Subject & Message</th>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Admin Notes / Update</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supportTickets.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No support tickets received.</td></tr>
                    ) : supportTickets.map((t) => (
                      <tr key={t.id}>
                        <td className="p-4 font-semibold text-slate-900">
                          {t.buyer_name}
                          <a href={`tel:${t.buyer_phone}`} className="mt-1 block font-mono text-[10px] text-indigo-600 hover:underline">{t.buyer_phone}</a>
                          <span className="block text-[10px] text-slate-400">{new Date(t.created_at).toLocaleDateString('en-TZ')}</span>
                        </td>
                        <td className="p-4 text-slate-700 max-w-xs">
                          <span className="font-bold text-slate-900 block mb-0.5">{t.subject}</span>
                          <p className="text-slate-600 text-xs">{t.message}</p>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600">{t.order_id || '—'}</td>
                        <td className="p-4">
                          <select
                            value={t.status}
                            onChange={(e) => void updateSupportTicket(t.id, e.target.value, t.admin_notes || '')}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
                          >
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Waiting for Customer">Waiting for Customer</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            placeholder="Add notes and press enter..."
                            defaultValue={t.admin_notes || ''}
                            onBlur={(e) => { if (e.target.value !== (t.admin_notes || '')) void updateSupportTicket(t.id, t.status, e.target.value); }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'warranty' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">Warranty Claims & Returns</h3>
              <p className="mt-1 text-xs text-slate-500">Track device returns, inspection results, and execute repairs, replacements, or refunds.</p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-4">Customer & Order</th>
                      <th className="p-4">Claim Type & Fault Details</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Resolution</th>
                      <th className="p-4">Admin Inspection Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {warrantyClaims.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No warranty or return claims recorded.</td></tr>
                    ) : warrantyClaims.map((c) => (
                      <tr key={c.id}>
                        <td className="p-4 font-semibold text-slate-900">
                          {c.buyer_name}
                          <a href={`tel:${c.buyer_phone}`} className="mt-1 block font-mono text-[10px] text-indigo-600 hover:underline">{c.buyer_phone}</a>
                          <span className="mt-1 block font-mono text-xs text-slate-500">Order: {c.order_id}</span>
                        </td>
                        <td className="p-4 text-slate-700 max-w-xs">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">{c.claim_type}</span>
                          <p className="text-slate-600 text-xs mt-1">{c.description}</p>
                        </td>
                        <td className="p-4">
                          <select
                            value={c.status}
                            onChange={(e) => void updateWarrantyClaim(c.id, e.target.value, c.resolution || 'Replacement', c.admin_notes || '')}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Return Received">Return Received</option>
                            <option value="Inspecting">Inspecting</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select
                            value={c.resolution || 'Replacement'}
                            onChange={(e) => void updateWarrantyClaim(c.id, c.status, e.target.value, c.admin_notes || '')}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
                          >
                            <option value="Replacement">Replacement</option>
                            <option value="Repair">Repair</option>
                            <option value="Refund">Refund</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            placeholder="Inspection note..."
                            defaultValue={c.admin_notes || ''}
                            onBlur={(e) => { if (e.target.value !== (c.admin_notes || '')) void updateWarrantyClaim(c.id, c.status, c.resolution || 'Replacement', e.target.value); }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">Operational Issues Center</h3>
                <p className="mt-1 text-xs text-slate-500">Log and resolve logistics, payment mismatches, Winga disputes, and inventory bottlenecks.</p>
              </div>
            </div>

            {issueMessage && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{issueMessage}</p>}

            {/* Create Issue Form */}
            <form onSubmit={handleCreateIssue} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={newIssueForm.category}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-900"
                >
                  <option value="Payment">Payment</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Refund">Refund</option>
                  <option value="Winga dispute">Winga dispute</option>
                  <option value="Inventory">Inventory</option>
                  <option value="Trade-in">Trade-in</option>
                  <option value="Support">Support</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lipa Namba Tx delay on M-Pesa"
                  value={newIssueForm.title}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Related Order / Agent ID</label>
                <input
                  type="text"
                  placeholder="e.g. ORD-17290..."
                  value={newIssueForm.relatedId}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, relatedId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
                >
                  Log Operational Issue
                </button>
              </div>
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Detailed Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe root cause and action needed..."
                  value={newIssueForm.description}
                  onChange={(e) => setNewIssueForm({ ...newIssueForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-4">Category & Title</th>
                      <th className="p-4">Details & Related ID</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Internal Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {operationalIssues.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No operational issues logged. Everything is running smoothly.</td></tr>
                    ) : operationalIssues.map((issue) => (
                      <tr key={issue.id}>
                        <td className="p-4 font-semibold text-slate-900">
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">{issue.category}</span>
                          <p className="mt-1 font-bold text-slate-900">{issue.title}</p>
                          <span className="text-[10px] text-slate-400">{new Date(issue.created_at).toLocaleDateString('en-TZ')}</span>
                        </td>
                        <td className="p-4 text-slate-700 max-w-sm">
                          <p className="text-slate-600 text-xs">{issue.description}</p>
                          {issue.related_id && <span className="mt-1 block font-mono text-[10px] text-indigo-600">Ref: {issue.related_id}</span>}
                        </td>
                        <td className="p-4">
                          <select
                            value={issue.status}
                            onChange={(e) => void updateIssueStatus(issue.id, e.target.value, issue.internal_notes)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800"
                          >
                            <option value="Open">Open</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Waiting">Waiting</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <input
                            type="text"
                            placeholder="Resolution notes..."
                            defaultValue={issue.internal_notes || ''}
                            onBlur={(e) => { if (e.target.value !== (issue.internal_notes || '')) void updateIssueStatus(issue.id, issue.status, e.target.value); }}
                            className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'universities' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">University Onboarding & Delivery Zones</h3>
              <p className="mt-1 text-xs text-slate-500">Configure active university campuses, hostel drop points, and delivery pricing.</p>
            </div>

            {univMessage && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{univMessage}</p>}

            {/* University Onboard Form */}
            <form onSubmit={handleCreateUniversity} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">University Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mzumbe University (Mbeya Campus)"
                  value={newUnivForm.name}
                  onChange={(e) => setNewUnivForm({ ...newUnivForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Short Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MU MBEYA"
                  value={newUnivForm.shortName}
                  onChange={(e) => setNewUnivForm({ ...newUnivForm, shortName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">City / Region</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mbeya"
                  value={newUnivForm.city}
                  onChange={(e) => setNewUnivForm({ ...newUnivForm, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Hostels (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Hostel Block A, Hostel Block B, St. John"
                  value={newUnivForm.hostels}
                  onChange={(e) => setNewUnivForm({ ...newUnivForm, hostels: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Landmarks (Comma separated)</label>
                <input
                  type="text"
                  placeholder="Main Gate, Library Front, Cafeteria"
                  value={newUnivForm.landmarks}
                  onChange={(e) => setNewUnivForm({ ...newUnivForm, landmarks: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
                >
                  Onboard University
                </button>
              </div>
            </form>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="p-4">University</th>
                      <th className="p-4">City</th>
                      <th className="p-4">Delivery SLA</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUniversities.map((u) => {
                      const dbMatch = dbUniversities.find((db) => db.id === u.id);
                      const isActive = dbMatch ? dbMatch.is_active : true;
                      return (
                        <tr key={u.id}>
                          <td className="p-4 font-semibold text-slate-900">
                            {u.name}
                            <span className="mt-0.5 block font-mono text-[10px] text-indigo-600">{u.shortCode}</span>
                          </td>
                          <td className="p-4 text-slate-700">{u.city}</td>
                          <td className="p-4 text-slate-600 text-xs">{u.isMbeya ? 'Same-day (< 2 hrs)' : 'Regional Courier (24-48 hrs)'}</td>
                          <td className="p-4">
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                              {isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              type="button"
                              onClick={() => void toggleUniversityActive(u.id, isActive)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'winga-applications' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">Winga applications</h3>
              <p className="mt-1 text-xs text-slate-500">Approving an application activates the agent profile and assigns a UniSoko promo code. Wingas are agents, not sellers.</p>
            </div>
            {wingaApplicationError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">{wingaApplicationError}</p>}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr><th className="p-4">Applicant</th><th className="p-4">Verified email & contact</th><th className="p-4">University</th><th className="p-4">Status / Promo</th><th className="p-4 text-right">Review</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wingaApplications.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-500">No Winga applications received.</td></tr>
                    ) : wingaApplications.map((application) => (
                      <tr key={application.id}>
                        <td className="p-4 font-semibold text-slate-900">{application.fullName}<span className="mt-1 block text-[10px] text-slate-500">Applied {new Date(application.submittedAt).toLocaleDateString('en-TZ')}</span></td>
                        <td className="p-4 text-slate-700"><span className="block">{application.email}</span><span className="mt-1 block font-mono text-[10px] text-slate-500">Contact: {application.phone}</span></td>
                        <td className="p-4 text-slate-700">{application.university}</td>
                        <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${application.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : application.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900'}`}>{application.status}</span>{application.promoCode && <span className="mt-1 block font-mono font-bold text-indigo-700">{application.promoCode}</span>}{application.status === 'Approved' && <button type="button" disabled={isReviewingWingaId === application.id} onClick={() => void setWingaIdVerification(application)} title="Only mark verified after reviewing the student's ID" className="mt-2 block text-[10px] font-bold text-indigo-700 underline disabled:opacity-50">{application.studentIdVerified ? 'Student ID verified' : 'Mark student ID verified'}</button>}</td>
                        <td className="p-4 text-right">
                          {application.status === 'Pending' ? <div className="flex justify-end gap-2">
                            <button type="button" disabled={isReviewingWingaId === application.id} onClick={() => void reviewWingaApplication(application, 'Approved')} className="rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{isReviewingWingaId === application.id ? 'Saving…' : 'Approve'}</button>
                            <button type="button" disabled={isReviewingWingaId === application.id} onClick={() => void reviewWingaApplication(application, 'Rejected')} className="rounded-lg border border-red-200 px-3 py-2 text-[11px] font-bold text-red-700 hover:bg-red-50 disabled:opacity-60">Reject</button>
                          </div> : <span className="text-[11px] font-semibold text-slate-500">Reviewed</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hostels' && <div className="space-y-6">
          <div><h2 className="text-lg font-bold text-slate-900">Hostel listing manager</h2><p className="mt-1 text-xs text-slate-500">Upload room galleries, review amenities and pricing, verify details, then publish.</p></div>
          {hostelError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-800">{hostelError}</p>}{hostelMessage && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{hostelMessage}</p>}
          <form onSubmit={(event) => void handleCreateHostel(event)} className="grid gap-4 border-y border-slate-200 py-5 md:grid-cols-2">
            <label className="text-xs font-semibold">Campus<select required value={hostelForm.campusId} onChange={(event) => setHostelForm({ ...hostelForm, campusId: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option value="">Select campus</option>{allUniversities.map((campus) => <option key={campus.id} value={campus.id}>{campus.name}</option>)}</select></label>
            <label className="text-xs font-semibold">Listing title<input required maxLength={140} value={hostelForm.title} onChange={(event) => setHostelForm({ ...hostelForm, title: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold md:col-span-2">Location / address<input required maxLength={300} value={hostelForm.address} onChange={(event) => setHostelForm({ ...hostelForm, address: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold">Price per term (TZS)<input type="number" min="1" required value={hostelForm.pricePerTerm} onChange={(event) => setHostelForm({ ...hostelForm, pricePerTerm: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold">Distance from campus (km)<input type="number" min="0" step="0.1" required value={hostelForm.distanceKm} onChange={(event) => setHostelForm({ ...hostelForm, distanceKm: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold md:col-span-2">Description<textarea rows={3} maxLength={1500} value={hostelForm.description} onChange={(event) => setHostelForm({ ...hostelForm, description: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-xs font-semibold md:col-span-2">Amenities (comma-separated)<input value={hostelForm.amenities} onChange={(event) => setHostelForm({ ...hostelForm, amenities: event.target.value })} placeholder="Water, electricity, security, Wi-Fi" className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold md:col-span-2">Room photos<input required type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setHostelPhotos(Array.from(event.target.files || []))} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 p-2" /><span className="mt-1 block text-[10px] text-slate-500">1 to 6 JPG, PNG, or WebP images, maximum 5 MB each.</span></label>
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={hostelForm.verified} onChange={(event) => setHostelForm({ ...hostelForm, verified: event.target.checked })} />Details verified with host / student</label>
            <button type="submit" className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-bold text-white hover:bg-indigo-800">Upload listing as draft</button>
          </form>
          <section className="divide-y divide-slate-200" aria-label="Manage hostel listings">{hostelListings.length === 0 ? <p className="py-6 text-sm text-slate-500">No hostel listings yet.</p> : hostelListings.map((listing) => <article key={listing.id} className="grid gap-3 py-4 sm:grid-cols-[1fr_auto] sm:items-center"><div><h3 className="text-sm font-bold">{listing.title}</h3><p className="text-xs text-slate-500">{listing.campusName} · {listing.address} · {formatTZS(listing.pricePerTerm)} / term</p><p className="mt-1 text-[10px] font-bold">{listing.status} · {listing.verified ? 'Verified' : 'Unverified'}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void updateHostelListing(listing, listing.status === 'Published' ? 'Draft' : 'Published', listing.verified)} className="min-h-9 rounded-md border border-slate-300 px-3 text-xs font-bold">{listing.status === 'Published' ? 'Unpublish' : 'Publish'}</button><button type="button" onClick={() => void updateHostelListing(listing, listing.status, !listing.verified)} className="min-h-9 rounded-md border border-emerald-300 px-3 text-xs font-bold text-emerald-800">{listing.verified ? 'Unverify' : 'Verify'}</button><button type="button" onClick={() => void deleteHostelListing(listing)} className="min-h-9 rounded-md border border-red-200 px-3 text-xs font-bold text-red-700">Delete</button></div></article>)}</section>
        </div>}

        {activeTab === 'room-bounties' && <div className="space-y-5">
          <div><h2 className="text-lg font-bold text-slate-900">Room finder leads & fees</h2><p className="mt-1 text-xs text-slate-500">A finder’s fee becomes due only after the room is verified and leased. Mark it paid after the manual cash / mobile-money transfer.</p></div>
          {roomBountySubmissions.length === 0 ? <p className="border-y border-slate-200 py-8 text-sm text-slate-500">No room leads submitted.</p> : roomBountySubmissions.map((submission) => {
            const form = bountyForms[submission.id] || { status: submission.status, amount: submission.bountyAmount, notes: submission.adminNotes || '' };
            return <article key={submission.id} className="grid gap-5 border-b border-slate-200 py-5 lg:grid-cols-[1fr_20rem]"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold">{submission.location}</h3><span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold">{submission.status}</span><span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-900">Finder fee: {submission.payoutStatus}</span></div><p className="mt-2 text-xs text-slate-600">{submission.studentName} · {submission.phone} · {submission.university}</p><p className="mt-1 text-xs text-slate-600">Landlord: {submission.landlordName || 'Not provided'} {submission.landlordPhone}</p><p className="mt-2 whitespace-pre-wrap text-xs text-slate-700">{submission.details}</p></div><div className="space-y-2"><label className="block text-[11px] font-semibold">Status<select value={form.status} onChange={(event) => setBountyForms({ ...bountyForms, [submission.id]: { ...form, status: event.target.value as AdminRoomBounty['status'] } })} className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-2">{['Pending', 'Verifying', 'Leased', 'Rejected'].map((status) => <option key={status}>{status}</option>)}</select></label><label className="block text-[11px] font-semibold">Agreed finder’s fee (TZS)<input type="number" min="0" value={form.amount} onChange={(event) => setBountyForms({ ...bountyForms, [submission.id]: { ...form, amount: Number(event.target.value) } })} className="mt-1 min-h-10 w-full rounded-md border border-slate-300 px-2" /></label><label className="block text-[11px] font-semibold">Admin notes<textarea rows={2} value={form.notes} onChange={(event) => setBountyForms({ ...bountyForms, [submission.id]: { ...form, notes: event.target.value } })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1" /></label><div className="flex gap-2"><button type="button" onClick={() => void saveRoomBounty(submission)} className="min-h-10 flex-1 rounded-md bg-slate-900 px-3 text-xs font-bold text-white">Save lead</button>{submission.payoutStatus === 'Due' && <button type="button" onClick={() => void saveRoomBounty(submission, 'Paid')} className="min-h-10 rounded-md bg-emerald-700 px-3 text-xs font-bold text-white">Mark fee paid</button>}</div></div></article>;
          })}
        </div>}

        {activeTab === 'cancellations' && <div className="space-y-5">
          <div><h2 className="text-lg font-bold text-slate-900">Cancellation review</h2><p className="mt-1 text-xs text-slate-500">Review requests before dispatch. A verified payment requires a full refund and provider reference before completion. Refund transfer and inventory changes are manual.</p></div>
          {cancellationError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-800">{cancellationError}</p>}
          {cancellationRequests.length === 0 ? <p className="border-y border-slate-200 py-8 text-sm text-slate-500">No cancellation requests.</p> : cancellationRequests.map((item) => {
            const form = cancellationForms[item.id] || { status: item.status, refundAmount: item.refundAmount, refundReference: item.refundReference, adminNotes: item.adminNotes };
            return <article key={item.id} className="grid gap-5 border-b border-slate-200 py-5 lg:grid-cols-[1fr_20rem]">
              <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold">{item.orderId}</h3><span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-900">{item.status}</span></div><p className="mt-2 text-xs text-slate-600">{item.buyerName} · {item.buyerPhone}</p><p className="mt-1 text-xs text-slate-600">Reason: {item.reason}{item.details ? ` · ${item.details}` : ''}</p><p className="mt-1 text-xs text-slate-600">Payment: {item.paymentStatus} · Order total: {formatTZS(item.orderTotal)} · Delivery: {item.deliveryStatus}</p><p className="mt-1 text-[10px] text-slate-500">Requested {new Date(item.requestedAt).toLocaleString()}</p></div>
              <div className="space-y-2"><label className="block text-[11px] font-semibold">Decision<select value={form.status} onChange={(event) => setCancellationForms({ ...cancellationForms, [item.id]: { ...form, status: event.target.value as AdminCancellation['status'] } })} className="mt-1 min-h-10 w-full rounded-md border border-slate-300 bg-white px-2">{['Pending', 'Under Review', 'Approved', 'Rejected', 'Completed'].map((status) => <option key={status}>{status}</option>)}</select></label>{item.paymentStatus === 'Verified' && form.status === 'Completed' && <><label className="block text-[11px] font-semibold">Full refund amount (TZS)<input type="number" value={form.refundAmount} onChange={(event) => setCancellationForms({ ...cancellationForms, [item.id]: { ...form, refundAmount: Number(event.target.value) } })} className="mt-1 min-h-10 w-full rounded-md border border-slate-300 px-2" /></label><label className="block text-[11px] font-semibold">Provider refund reference<input value={form.refundReference} onChange={(event) => setCancellationForms({ ...cancellationForms, [item.id]: { ...form, refundReference: event.target.value } })} className="mt-1 min-h-10 w-full rounded-md border border-slate-300 px-2" /></label></>}<label className="block text-[11px] font-semibold">Internal review notes<textarea rows={2} maxLength={2000} value={form.adminNotes} onChange={(event) => setCancellationForms({ ...cancellationForms, [item.id]: { ...form, adminNotes: event.target.value } })} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1" /></label><button type="button" onClick={() => void saveCancellation(item)} className="min-h-10 rounded-md bg-slate-900 px-4 text-xs font-bold text-white">Save decision</button></div>
            </article>;
          })}
        </div>}

        {activeTab === 'audit-logs' && <section className="space-y-4" aria-label="Admin audit events"><div><h2 className="text-lg font-bold text-slate-900">Admin audit log</h2><p className="mt-1 text-xs text-slate-500">Append-only records of server-backed administrative changes. Metadata excludes customer contact details.</p></div>{auditEvents.length === 0 ? <p className="border-y border-slate-200 py-8 text-sm text-slate-500">No audit events available. Apply the audit-log migration and perform a server-backed admin action.</p> : <div className="divide-y divide-slate-200 border-y border-slate-200">{auditEvents.map((event) => <article key={event.id} className="grid gap-2 py-3 sm:grid-cols-[12rem_1fr]"><div><p className="text-xs font-bold">{event.action}</p><p className="mt-1 text-[10px] text-slate-500">{event.actor} · {new Date(event.createdAt).toLocaleString()}</p></div><div className="min-w-0"><p className="break-all text-xs font-semibold text-slate-700">{event.resourceType} · {event.resourceId}</p><pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-all text-[10px] text-slate-500">{JSON.stringify(event.metadata)}</pre></div></article>)}</div>}</section>}

        {/* 1. ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orderUpdateError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-800">{orderUpdateError}</p>}

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student name, transaction ID, or campus..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['All', 'Pending Verification', 'Approved', 'Out for Delivery', 'Completed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      orderStatusFilter === status
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Order ID & Date</th>
                      <th className="p-4">Customer & Campus</th>
                      <th className="p-4">Delivery Spot</th>
                      <th className="p-4">Lipa Namba Tx ID</th>
                      <th className="p-4">Winga Attribution</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No orders found matching the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const isPending = ord.status === 'Pending Verification';
                        const commission = Math.round(ord.totalAmount * 0.05);
                        const isPersistedOrder = remoteOrders.some((remote) => remote.id === ord.id);
                        const nextOrderAction = isPersistedOrder ? getNextOrderAction(ord) : null;
                        const blocksDispatch = Boolean(ord.tradeInRequestId && ord.tradeInInspectionStatus !== 'Inspected' && nextOrderAction && (nextOrderAction.type === 'delivery' || nextOrderAction.status === 'Ready for Dispatch'));
                        const nextOrderActionLabel = nextOrderAction?.status === 'Verification' ? 'Start Payment Verification'
                          : nextOrderAction?.status === 'Verified' ? 'Verify Payment'
                            : nextOrderAction?.status === 'Preparing' ? 'Start Preparing'
                              : nextOrderAction?.status === 'Ready for Dispatch' ? 'Ready for Dispatch'
                                : nextOrderAction?.status === 'With Winga' ? 'Dispatch to Winga'
                                  : nextOrderAction?.status === 'With Courier' ? 'Dispatch to Courier'
                                    : nextOrderAction?.status === 'Ready for Pickup' ? 'Ready for Pickup'
                                      : nextOrderAction?.status === 'Delivered' ? 'Mark Delivered' : '';

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                            {/* Order ID & Date */}
                            <td className="p-4">
                              <span className="font-mono font-bold text-slate-900">
                                {ord.id}
                              </span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {new Date(ord.createdAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </td>

                            {/* Customer & Campus */}
                            <td className="p-4">
                              <span className="font-bold text-slate-900 block">
                                {ord.buyerName}
                              </span>
                              <span className="text-[11px] text-slate-500">{ord.buyerPhone}</span>
                              <span className="text-[10px] text-indigo-600 block font-semibold">
                                {ord.university}
                              </span>
                              {ord.items?.length ? (
                                <span className="mt-1 block text-[10px] leading-4 text-slate-500">
                                  {ord.items.map((item) => `${item.quantity}× ${item.productTitle}`).join(', ')}
                                </span>
                              ) : ord.productTitle || ord.product?.title ? (
                                <span className="mt-1 block text-[10px] leading-4 text-slate-500">{ord.quantity}× {ord.productTitle || ord.product?.title}</span>
                              ) : null}
                            </td>

                            {/* Delivery Spot */}
                            <td className="p-4 max-w-45">
                              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                                <MapPin className="h-2.5 w-2.5 text-indigo-500" />
                                {ord.deliverySpotType}
                              </span>
                              <p className="text-[11px] text-slate-600 mt-1 truncate">
                                {ord.deliveryDetails}
                              </p>
                            </td>

                            {/* Submitted Lipa Namba Tx ID */}
                            <td className="p-4">
                              <span className="rounded-md bg-amber-50 px-2 py-1 font-mono font-bold text-amber-900 border border-amber-200">
                                {ord.lipaNambaTxId}
                              </span>
                            </td>

                            {/* Winga Attribution */}
                            <td className="p-4">
                              {ord.wingaCodeUsed ? (
                                <div>
                                  <span className="font-mono font-bold text-indigo-600">
                                    {ord.wingaCodeUsed}
                                  </span>
                                  <span className="text-[10px] text-emerald-600 block font-semibold">
                                    +{formatTZS(commission)} cut
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Direct / Organic</span>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="p-4 font-black text-slate-900">
                              {formatTZS(ord.totalAmount)}
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                getLegacyOrderStatus(ord) === 'Approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : getLegacyOrderStatus(ord) === 'Out for Delivery'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : getLegacyOrderStatus(ord) === 'Completed'
                                  ? 'bg-slate-100 text-slate-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {ord.paymentStatus ? `${ord.paymentStatus} · ${ord.fulfillmentStatus} · ${ord.deliveryStatus}` : ord.status}
                              </span>
                              {ord.tradeInRequestId && <span className={`mt-1 block text-[10px] font-bold ${ord.tradeInInspectionStatus === 'Inspected' ? 'text-emerald-700' : ord.tradeInInspectionStatus === 'Rejected' ? 'text-red-700' : 'text-amber-800'}`}>{ord.tradeInInspectionStatus || 'Trade-In Pending Inspection'}</span>}
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right space-x-1.5">
                              {isPersistedOrder ? nextOrderAction ? (
                                <button
                                  onClick={() => void handlePersistedOrderTransition(ord)}
                                  disabled={updatingOrderId === ord.id || blocksDispatch}
                                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {nextOrderAction.type === 'payment' ? <Check className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                                  <span>{updatingOrderId === ord.id ? 'Updating…' : blocksDispatch ? 'Inspection required before dispatch' : nextOrderActionLabel}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold">Done</span>
                              ) : isPending ? (
                                <button
                                  onClick={() => {
                                    approveOrder(ord.id);
                                    updateOrderReceipt(ord.id, ord.itemSerialNumber || '', ord.warrantyDays || 90);
                                    router.push(`/order/${encodeURIComponent(ord.id)}/receipt`);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                                  title="Approve Order and Credit Winga Commission"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve Order</span>
                                </button>
                              ) : ord.status === 'Approved' ? (
                                <button
                                  onClick={() => updateOrderStatus(ord.id, 'Out for Delivery')}
                                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all"
                                >
                                  <Truck className="h-3.5 w-3.5" />
                                  <span>Dispatch Runner</span>
                                </button>
                              ) : ord.status === 'Out for Delivery' ? (
                                <button
                                  onClick={() => updateOrderStatus(ord.id, 'Completed')}
                                  className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-all"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Mark Delivered</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs font-semibold">Done</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. TRADE-IN REQUESTS TAB */}
        {activeTab === 'trade-ins' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by student, gadget name, or campus..."
                  value={tradeInSearch}
                  onChange={(e) => setTradeInSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['All', 'Pending Review', 'Inspecting', 'Offer Made', 'Accepted', 'Rejected'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTradeInFilter(st)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                      tradeInFilter === st
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Trade In Table */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Ref & Date</th>
                      <th className="p-4">Student & Campus</th>
                      <th className="p-4">Gadget & Specs</th>
                      <th className="p-4">Condition</th>
                      <th className="p-4">Expected Price</th>
                      <th className="p-4">UniSoko Offer</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Review & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredTradeIns.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No trade-in submissions found matching the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredTradeIns.map((req) => {
                        return (
                          <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4">
                              <span className="font-mono font-bold text-slate-900 block">{req.id}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(req.submittedAt).toLocaleDateString('en-GB')}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="font-bold text-slate-900 block">{req.studentName}</span>
                              <a
                                href={`https://wa.me/${req.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Habari ${req.studentName}, tumepokea maombi yako ya kuuza kifaa UniSoko (${req.itemTitle}).`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold hover:underline"
                              >
                                <MessageCircle className="h-3 w-3" />
                                {req.phone}
                              </a>
                              <span className="text-[10px] text-indigo-600 block">{req.university}</span>
                            </td>

                            <td className="p-4 max-w-50">
                              <span className="font-bold text-slate-900 block truncate">{req.itemTitle}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1">{req.specs}</span>
                            </td>

                            <td className="p-4">
                              <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {req.condition}
                              </span>
                            </td>

                            <td className="p-4 font-bold text-slate-900">
                              {formatTZS(req.expectedPrice)}
                            </td>

                            <td className="p-4">
                              {req.offeredPrice ? (
                                <span className="font-black text-emerald-600 text-sm">
                                  {formatTZS(req.offeredPrice)}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Awaiting appraisal</span>
                              )}
                            </td>

                            <td className="p-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                req.status === 'Accepted'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'Offer Made'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : req.status === 'Inspecting'
                                  ? 'bg-sky-100 text-sky-800'
                                  : req.status === 'Rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {req.status}
                              </span>
                            </td>

                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleOpenTradeInDetail(req)}
                                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-600 transition-all shadow-xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>Inspect & Offer</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Gadget Catalog & Wholesale Price Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Manage Retail prices, Bei ya Jumla tiers (min 3 units), and stock statuses across all categories.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProdFormTitle('');
                  setProdFormCategory('Laptops');
                  setProdFormRetail(650000);
                  setProdFormWholesale(580000);
                  setProdFormCondition('Grade A Like-New');
                  setProdFormStockStatus('In Stock');
                  setProdFormDesc('');
                  setIsAddProductOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Product Grid Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                        {prod.category}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {prod.condition}
                      </span>
                    </div>

                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100">
                      <Image src={prod.images[0]} alt={prod.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-2">
                      {prod.title}
                    </h4>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Retail Price:</span>
                        <span className="font-extrabold text-slate-900">
                          {formatTZS(prod.priceRetail)}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>Wholesale (Jumla 3+):</span>
                        <span>{formatTZS(prod.priceWholesale)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Stock Status:</span>
                        <span className="font-semibold text-slate-700">
                          {prod.stockStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openEditModal(prod)}
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Price & Stock</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. WINGA PAYOUTS & KYC TAB */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Winga Ambassador KYC Verification & Payouts
              </h3>
              <p className="text-xs text-slate-500">
                Verify student identity cards, review mobile money cash-out requests, and disburse via M-Pesa / Tigo Pesa.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Payout Ref & Date</th>
                      <th className="p-4">Ambassador Details</th>
                      <th className="p-4">Student ID & KYC</th>
                      <th className="p-4">Disbursement Mobile</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">B2C Reference</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payoutRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400">
                          No payout requests in queue.
                        </td>
                      </tr>
                    ) : (
                      payoutRequests.map((payout) => {
                        const isPending = payout.status === 'Pending';
                        const agent = wingaAgents.find((a) => a.id === payout.agentId || a.promoCode === payout.promoCode);
                        const isKycVerified = (agent?.kycStatus || payout.kycStatus) === 'Verified';

                        return (
                          <tr key={payout.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="p-4">
                              <span className="font-mono font-bold text-slate-900">
                                {payout.id}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {new Date(payout.requestedAt).toLocaleDateString('en-GB')}
                              </span>
                            </td>

                            <td className="p-4">
                              <span className="font-bold text-slate-900 block">
                                {payout.agentName}
                              </span>
                              <span className="font-mono text-indigo-600 text-[11px] font-bold">
                                {payout.promoCode}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate max-w-45">
                                {payout.university}
                              </span>
                            </td>

                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isKycVerified
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  <ShieldCheck className="h-3 w-3" />
                                  {isKycVerified ? 'Verified' : 'Pending KYC'}
                                </span>
                                {!isKycVerified && agent && (
                                  <button
                                    onClick={() => verifyKycStudentId(agent.id)}
                                    className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                                  >
                                    Approve ID
                                  </button>
                                )}
                              </div>
                              {agent?.studentIdCardUrl && (
                                <a
                                  href={agent.studentIdCardUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-indigo-600 hover:underline block mt-1"
                                >
                                  View Student ID Scan
                                </a>
                              )}
                            </td>

                            <td className="p-4 font-mono font-bold text-slate-800">
                              {payout.phone}
                            </td>

                            <td className="p-4 font-black text-emerald-600 text-sm">
                              {formatTZS(payout.amount)}
                            </td>

                            <td className="p-4">
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                payout.status === 'Paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}>
                                {payout.status}
                              </span>
                            </td>

                            <td className="p-4 font-mono text-[11px] text-slate-600">
                              {payout.b2cReferenceId || 'Pending Transfer'}
                            </td>

                            <td className="p-4 text-right">
                              {isPending ? (
                                <button
                                  onClick={() => markPayoutPaid(payout.id)}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Mark as Paid</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                  <CheckCircle2 className="h-4 w-4" /> Paid
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'banners' && <div className="space-y-6">
          <div><h2 className="text-lg font-bold text-slate-900">Homepage banner manager</h2><p className="mt-1 text-xs text-slate-500">Schedule promotions, sponsor placements, and flash deals. Active banners are shown only inside their scheduled window.</p></div>
          {bannerError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-800">{bannerError}</p>}{bannerMessage && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{bannerMessage}</p>}
          <form onSubmit={(event) => void handleSaveBanner(event)} className="grid gap-4 border-y border-slate-200 py-5 md:grid-cols-2">
            <label className="text-xs font-semibold">Banner type<select value={bannerForm.kind} onChange={(event) => setBannerForm({ ...bannerForm, kind: event.target.value as AdminBanner['kind'] })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option>Promotion</option><option>Sponsor</option><option>Flash Deal</option></select></label>
            <label className="text-xs font-semibold">Status<select value={bannerForm.status} onChange={(event) => setBannerForm({ ...bannerForm, status: event.target.value as AdminBanner['status'] })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3"><option>Draft</option><option>Active</option><option>Paused</option></select></label>
            <label className="text-xs font-semibold">Title<input required maxLength={120} value={bannerForm.title} onChange={(event) => setBannerForm({ ...bannerForm, title: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold">Image (JPG, PNG, WebP · max 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setBannerImage(event.target.files?.[0] || null)} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 p-2" /></label>
            <label className="text-xs font-semibold md:col-span-2">Message<textarea rows={3} maxLength={500} value={bannerForm.body} onChange={(event) => setBannerForm({ ...bannerForm, body: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
            <label className="text-xs font-semibold">Button label<input maxLength={40} value={bannerForm.ctaLabel} onChange={(event) => setBannerForm({ ...bannerForm, ctaLabel: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold">Button link<input maxLength={500} value={bannerForm.ctaUrl} onChange={(event) => setBannerForm({ ...bannerForm, ctaUrl: event.target.value })} placeholder="/bundles or https://example.com" className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold">Start date & time<input required type="datetime-local" value={bannerForm.startsAt} onChange={(event) => setBannerForm({ ...bannerForm, startsAt: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <label className="text-xs font-semibold">End date & time<input required type="datetime-local" value={bannerForm.endsAt} onChange={(event) => setBannerForm({ ...bannerForm, endsAt: event.target.value })} className="mt-1 block min-h-11 w-full rounded-lg border border-slate-300 px-3" /></label>
            <div className="flex gap-2 md:col-span-2"><button type="submit" className="min-h-11 rounded-lg bg-indigo-700 px-4 text-sm font-bold text-white">{editingBannerId ? 'Save banner changes' : 'Create banner'}</button>{editingBannerId && <button type="button" onClick={() => { setEditingBannerId(''); setBannerImage(null); setBannerForm({ kind: 'Promotion', title: '', body: '', ctaLabel: '', ctaUrl: '', status: 'Draft', startsAt: '', endsAt: '' }); }} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-bold">Cancel edit</button>}</div>
          </form>
          <section className="divide-y divide-slate-200" aria-label="Manage promotional banners">{banners.length === 0 ? <p className="py-6 text-sm text-slate-500">No banners created yet.</p> : banners.map((banner) => <article key={banner.id} className="grid gap-4 py-4 sm:grid-cols-[9rem_1fr_auto] sm:items-center">{banner.imageUrl && <div className="relative aspect-video overflow-hidden rounded-md bg-slate-200"><Image src={banner.imageUrl} alt="" fill sizes="144px" unoptimized className="object-cover" /></div>}<div><p className="text-[10px] font-bold uppercase text-emerald-700">{banner.kind} · {banner.status}</p><h3 className="mt-1 text-sm font-bold">{banner.title}</h3><p className="mt-1 text-xs text-slate-500">{new Date(banner.startsAt).toLocaleString()} – {new Date(banner.endsAt).toLocaleString()}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => editBanner(banner)} className="min-h-9 rounded-md border border-slate-300 px-3 text-xs font-bold">Edit</button><button type="button" onClick={() => void updateBannerStatus(banner, banner.status === 'Active' ? 'Paused' : 'Active')} className="min-h-9 rounded-md border border-indigo-200 px-3 text-xs font-bold text-indigo-800">{banner.status === 'Active' ? 'Pause' : 'Activate'}</button><button type="button" onClick={() => void deleteBanner(banner)} className="min-h-9 rounded-md border border-red-200 px-3 text-xs font-bold text-red-700">Delete</button></div></article>)}</section>
        </div>}

        {/* 5. STORE SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Dynamic Store Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Update Lipa Namba till numbers, account holder names, WhatsApp contact numbers, and payout thresholds.
              </p>
            </div>

            {settingsSavedToast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-xs font-bold flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {settingsSaveWarning || 'Store settings updated successfully.'}
              </motion.div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div><h4 className="text-sm font-bold text-slate-900">Mobile money till numbers</h4><p className="mt-1 text-xs text-slate-500">Configure enabled networks and the registered name shown to students.</p></div>
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                </div>
                {(settingsForm.paymentMethods || []).map((method, idx) => (
                  <div key={method.id || `${method.network}-${idx}`} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-[1fr_1fr_1.5fr_auto_auto] md:items-end">
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Network</label><select value={method.network} onChange={(event) => setSettingsForm({ ...settingsForm, paymentMethods: settingsForm.paymentMethods?.map((item, i) => i === idx ? { ...item, network: event.target.value as NonNullable<StoreSettings['paymentMethods']>[number]['network'] } : item) })} className="w-full rounded-xl p-2.5 text-xs"><option>M-Pesa</option><option>Tigo Pesa</option><option>Airtel Money</option></select></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Till / Lipa number</label><input value={method.tillNumber} onChange={(event) => setSettingsForm({ ...settingsForm, paymentMethods: settingsForm.paymentMethods?.map((item, i) => i === idx ? { ...item, tillNumber: event.target.value } : item) })} className="w-full rounded-xl p-2.5 text-xs" /></div>
                    <div><label className="mb-1 block text-xs font-bold text-slate-700">Account holder</label><input value={method.accountName} onChange={(event) => setSettingsForm({ ...settingsForm, paymentMethods: settingsForm.paymentMethods?.map((item, i) => i === idx ? { ...item, accountName: event.target.value } : item) })} className="w-full rounded-xl p-2.5 text-xs" /></div>
                    <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-700"><input type="checkbox" checked={method.enabled} onChange={(event) => setSettingsForm({ ...settingsForm, paymentMethods: settingsForm.paymentMethods?.map((item, i) => i === idx ? { ...item, enabled: event.target.checked } : item) })} />Enabled</label>
                    <button type="button" onClick={() => setSettingsForm({ ...settingsForm, paymentMethods: settingsForm.paymentMethods?.filter((_, i) => i !== idx) })} aria-label={`Remove ${method.network} till`} className="min-h-10 rounded-lg px-3 text-xs font-bold text-red-700 hover:bg-red-50">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setSettingsForm({ ...settingsForm, paymentMethods: [...(settingsForm.paymentMethods || []), { id: crypto.randomUUID(), network: 'M-Pesa', tillNumber: '', accountName: '', enabled: true }] })} className="min-h-10 rounded-lg border border-indigo-200 px-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Add till / Lipa number</button>
              </div>

              {/* Payment Gateways / Lipa Namba */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Payment Gateway & Lipa Namba Till
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Merchant Till Number (Lipa Namba) *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.tillNumber}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, tillNumber: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Displayed to students during checkout copy-till prompt.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Merchant Store Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.merchantName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, merchantName: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Account Holder / Registered Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={settingsForm.accountName}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, accountName: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Name shown on M-Pesa / Tigo confirmation SMS.</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Minimum Winga Payout Threshold (TZS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={settingsForm.minPayoutThreshold}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          minPayoutThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Support & WhatsApp */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Phone className="h-5 w-5 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Official Support & WhatsApp Deep Links
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Support Phone Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.supportPhone}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, supportPhone: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Support WhatsApp Number (local 06… / 07… or international 255…)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.supportWhatsApp}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          supportWhatsApp: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-mono focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>
                <div><label className="mb-1 block text-xs font-bold text-slate-700">Official WhatsApp numbers (comma-separated)</label><input value={(settingsForm.officialWhatsAppNumbers || []).join(', ')} onChange={(event) => setSettingsForm({ ...settingsForm, officialWhatsAppNumbers: event.target.value.split(',').map((number) => number.trim()).filter(Boolean) })} className="w-full rounded-xl p-2.5 text-xs" placeholder="0616961511" /></div>
              </div>

              {/* Partner Badges & Sponsor Logos */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building className="h-5 w-5 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Institutional Partners & Verified Badges
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-slate-500">
                    Verified campus unions and financial sponsors displayed across the homepage footer and checkout guarantee cards.
                  </p>
                  <div className="space-y-3">
                    {settingsForm.partnerBadges?.map((partner, idx: number) => (
                      <div key={`${partner.shortCode}-${idx}`} className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-5">
                        <input aria-label="Partner name" value={partner.name} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, name: event.target.value } : item) })} className="rounded-xl p-2 text-xs" placeholder="Partner name" />
                        <input aria-label="Short code" value={partner.shortCode} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, shortCode: event.target.value } : item) })} className="rounded-xl p-2 text-xs" placeholder="Short code" />
                        <input aria-label="Logo image URL" value={partner.logoUrl || ''} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, logoUrl: event.target.value } : item) })} className="rounded-xl p-2 text-xs" placeholder="Logo image URL" />
                        <input aria-label="Partner website or social link" value={partner.url || ''} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, url: event.target.value } : item) })} className="rounded-xl p-2 text-xs" placeholder="Website / social link" />
                        <div className="flex gap-2"><input aria-label="Partner type" value={partner.category} onChange={(event) => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.map((item, i) => i === idx ? { ...item, category: event.target.value } : item) })} className="min-w-0 flex-1 rounded-xl p-2 text-xs" placeholder="Type" /><button type="button" onClick={() => setSettingsForm({ ...settingsForm, partnerBadges: settingsForm.partnerBadges.filter((_, i) => i !== idx) })} className="rounded-xl px-3 text-red-700 hover:bg-red-50" aria-label={`Remove ${partner.name}`}><X className="h-4 w-4" /></button></div>
                      </div>
                    ))}
                    <button type="button" onClick={() => setSettingsForm({ ...settingsForm, partnerBadges: [...settingsForm.partnerBadges, { name: '', shortCode: '', category: 'Sponsor', logoUrl: '', url: '' }] })} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50"><Plus className="h-4 w-4" />Add partner / sponsor</button>
                  </div>
                </div>
              </div>



              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3"><div><h4 className="text-sm font-bold text-slate-900">Developer Profile</h4><p className="mt-1 text-xs text-slate-500">Public attribution and contact details. Story text is rendered as plain text; profile links must use HTTPS.</p></div><Building className="h-5 w-5 text-indigo-600" /></div>
                {developerProfileError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-800">{developerProfileError}</p>}
                {developerProfileMessage && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">{developerProfileMessage}</p>}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 text-2xl font-black text-indigo-700">{(developerImagePreview || settingsForm.developerProfile.imageUrl) ? <Image src={developerImagePreview || settingsForm.developerProfile.imageUrl} alt="Developer profile preview" fill sizes="96px" unoptimized className="object-cover" /> : 'RI'}</div>
                  <div className="space-y-2"><label className="block text-xs font-semibold">Profile image (JPG, PNG, WebP · max 3 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0] || null; setDeveloperImageFile(file); setDeveloperImagePreview(file ? URL.createObjectURL(file) : ''); setRemoveDeveloperImage(false); }} className="mt-1 block w-full rounded-lg border border-slate-300 p-2" /></label><button type="button" onClick={() => { setDeveloperImageFile(null); setDeveloperImagePreview(''); setRemoveDeveloperImage(true); setSettingsForm((previous) => ({ ...previous, developerProfile: { ...previous.developerProfile, imagePath: '', imageUrl: '' } })); }} className="min-h-9 rounded-md border border-red-200 px-3 text-xs font-bold text-red-700">Remove image</button></div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold">Name<input required maxLength={100} value={settingsForm.developerProfile.name} onChange={(event) => setSettingsForm((previous) => ({ ...previous, developerProfile: { ...previous.developerProfile, name: event.target.value } }))} className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
                  <label className="text-xs font-semibold">Developer link (HTTPS)<input type="url" maxLength={500} value={settingsForm.developerProfile.link} onChange={(event) => setSettingsForm((previous) => ({ ...previous, developerProfile: { ...previous.developerProfile, link: event.target.value } }))} placeholder="https://..." className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
                  <label className="text-xs font-semibold">Phone<input required type="tel" value={settingsForm.developerProfile.phone} onChange={(event) => setSettingsForm((previous) => ({ ...previous, developerProfile: { ...previous.developerProfile, phone: event.target.value } }))} className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
                  <label className="text-xs font-semibold">WhatsApp<input required type="tel" value={settingsForm.developerProfile.whatsapp} onChange={(event) => setSettingsForm((previous) => ({ ...previous, developerProfile: { ...previous.developerProfile, whatsapp: event.target.value } }))} className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
                  <label className="text-xs font-semibold sm:col-span-2">Email<input required type="email" value={settingsForm.developerProfile.email} onChange={(event) => setSettingsForm((previous) => ({ ...previous, developerProfile: { ...previous.developerProfile, email: event.target.value } }))} className="mt-1 block min-h-10 w-full rounded-lg border border-slate-300 px-3" /></label>
                  <label className="text-xs font-semibold sm:col-span-2">Short story<textarea maxLength={1200} rows={4} value={settingsForm.developerProfile.story} onChange={(event) => setSettingsForm((previous) => ({ ...previous, developerProfile: { ...previous.developerProfile, story: event.target.value } }))} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
                </div>
                <button type="button" onClick={() => void handleSaveDeveloperProfile()} className="min-h-10 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-indigo-700">Save Developer Profile</button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-indigo-600" /><h4 className="text-sm font-bold text-slate-900">Campus expansion demand</h4></div>
                {Object.keys(campusVotes).length ? Object.entries(campusVotes).sort((a, b) => b[1] - a[1]).map(([id, count]) => <div key={id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"><span>{id}</span><strong>{count} votes</strong></div>) : <p className="text-xs text-slate-500">No saved campus votes yet. Votes are currently stored in this browser only.</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  <Save className="h-4 w-4" />
                  <span>Save All Settings</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Trade-In Detail / Action Modal */}
      <AnimatePresence>
        {activeTradeInModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTradeInModal(null)}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    Trade-In Appraisal
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-heading">
                    {activeTradeInModal.itemTitle}
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTradeInModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                {/* Image preview */}
                {(activeTradeInModal.imageUrls?.length || activeTradeInModal.imageUrl) && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    {activeTradeInModal.imageUrls?.length ? (
                      <div className="grid h-full grid-cols-3 gap-2 p-2">
                        {activeTradeInModal.imageUrls.map((image, index) => <div key={index} className="relative overflow-hidden rounded-xl"><Image src={image} alt={`${activeTradeInModal.itemTitle} photo ${index + 1}`} fill unoptimized className="object-cover" /></div>)}
                      </div>
                    ) : activeTradeInModal.imageUrl ? <Image src={activeTradeInModal.imageUrl} alt={activeTradeInModal.itemTitle} fill className="object-cover" /> : null}
                  </div>
                )}

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Student Name</span>
                    <span className="font-bold text-slate-900">{activeTradeInModal.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Campus</span>
                    <span className="font-bold text-indigo-600">{activeTradeInModal.university}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Condition</span>
                    <span className="font-bold text-slate-900">{activeTradeInModal.condition}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Expected Price</span>
                    <span className="font-bold text-slate-900">{formatTZS(activeTradeInModal.expectedPrice)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-bold block mb-1">Specifications / Notes:</span>
                  <p className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                    {activeTradeInModal.specs}
                  </p>
                </div>

                {/* Set UniSoko Offer Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    UniSoko Cash Offer (TZS) *
                  </label>
                  <input
                    type="number"
                    value={offerPriceInput}
                    onChange={(e) => setOfferPriceInput(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Internal Appraisal Notes
                  </label>
                  <textarea
                    rows={2}
                    value={adminNotesInput}
                    onChange={(e) => setAdminNotesInput(e.target.value)}
                    placeholder="Battery health tested at 88%, minor scuff on corner..."
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                {/* Status action buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Update Workflow Status
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateTradeIn('Inspecting')}
                      className="rounded-xl bg-sky-50 text-sky-700 font-bold py-2 text-[11px] hover:bg-sky-100 border border-sky-200 transition-colors"
                    >
                      Inspecting
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTradeIn('Offer Made')}
                      className="rounded-xl bg-indigo-50 text-indigo-700 font-bold py-2 text-[11px] hover:bg-indigo-100 border border-indigo-200 transition-colors"
                    >
                      Offer Made
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTradeIn('Accepted')}
                      className="rounded-xl bg-emerald-600 text-white font-bold py-2 text-[11px] hover:bg-emerald-700 transition-colors"
                    >
                      Accept & Pay
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateTradeIn('Rejected')}
                      className="rounded-xl bg-red-50 text-red-700 font-bold py-2 text-[11px] hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / Add Product Modal */}
      <AnimatePresence>
        {(editingProduct || isAddProductOpen) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingProduct(null);
                setIsAddProductOpen(false);
              }}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  {editingProduct ? 'Edit Gadget Specs & Pricing' : 'Add New Gadget to Catalog'}
                </h3>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddProductOpen(false);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Gadget Title & Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={prodFormTitle}
                    onChange={(e) => setProdFormTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={prodFormCategory}
                      onChange={(e) => setProdFormCategory(e.target.value as ProductCategory)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="Laptops">Laptops</option>
                      <option value="Laptops & Computers">Laptops & Computers</option>
                      <option value="Phones">Phones</option>
                      <option value="Smart Phones & Accessories">Smart Phones & Accessories</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Power & Audio">Power & Audio</option>
                      <option value="Room Gear">Room Gear</option>
                      <option value="Student Lifestyle Gear">Student Lifestyle Gear</option>
                      <option value="Campus Essentials">Campus Essentials</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Condition
                    </label>
                    <select
                      value={prodFormCondition}
                      onChange={(e) => setProdFormCondition(e.target.value as ProductCondition)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="Grade A Like-New">Grade A Like-New</option>
                      <option value="Brand New">Brand New</option>
                      <option value="Refurbished">Refurbished</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Retail Price (TZS) *
                    </label>
                    <input
                      type="number"
                      required
                      value={prodFormRetail}
                      onChange={(e) => setProdFormRetail(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Wholesale Price (3+ units) *
                    </label>
                    <input
                      type="number"
                      required
                      value={prodFormWholesale}
                      onChange={(e) => setProdFormWholesale(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Stock Status
                    </label>
                    <select
                      value={prodFormStockStatus}
                      onChange={(e) => setProdFormStockStatus(e.target.value as StockStatus)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="New Stock">New Stock</option>
                      <option value="Trending">Trending</option>
                      <option value="Coming Soon">Coming Soon</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Image URL (Unsplash/Direct)
                    </label>
                    <input
                      type="text"
                      value={prodFormImage}
                      onChange={(e) => setProdFormImage(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={3}
                    value={prodFormDesc}
                    onChange={(e) => setProdFormDesc(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAddProductOpen(false);
                    }}
                    className="rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
                  >
                    {editingProduct ? 'Save Changes' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CartDrawer />
    </div>
  );
}
