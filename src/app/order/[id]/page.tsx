import { redirect } from 'next/navigation';

export default async function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  redirect(`/order/${encodeURIComponent(id)}/receipt`);
}
