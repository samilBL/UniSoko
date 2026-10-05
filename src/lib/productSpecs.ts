import type { Product } from '@/lib/types';

const STRUCTURED_SPEC_ALIASES: Record<string, string[]> = {
  processor: ['processor', 'cpu', 'chip'],
  ram: ['ram', 'memory', 'ramstorage'],
  storage: ['storage', 'ramstorage'],
  display: ['display', 'screen'],
  battery: ['battery'],
  connectivity: ['connectivity', 'network'],
};

export function getProductSpecEntries(product: Product): [string, string][] {
  const normalized = product.specifications;
  if (!normalized) return Object.entries(product.specs || {});

  const entries: [string, string][] = [];
  if (product.brand) entries.push(['Brand', product.brand]);
  if (product.model) entries.push(['Model', product.model]);
  if (normalized.processor) entries.push(['Processor', normalized.processor]);
  if (normalized.ram) entries.push(['RAM', normalized.ram]);
  if (normalized.storage) entries.push(['Storage', normalized.storage]);
  if (normalized.display) entries.push(['Display', normalized.display]);
  if (normalized.battery) entries.push(['Battery', normalized.battery]);
  if (normalized.connectivity) entries.push(['Connectivity', normalized.connectivity]);
  entries.push(...Object.entries(normalized.details || {}));

  const structuredKeys = Object.entries(STRUCTURED_SPEC_ALIASES)
    .filter(([field]) => Boolean(normalized[field as keyof typeof normalized]))
    .flatMap(([, aliases]) => aliases);
  const legacyEntries = Object.entries(product.specs || {}).filter(([key]) => {
    const canonicalKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    return !structuredKeys.includes(canonicalKey);
  });
  entries.push(...legacyEntries);
  return entries;
}

export function matchesProductSearch(product: Product, query: string) {
  const searchable = [
    product.title,
    product.description,
    product.category,
    product.brand,
    product.model,
    ...getProductSpecEntries(product).flat(),
  ].filter(Boolean).join(' ').toLowerCase();
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return terms.every((term) => searchable.includes(term));
}
