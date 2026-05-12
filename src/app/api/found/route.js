import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { AIService } from '@/lib/ai-service';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    const userEmail = formData.get('email') || 'finder@example.com';
    
    if (!file) {
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
      imageUrl,
      email: userEmail,
      category: aiAnalysis.category,
      aiGeneratedDescription: aiAnalysis.description,
      keywords: aiAnalysis.keywords,
      dateReported: new Date().toISOString()
    };

    const db = readDB();
    db.foundItems.push(newFoundItem);

    // 2. Automated Matching Process
    // Find potential lost items in the same category
    const potentialMatches = db.lostItems.filter(item => 
      item.category === newFoundItem.category || !item.category
    );

    const matchesFound = [];

    for (const lostItem of potentialMatches) {
      // 3. AI verifying if it's the exact same item
      const verification = await AIService.verifyMatch(lostItem.description, newFoundItem.imageUrl);
      
      if (verification.isMatch) {
        const matchRecord = {
          id: `match_${Date.now()}`,
          lostItemId: lostItem.id,
          foundItemId: newFoundItem.id,
          confidence: verification.confidenceScore,
          reasoning: verification.reasoning,
          dateMatched: new Date().toISOString()
        };
        db.matches.push(matchRecord);
        matchesFound.push(matchRecord);
        
        // In a real app, send email via Nodemailer here
        console.log(`[EMAIL NOTIFICATION] Match found! Sending email to ${lostItem.email} and ${newFoundItem.email}`);
      }
    }

    writeDB(db);

    return NextResponse.json({ 
      success: true, 
      item: newFoundItem,
      matches: matchesFound,
      message: matchesFound.length > 0 ? `Item saved and matched with ${matchesFound.length} lost items!` : 'Item saved. No matches found yet.'
    });

  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Failed to process found item' }, { status: 500 });
  }
}
