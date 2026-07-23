import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import LostItem from '@/models/LostItem';
import { AIService } from '@/lib/ai-service';
import { runReverseMatchingPipeline } from '@/lib/matching-engine';
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
    const dateLost = formData.get('dateLost');
    const file = formData.get('image');

    // --- Validation ---
    if (!itemName || !description) {
      return NextResponse.json({ error: 'Item name and description are required' }, { status: 400 });
    }
    if (description.length > 5000) {
      return NextResponse.json({ error: 'Description is too long (max 5000 chars)' }, { status: 400 });
    }

    // --- Save reference image locally (optional) ---
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
      const mimeType = file.type || 'image/jpeg';
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64Data}`;

      imageUrl = dataUri;
      try {
        const ext = path.extname(file.name).toLowerCase() || '.jpg';
        const filename = `${Date.now()}-lost-${session.user.id}${ext}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, filename), buffer);
        imageUrl = `/uploads/${filename}`;
      } catch (fsError) {
        console.warn('[API] Local disk write unavailable (Vercel serverless). Using Base64 Data URI.');
      }

    }

    // --- Gemini AI: Compile Owner Profile (1 API call) ---
    // Standardize the owner's text description + optional reference image into structured tags
    const aiProfile = await AIService.compileLostProfile(description, itemName, imageUrl);

    if (!aiProfile.success) {
      console.error('[API] AI profile compilation failed:', aiProfile.error);
    }

    await connectDB();

    // --- Save the lost item with AI-standardized profile ---
    const newLostItem = await LostItem.create({
      item_name: itemName.trim(),
      description: description.trim(),
      location: location.trim(),
      image_url: imageUrl,
      date_lost: dateLost ? new Date(dateLost) : new Date(),
      category: aiProfile.success ? aiProfile.category : 'Other',
      ai_profile: aiProfile.success ? {
        item_type: aiProfile.item_type,
        brand: aiProfile.brand,
        primary_color: aiProfile.primary_color,
        secondary_color: aiProfile.secondary_color,
        material: aiProfile.material,
        distinguishing_marks: aiProfile.distinguishing_marks,
        searchable_tags: aiProfile.searchable_tags,
      } : {},
      userId: session.user.id,
      email: session.user.email,
    });

    // --- Run Reverse Matching: Check if any existing FOUND items match ---
    let matchingResult = { matches: [], tier1Count: 0, tier2Count: 0 };
    try {
      matchingResult = await runReverseMatchingPipeline(newLostItem);
    } catch (matchErr) {
      console.error('[API] Reverse matching error (non-fatal):', matchErr);
    }

    return NextResponse.json({
      success: true,
      item: {
        _id: newLostItem._id,
        item_name: newLostItem.item_name,
        description: newLostItem.description,
        category: newLostItem.category,
        location: newLostItem.location,
        image_url: newLostItem.image_url,
        ai_profile: newLostItem.ai_profile,
      },
      matching: {
        matches: matchingResult.matches,
        tier1_candidates: matchingResult.tier1Count,
        tier2_candidates: matchingResult.tier2Count,
        final_matches: matchingResult.matches.length,
      },
      message:
        matchingResult.matches.length > 0
          ? `🎯 Great news! We found ${matchingResult.matches.length} item(s) already in our system that may be yours!`
          : '✅ Lost item reported successfully. We\'ll notify you instantly when a match is found.',
    }, { status: 201 });
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
