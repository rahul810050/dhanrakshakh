// app/api/ocr/route.ts
import { NextRequest, NextResponse } from 'next/server';
import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GEMINI_API_KEY ||'service-account.json', // 🔐 Update path or use env var
});

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get('file') as File;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const [result] = await client.textDetection({ image: { content: uint8Array } });
  const text = result.textAnnotations?.[0]?.description || '';

  return NextResponse.json({ text });
}

export const dynamic = 'force-dynamic';
