import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { estimateTradeInPrice } from '@/lib/tradeInValuation';
import type { TradeInValuationInput } from '@/lib/tradeInValuation';

const MAX_PHOTOS = 3;
const MIN_BYTES = 1_000_000;
const MAX_BYTES = 3_000_000;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const CATEGORIES = new Set(['Phone', 'Tablet', 'Laptop']);
const COSMETIC_CONDITIONS = new Set(['Excellent', 'Light wear', 'Visible wear', 'Heavy damage']);
const SCREEN_CONDITIONS = new Set(['Intact', 'Minor scratches', 'Cracked', 'Not working']);
const BATTERY_HEALTH = new Set(['90%+', '80-89%', '70-79%', 'Below 70%', 'Unknown']);
const ACCESSORIES = new Set(['charger', 'originalBox', 'case']);

function readText(value: unknown, maxLength: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= maxLength
    ? value.trim()
    : null;
}

async function hasValidImageSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (file.type === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === 'image/png') return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (file.type === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Trade-in database is not configured.' }, { status: 503 });

  try {
    const formData = await request.formData();
    const parsed: unknown = JSON.parse(String(formData.get('request') || '{}'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return NextResponse.json({ error: 'Invalid trade-in request.' }, { status: 400 });
    const metadata = parsed as Record<string, unknown>;
    const purchaseLinked = metadata.purchaseLinked === true;
    const files = formData.getAll('photos').filter((value): value is File => value instanceof File);
    if (files.length > MAX_PHOTOS) return NextResponse.json({ error: 'Upload up to 3 photos.' }, { status: 400 });
    if (purchaseLinked && files.length < 2) return NextResponse.json({ error: 'Upload 2 or 3 device photos.' }, { status: 400 });
    if (files.some((file) => !ALLOWED_TYPES.has(file.type) || file.size < MIN_BYTES || file.size > MAX_BYTES)) {
      return NextResponse.json({ error: 'Each JPG, PNG, or WebP photo must be between 1 MB and 3 MB.' }, { status: 400 });
    }
    for (const file of files) {
      if (!await hasValidImageSignature(file)) return NextResponse.json({ error: 'One or more uploads do not contain valid JPG, PNG, or WebP image data.' }, { status: 400 });
    }

    const studentName = readText(metadata.studentName, 120);
    const phone = readText(metadata.phone, 32);
    const university = readText(metadata.university, 160);
    const itemTitle = readText(metadata.itemTitle, 180);
    const category = readText(metadata.category, 80);
    const condition = readText(metadata.condition, 160);
    const phoneDigits = phone?.replace(/\D/g, '').length || 0;
    if (!studentName || studentName.length < 2 || !phone || phoneDigits < 7 || phoneDigits > 15 ||
        !university || !itemTitle || !category || !condition) {
      return NextResponse.json({ error: 'Required trade-in fields are missing.' }, { status: 400 });
    }
    let expectedPrice = Number(metadata.expectedPrice);
    let valuationInputs: TradeInValuationInput | null = null;
    let quoteToken: string | null = null;
    if (purchaseLinked) {
      const accessories = metadata.accessories;
      if (!CATEGORIES.has(String(metadata.category)) || !COSMETIC_CONDITIONS.has(String(metadata.cosmeticCondition)) ||
          !SCREEN_CONDITIONS.has(String(metadata.screenCondition)) || !BATTERY_HEALTH.has(String(metadata.batteryHealth)) ||
          !Array.isArray(accessories) || new Set(accessories).size !== accessories.length ||
          accessories.some((item) => typeof item !== 'string' || !ACCESSORIES.has(item))) {
        return NextResponse.json({ error: 'Trade-in device details are invalid.' }, { status: 400 });
      }
      const brand = readText(metadata.brand, 80);
      const model = readText(metadata.model, 100);
      const ram = readText(metadata.ram, 30);
      const storage = readText(metadata.storage, 30);
      if (!brand || !model || !ram || !storage) return NextResponse.json({ error: 'Brand, model, RAM, and storage are required.' }, { status: 400 });
      valuationInputs = {
        category: metadata.category as TradeInValuationInput['category'],
        brand,
        model,
        ram,
        storage,
        cosmeticCondition: metadata.cosmeticCondition as TradeInValuationInput['cosmeticCondition'],
        screenCondition: metadata.screenCondition as TradeInValuationInput['screenCondition'],
        batteryHealth: metadata.batteryHealth as TradeInValuationInput['batteryHealth'],
        accessories: accessories as string[],
      };
      expectedPrice = estimateTradeInPrice(valuationInputs);
      quoteToken = randomBytes(32).toString('base64url');
    }
    if (!Number.isFinite(expectedPrice) || expectedPrice < 0) return NextResponse.json({ error: 'The trade-in estimate is invalid.' }, { status: 400 });

    const id = `TRD-${new Date().getFullYear()}-${crypto.randomUUID()}`;
    const imagePaths: string[] = [];
    for (const [index, file] of files.entries()) {
      const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      const path = `${id}/${index + 1}-${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from('trade-in-photos').upload(path, Buffer.from(await file.arrayBuffer()), {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      imagePaths.push(path);
    }

    const specs = typeof metadata.specs === 'string' ? metadata.specs.trim().slice(0, 1_000) : '';
    const { error } = await supabase.from('trade_in_requests').insert({
      id,
      student_name: studentName,
      phone,
      university,
      item_title: itemTitle,
      category,
      condition,
      specs,
      expected_price: expectedPrice,
      ...(purchaseLinked && valuationInputs && quoteToken ? {
        device_brand: valuationInputs.brand,
        device_model: valuationInputs.model,
        ram: valuationInputs.ram,
        storage: valuationInputs.storage,
        cosmetic_condition: valuationInputs.cosmeticCondition,
        screen_condition: valuationInputs.screenCondition,
        battery_health: valuationInputs.batteryHealth,
        accessories: valuationInputs.accessories,
        valuation_inputs: valuationInputs,
        quote_token_hash: createHash('sha256').update(quoteToken).digest('hex'),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      } : {}),
      image_paths: imagePaths,
      status: 'Pending Review',
      submitted_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({
      id,
      saved: true,
      ...(quoteToken ? { quoteToken, estimatedPrice: expectedPrice, itemTitle } : {}),
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Trade-in submission failed', error);
    return NextResponse.json({ error: 'Unable to save the trade-in request right now.' }, { status: 500 });
  }
}
