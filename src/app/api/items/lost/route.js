import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import LostItem from '@/models/LostItem';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    // --- Auth check ---
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const formData = await request.formData();
    const itemName = formData.get('itemName');
    const description = formData.get('description');
    const location = formData.get('location') || 'Unknown';
    const file = formData.get('image');

    // --- Validation ---
    if (!itemName || !description) {
      return NextResponse.json({ error: 'Item name and description are required' }, { status: 400 });
    }
    if (description.length > 2000) {
      return NextResponse.json({ error: 'Description is too long (max 2000 chars)' }, { status: 400 });
    }

    // --- Save image locally (upgrade to cloud storage for production) ---
    let imageUrl = null;
    if (file && file.name && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const filename = `${Date.now()}-lost-${session.user.id}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      imageUrl = `/uploads/${filename}`;
    }

    await connectDB();

    const newLostItem = await LostItem.create({
      item_name: itemName.trim(),
      description: description.trim(),
      location: location.trim(),
      image_url: imageUrl,
      userId: session.user.id,
      email: session.user.email,
      detected_objects: [],
    });

    return NextResponse.json({ success: true, item: newLostItem, matchesFound: 0 }, { status: 201 });
  } catch (error) {
    console.error('Lost item POST error:', error);
    return NextResponse.json({ error: 'Failed to report lost item' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const items = await LostItem.find({ status: 'active' })
      .sort({ created_at: -1 })
      .lean();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Lost item GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch lost items' }, { status: 500 });
  }
}
