import type { Product } from './types';

export const MAX_PRODUCT_QUANTITY = 12;
export const DEFAULT_WHOLESALE_MINIMUM = 3;
export const DEFAULT_GROUP_BUY_MINIMUM = 3;

const WHOLESALE_MAX_DISCOUNT_PERCENT = 0.05;
const WHOLESALE_MAX_DISCOUNT_TZS = 10_000;
const GROUP_BUY_DISCOUNT_PERCENT = 0.05;
const GROUP_BUY_MAX_DISCOUNT_TZS = 20_000;

export function getWholesaleUnitPrice(
  retailPrice: number,
  configuredWholesalePrice: number,
  quantity: number,
  minimumQuantity = DEFAULT_WHOLESALE_MINIMUM
) {
  const retail = Number.isFinite(retailPrice) ? Math.max(0, retailPrice) : 0;
  if (quantity < minimumQuantity) return retail;

  const configuredDiscount = retail - configuredWholesalePrice;
  if (!Number.isFinite(configuredDiscount) || configuredDiscount <= 0) return retail;

  const discount = Math.min(
    configuredDiscount,
    retail * WHOLESALE_MAX_DISCOUNT_PERCENT,
    WHOLESALE_MAX_DISCOUNT_TZS
  );
  return Math.round(retail - discount);
}

export function getProductUnitPrice(
  product: Pick<Product, 'priceRetail' | 'priceWholesale' | 'minWholesaleQty' | 'sellerProfileId' | 'sellerWholesaleEnabled'>,
  quantity: number
) {
  if (product.sellerProfileId && product.sellerWholesaleEnabled !== true) {
    return Number.isFinite(product.priceRetail) ? Math.max(0, product.priceRetail) : 0;
  }
  return getWholesaleUnitPrice(product.priceRetail, product.priceWholesale, quantity, product.minWholesaleQty);
}

export function getGroupBuyUnitPrice(retailPrice: number) {
  const retail = Number.isFinite(retailPrice) ? Math.max(0, retailPrice) : 0;
  const discount = Math.min(
    retail * GROUP_BUY_DISCOUNT_PERCENT,
    GROUP_BUY_MAX_DISCOUNT_TZS
  );
  return Math.round(retail - discount);
}
