import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { AIService } from '@/lib/ai-service';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    // For FoundForm in the old UI, it sends location, description as well but we don't care because AI will generate it
    
    if (!file || file === 'undefined') {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Save image locally
    const buffer = Buffer.from(await file.arrayBuffer());
    const filename = Date.now() + '-' + file.name.replaceAll(' ', '_');
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    
    const imageUrl = `/uploads/${filename}`;

    // 1. AI generating description from image
    const aiAnalysis = await AIService.analyzeFoundItem(imageUrl);

    const newFoundItem = {
      id: Date.now().toString(),
      item_name: aiAnalysis.category, // Map to old UI format
      description: aiAnalysis.description,
      location: formData.get('location') || 'Unknown',
      image_url: imageUrl,
      email: 'finder@example.com',
      created_at: new Date().toISOString(),
      detected_objects: aiAnalysis.keywords.map(k => ({ name: k })) // Old UI format
    };

    const db = readDB();
    db.foundItems.push(newFoundItem);

    // 2. Automated Matching Process
    const potentialMatches = db.lostItems || [];
    const matchesFound = [];

    for (const lostItem of potentialMatches) {
      // 3. AI verifying if it's the exact same item
      const verification = await AIService.verifyMatch(lostItem.description, newFoundItem.image_url);
      
      if (verification.isMatch) {
        matchesFound.push({
          lostItemId: lostItem.id,
          foundItemId: newFoundItem.id,
          confidence: verification.confidenceScore
        });
      }
    }

    writeDB(db);

    return NextResponse.json({ 
      success: true, 
      item: newFoundItem,
      matches: matchesFound,
      message: matchesFound.length > 0 ? `Matched with ${matchesFound.length} lost items!` : 'Item saved.'
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process found item' }, { status: 500 });
  }
}

export async function GET() {
  const db = readDB();
  return NextResponse.json({ success: true, items: db.foundItems || [] });
}
