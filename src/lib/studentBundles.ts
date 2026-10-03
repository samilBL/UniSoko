import { MOCK_PRODUCTS } from '@/lib/mockData';
import type { Product } from '@/lib/types';

export interface StudentBundle extends Product {
  bundleContents: string[];
  listPrice: number;
  course: string;
}

const bundleDefinitions = [
  {
    id: 'bundle-first-year-room',
    title: 'First-Year Room Essentials',
    course: 'First-Year Room',
    productIds: ['prod-room-bedframe', 'prod-room-fan', 'prod-room-mattress', 'prod-room-desk-lamp'],
    discountPercent: 10,
    condition: 'Brand New' as const,
    description: 'A coordinated starter setup for a comfortable student room.',
  },
  {
    id: 'bundle-computer-science-bscs',
    title: 'Computer Science / BSCS Pack',
    course: 'Computer Science / BSCS',
    productIds: ['prod-hp-elitebook-840-g6', 'prod-laptop-stand', 'prod-studio-ringlight-10inch', 'prod-powerbank-20000mah'],
    discountPercent: 10,
    condition: 'Grade A Like-New' as const,
    description: 'A refurbished laptop plus the core accessories for coding, coursework, and online classes.',
  },
] as const;

export const STUDENT_BUNDLES: StudentBundle[] = bundleDefinitions.map((bundle) => {
  const products = bundle.productIds.map((id) => MOCK_PRODUCTS.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));
  const listPrice = products.reduce((total, product) => total + product.priceRetail, 0);
  const bundlePrice = Math.round((listPrice * (1 - bundle.discountPercent / 100)) / 1_000) * 1_000;
  const bundleContents = products.map((product) => product.title);

  return {
    id: bundle.id,
    title: bundle.title,
    description: bundle.description,
    category: 'Student Lifestyle Gear',
    priceRetail: bundlePrice,
    priceWholesale: bundlePrice,
    condition: bundle.condition,
    stockStatus: 'In Stock',
    minWholesaleQty: 1_000,
    images: products[0]?.images || [],
    featured: true,
    specs: {
      Contents: bundleContents.join(' + '),
      'Bundle discount': `${bundle.discountPercent}%`,
    },
    bundleContents,
    listPrice,
    course: bundle.course,
  };
});
