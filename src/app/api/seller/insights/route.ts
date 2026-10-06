import { NextResponse } from 'next/server';
import { getSellerActor, getSellerProfile } from '@/lib/sellerAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const actor = await getSellerActor();
  if (actor.kind !== 'ok') return NextResponse.json({ error: 'Sign in through the seller portal.' }, { status: actor.kind === 'unavailable' ? 503 : 401 });
  const { data: seller } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (!seller || seller.status !== 'approved') return NextResponse.json({ error: 'An approved seller account is required.' }, { status: 403 });
  const [products, commissions, notifications] = await Promise.all([
    actor.serviceClient.from('products').select('id,listing_status,price').eq('seller_profile_id', seller.id),
    actor.serviceClient.from('winga_commissions').select('amount,status').eq('seller_profile_id', seller.id),
    actor.serviceClient.from('seller_notifications').select('id,kind,title,message,resource_id,created_at,read_at').eq('user_id', actor.user.id).eq('seller_profile_id', seller.id).order('created_at', { ascending: false }).limit(20),
  ]);
  if (products.error || commissions.error || notifications.error) return NextResponse.json({ error: 'Seller insights are unavailable. Apply the Phase 9 migration.' }, { status: 503 });
  const listingStats = (products.data || []).reduce((stats, row) => { stats.total++; const status = row.listing_status as keyof typeof stats; if (status in stats && typeof stats[status] === 'number') stats[status] = Number(stats[status]) + 1; if (row.listing_status === 'approved') stats.activeValue += Number(row.price || 0); return stats; }, { total: 0, approved: 0, pending_approval: 0, rejected: 0, changes_requested: 0, draft: 0, activeValue: 0 });
  const commissionStats = (commissions.data || []).reduce((stats, row) => { const amount = Number(row.amount || 0); if (row.status === 'payable') stats.payable += amount; if (row.status === 'paid') stats.paid += amount; return stats; }, { payable: 0, paid: 0 });
  return NextResponse.json({ listings: listingStats, commissions: commissionStats, notifications: notifications.data || [] }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH() {
  const actor = await getSellerActor();
  if (actor.kind !== 'ok') return NextResponse.json({ error: 'Sign in through the seller portal.' }, { status: actor.kind === 'unavailable' ? 503 : 401 });
  const { data: seller } = await getSellerProfile(actor.serviceClient, actor.user.id);
  if (!seller) return NextResponse.json({ error: 'Seller account not found.' }, { status: 404 });
  const { error } = await actor.serviceClient.from('seller_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', actor.user.id).eq('seller_profile_id', seller.id).is('read_at', null);
  if (error) return NextResponse.json({ error: 'Could not mark notifications as read.' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
