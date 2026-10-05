export type TradeInCategory = 'Phone' | 'Tablet' | 'Laptop';

export type TradeInCosmeticCondition = 'Excellent' | 'Light wear' | 'Visible wear' | 'Heavy damage';
export type TradeInScreenCondition = 'Intact' | 'Minor scratches' | 'Cracked' | 'Not working';
export type TradeInBatteryHealth = '90%+' | '80-89%' | '70-79%' | 'Below 70%' | 'Unknown';

export interface TradeInValuationInput {
  category: TradeInCategory;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  cosmeticCondition: TradeInCosmeticCondition;
  screenCondition: TradeInScreenCondition;
  batteryHealth: TradeInBatteryHealth;
  accessories: string[];
}

const BASE_MARKET_VALUE: Record<TradeInCategory, number> = {
  Phone: 200_000,
  Tablet: 260_000,
  Laptop: 520_000,
};

const BRAND_FACTOR: Record<string, number> = {
  apple: 1.45,
  samsung: 1.2,
  google: 1.15,
  microsoft: 1.12,
  dell: 1.05,
  hp: 1.02,
  asus: 1.02,
  lenovo: 1,
  xiaomi: 0.98,
  oppo: 0.95,
  huawei: 0.92,
  tecno: 0.86,
  infinix: 0.86,
};

const COSMETIC_FACTOR: Record<TradeInCosmeticCondition, number> = {
  Excellent: 1,
  'Light wear': 0.86,
  'Visible wear': 0.68,
  'Heavy damage': 0.42,
};

const SCREEN_FACTOR: Record<TradeInScreenCondition, number> = {
  Intact: 1,
  'Minor scratches': 0.82,
  Cracked: 0.3,
  'Not working': 0,
};

const BATTERY_FACTOR: Record<TradeInBatteryHealth, number> = {
  '90%+': 1,
  '80-89%': 0.9,
  '70-79%': 0.76,
  'Below 70%': 0.58,
  Unknown: 0.7,
};

const ACCESSORY_BONUS: Record<string, number> = {
  charger: 5_000,
  originalBox: 5_000,
  case: 2_500,
};

function storageFactor(storage: string) {
  const capacity = Number.parseInt(storage, 10);
  if (!Number.isFinite(capacity) || capacity <= 0) return 1;
  if (capacity <= 64) return 0.86;
  if (capacity <= 128) return 1;
  if (capacity <= 256) return 1.16;
  if (capacity <= 512) return 1.3;
  return 1.42;
}

function ramFactor(ram: string, category: TradeInCategory) {
  if (category !== 'Laptop') return 1;
  const capacity = Number.parseInt(ram, 10);
  if (capacity >= 32) return 1.32;
  if (capacity >= 16) return 1.18;
  if (capacity >= 8) return 1;
  return 0.84;
}

function modelFactor(category: TradeInCategory, model: string) {
  const normalized = model.toLowerCase();
  if (category === 'Phone') {
    if (/iphone\s*(15|16|17)|galaxy\s*(s2[3-9]|z\s*fold)/.test(normalized)) return 1.4;
    if (/iphone\s*(13|14)|galaxy\s*s2[0-2]|pixel\s*[7-9]/.test(normalized)) return 1.2;
    if (/iphone\s*(11|12)|galaxy\s*a[3-5][0-9]/.test(normalized)) return 1;
    if (/iphone\s*se|galaxy\s*j/.test(normalized)) return 0.78;
  }
  if (category === 'Tablet') {
    if (/ipad\s*pro|galaxy\s*tab\s*s/.test(normalized)) return 1.3;
    if (/ipad\s*air|matepad\s*pro/.test(normalized)) return 1.16;
    if (/ipad\s*mini/.test(normalized)) return 1.08;
  }
  if (category === 'Laptop') {
    if (/macbook\s*pro.*m[2-5]|thinkpad\s*x1|xps\s*1[345]|latitude\s*7[0-9]{2,3}|elitebook\s*8[0-9]{2}/.test(normalized)) return 1.28;
    if (/macbook\s*air.*m[1-5]|thinkpad\s*t[0-9]{2}|latitude\s*5[0-9]{2}|elitebook\s*6[0-9]{2}/.test(normalized)) return 1.14;
  }
  return 1;
}

export function estimateTradeInPrice(input: TradeInValuationInput) {
  const baseMarketValue = BASE_MARKET_VALUE[input.category];
  const brandFactor = BRAND_FACTOR[input.brand.trim().toLowerCase()] || 0.85;
  const accessoryBonus = input.accessories.reduce((sum, accessory) => sum + (ACCESSORY_BONUS[accessory] || 0), 0);
  const conditionAdjustedValue = baseMarketValue
    * brandFactor
    * modelFactor(input.category, input.model)
    * storageFactor(input.storage)
    * ramFactor(input.ram, input.category)
    * COSMETIC_FACTOR[input.cosmeticCondition]
    * SCREEN_FACTOR[input.screenCondition]
    * BATTERY_FACTOR[input.batteryHealth];

  return Math.max(0, Math.round((conditionAdjustedValue + accessoryBonus) / 1_000) * 1_000);
}

export const TRADE_IN_INSPECTION_DISCLAIMER = 'Trade-in discounts are estimates. Final price lock occurs after physical hardware, battery, and screen verification by a UniSoko Winga or technician during campus hand-off.';