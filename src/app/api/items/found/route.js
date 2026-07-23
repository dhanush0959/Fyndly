import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import FoundItem from '@/models/FoundItem';
import { AIService } from '@/lib/ai-service';
import { runMatchingPipeline } from '@/lib/matching-engine';
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

    // --- Validate image ---
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

    // --- Process image (Supports Vercel serverless + local development) ---
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || 'image/jpeg';
    const base64Data = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    let imageUrl = dataUri;
    try {
      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const filename = `${Date.now()}-found-${session.user.id}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      imageUrl = `/uploads/${filename}`;
    } catch (fsError) {
      console.warn('[API] Local disk write unavailable (Vercel serverless). Using Base64 Data URI.');
    }


    // --- Gemini AI Analysis (1 API call) ---
    const aiAnalysis = await AIService.analyzeFoundItem(imageUrl);

    if (!aiAnalysis.success) {
      // Save item without AI data if Gemini fails
      console.error('[API] AI analysis failed, saving with defaults:', aiAnalysis.error);
    }

    await connectDB();

    // --- Save the found item with AI-extracted metadata ---
    const newFoundItem = await FoundItem.create({
      item_name: aiAnalysis.success ? aiAnalysis.item_type : 'Unknown Item',
      description: aiAnalysis.success ? aiAnalysis.human_style_description : '',
      category: aiAnalysis.success ? aiAnalysis.category : 'Other',
      ai_analysis: aiAnalysis.success ? {
        item_type: aiAnalysis.item_type,
        brand: aiAnalysis.brand,
        primary_color: aiAnalysis.primary_color,
        secondary_color: aiAnalysis.secondary_color,
        material: aiAnalysis.material,
        condition: aiAnalysis.condition,
        ocr_text_found: aiAnalysis.ocr_text_found,
        human_style_description: aiAnalysis.human_style_description,
        searchable_tags: aiAnalysis.searchable_tags,
      } : {},
      secret_verification_questions: aiAnalysis.success
        ? aiAnalysis.secret_verification_questions
        : [],
      location: location.trim(),
      image_url: imageUrl,
      userId: session.user.id,
      email: session.user.email,
    });

    // --- Run the 3-Tier Matching Pipeline ---
    let matchingResult = { matches: [], tier1Count: 0, tier2Count: 0 };
    try {
      matchingResult = await runMatchingPipeline(newFoundItem);
    } catch (matchErr) {
      console.error('[API] Matching pipeline error (non-fatal):', matchErr);
    }

    return NextResponse.json({
      success: true,
      item: {
        _id: newFoundItem._id,
        item_name: newFoundItem.item_name,
        description: newFoundItem.description,
        category: newFoundItem.category,
        location: newFoundItem.location,
        image_url: newFoundItem.image_url,
        ai_analysis: newFoundItem.ai_analysis,
      },
      matching: {
        matches: matchingResult.matches,
        tier1_candidates: matchingResult.tier1Count,
        tier2_candidates: matchingResult.tier2Count,
        final_matches: matchingResult.matches.length,
      },
      message:
        matchingResult.matches.length > 0
          ? `🎯 Found ${matchingResult.matches.length} potential match(es)! The owner(s) will be notified.`
          : '✅ Item analyzed and saved. No matches found yet — we\'ll keep searching as new lost reports come in.',
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
