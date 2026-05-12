import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const itemName = formData.get('itemName') || 'Unknown';
    const description = formData.get('description');
    const location = formData.get('location') || 'Unknown';
    const userEmail = 'loser@example.com';
    const file = formData.get('image');
    
    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    let imageUrl = null;
    if (file && file !== 'undefined' && file.name) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = Date.now() + '-lost-' + file.name.replaceAll(' ', '_');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      imageUrl = `/uploads/${filename}`;
    }

    const newLostItem = {
      id: Date.now().toString(),
      item_name: itemName,
      description,
      location,
      image_url: imageUrl,
      email: userEmail,
      created_at: new Date().toISOString(),
      detected_objects: [] // Added for Gallery mapping
    };

    const db = readDB();
    db.lostItems.push(newLostItem);
    writeDB(db);

    return NextResponse.json({ success: true, item: newLostItem, matchesFound: 0 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process lost item' }, { status: 500 });
  }
}

export async function GET() {
  const db = readDB();
  return NextResponse.json({ success: true, items: db.lostItems || [] });
}
