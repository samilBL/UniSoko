export const AD_PACKAGE_PRICES = {
  'Homepage Spotlight': { amount: 30_000, unit: 'week' },
  'Category Exclusive Sponsor': { amount: 25_000, unit: 'week' },
  'Campus Community Blast': { amount: 40_000, unit: 'campaign' },
} as const;

export type SelfServeAdPackage = keyof typeof AD_PACKAGE_PRICES;

export const AD_TARGET_CAMPUSES = [
  'MUST (Mbeya)', 'TEKU (Mbeya)', 'UDSM (Dar es Salaam)', 'CBE (Dar / Dodoma)',
  'DIT (Dar es Salaam)', 'IFM (Dar es Salaam)', 'All Tanzania Campuses',
] as const;

export function getAdvertisingFee(packageType: SelfServeAdPackage, durationWeeks: number) {
  const pricing = AD_PACKAGE_PRICES[packageType];
  return pricing.unit === 'week' ? pricing.amount * durationWeeks : pricing.amount;
}
