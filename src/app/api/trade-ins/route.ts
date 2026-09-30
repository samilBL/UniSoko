import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const MAX_PHOTOS = 3;
const MIN_BYTES = 1_000_000;
const MAX_BYTES = 3_000_000;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: 'Trade-in database is not configured.' }, { status: 503 });

  try {
    const formData = await request.formData();
    const metadata = JSON.parse(String(formData.get('request') || '{}')) as Record<string, unknown>;
    const files = formData.getAll('photos').filter((value): value is File => value instanceof File);
    if (files.length > MAX_PHOTOS) return NextResponse.json({ error: 'Upload up to 3 photos.' }, { status: 400 });
    if (files.some((file) => !ALLOWED_TYPES.has(file.type) || file.size < MIN_BYTES || file.size > MAX_BYTES)) {
      return NextResponse.json({ error: 'Each JPG, PNG, or WebP photo must be between 1 MB and 3 MB.' }, { status: 400 });
    }

    const requiredFields = ['studentName', 'phone', 'university', 'itemTitle', 'category', 'condition'];
    if (requiredFields.some((field) => typeof metadata[field] !== 'string' || !String(metadata[field]).trim())) {
      return NextResponse.json({ error: 'Required trade-in fields are missing.' }, { status: 400 });
    }
    const expectedPrice = Number(metadata.expectedPrice);
    if (!Number.isFinite(expectedPrice) || expectedPrice <= 0) return NextResponse.json({ error: 'Enter a valid expected price.' }, { status: 400 });

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

    const { error } = await supabase.from('trade_in_requests').insert({
      id,
      student_name: String(metadata.studentName).trim(),
      phone: String(metadata.phone).trim(),
      university: String(metadata.university).trim(),
      item_title: String(metadata.itemTitle).trim(),
      category: String(metadata.category),
      condition: String(metadata.condition),
      specs: String(metadata.specs || ''),
      expected_price: expectedPrice,
      image_paths: imagePaths,
      status: 'Pending Review',
      submitted_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ id, saved: true }, { status: 201 });
  } catch (error) {
    console.error('Trade-in submission failed', error);
    return NextResponse.json({ error: 'Unable to save the trade-in request right now.' }, { status: 500 });
  }
}
