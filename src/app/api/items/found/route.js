import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import FoundItem from '@/models/FoundItem';
import LostItem from '@/models/LostItem';
import { AIService } from '@/lib/ai-service';
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
    const file = formData.get('image');
    const location = formData.get('location') || 'Unknown';

    if (!file || !file.name || file.size === 0) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 10MB' }, { status: 400 });
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 });
    }

    // --- Save image locally ---
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = path.extname(file.name).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-found-${session.user.id}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    const imageUrl = `/uploads/${filename}`;

    // --- AI Analysis ---
    const aiAnalysis = await AIService.analyzeFoundItem(imageUrl);

    await connectDB();

    const newFoundItem = await FoundItem.create({
      item_name: aiAnalysis.category,
      description: aiAnalysis.description,
      location: location.trim(),
      image_url: imageUrl,
      userId: session.user.id,
      email: session.user.email,
      detected_objects: aiAnalysis.keywords.map((k) => ({ name: k })),
    });

    // --- Automated Matching ---
    const lostItems = await LostItem.find({ status: 'active' }).lean();
    const matchesFound = [];

    for (const lostItem of lostItems) {
      const verification = await AIService.verifyMatch(lostItem.description, newFoundItem.image_url);
      if (verification.isMatch) {
        matchesFound.push({
          lostItemId: lostItem._id.toString(),
          foundItemId: newFoundItem._id.toString(),
          confidence: verification.confidenceScore,
          reasoning: verification.reasoning,
          lostItemEmail: lostItem.email,
        });
        console.log(`[MATCH] Notify ${lostItem.email} — their lost item may have been found.`);
      }
    }

    return NextResponse.json({
      success: true,
      item: newFoundItem,
      matches: matchesFound,
      message:
        matchesFound.length > 0
          ? `Matched with ${matchesFound.length} lost item(s)!`
          : 'Item saved. No matches found yet.',
    });
  } catch (error) {
    console.error('Found item POST error:', error);
    return NextResponse.json({ error: 'Failed to process found item' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const items = await FoundItem.find({ status: 'active' })
      .sort({ created_at: -1 })
      .lean();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Found item GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch found items' }, { status: 500 });
  }
}
