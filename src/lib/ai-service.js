import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

// Dynamic client instantiation so process.env.GEMINI_API_KEY is read at runtime
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is missing or invalid in .env.local');
  }
  return new GoogleGenAI({ apiKey });
}

// Configurable model — use env var or default to gemini-flash-latest (active & fast vision model)
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';




// ─── Helper: Read image file or Base64 Data URI and return inline data for Gemini ───
function getImagePart(imagePath) {
  // Handle Base64 Data URIs (e.g., data:image/jpeg;base64,...) for Vercel serverless deployment
  if (typeof imagePath === 'string' && imagePath.startsWith('data:image/')) {
    const matches = imagePath.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (matches) {
      return {
        inlineData: {
          mimeType: matches[1],
          data: matches[2],
        },
      };
    }
  }

  // Handle local disk file path (local development)
  const absolutePath = path.isAbsolute(imagePath)
    ? imagePath
    : path.join(process.cwd(), 'public', imagePath);

  const imageBuffer = fs.readFileSync(absolutePath);
  const base64 = imageBuffer.toString('base64');

  const ext = path.extname(imagePath).toLowerCase();
  const mimeMap = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
  };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  return {
    inlineData: {
      mimeType,
      data: base64,
    },
  };
}


// ─── Helper: Clean Gemini response to parse JSON ───
function parseGeminiJSON(text) {
  // Remove markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

export const AIService = {

  // ═══════════════════════════════════════════════════════════════════
  //  1. ANALYZE FOUND ITEM — Called when a finder uploads an image.
  //     Extracts detailed structured analysis + secret verification Qs.
  //     Cost: 1 Gemini API call per found item upload.
  // ═══════════════════════════════════════════════════════════════════
  async analyzeFoundItem(imageUrl) {
    console.log(`[AI] Analyzing found item image: ${imageUrl}`);

    const imagePart = getImagePart(imageUrl);

    const prompt = `You are an expert lost-and-found item analyst. Carefully analyze this image and identify the MAIN focused object in it.

Generate a thorough, detailed analysis in the following strict JSON format. Be extremely precise about visual details — color shades, brand markings, wear/tear, scratches, dents, stickers, engravings, text, model details, size estimation, material. This description will be used to match with a lost item report, so accuracy matters enormously.

{
  "category": "<broad category: Electronics, Accessories, Documents, Clothing, Bags, Keys, Books, Sports, Personal Items, Other>",
  "item_type": "<specific type: e.g., Wireless Headphones, Leather Wallet, Student ID Card, Car Key>",
  "brand": "<detected brand or 'Unknown'>",
  "primary_color": "<main color>",
  "secondary_color": "<accent/secondary color or 'None'>",
  "material": "<detected material: leather, metal, plastic, fabric, etc. or 'Unknown'>",
  "condition": "<description of wear, scratches, dents, damage, or 'Good condition'>",
  "ocr_text_found": "<any visible text, serial numbers, names, IDs, or 'None'>",
  "human_style_description": "<write a 2-3 sentence natural human description of the item as if you were describing it to someone over the phone — mention color, brand, size, noticeable marks, and anything distinctive>",
  "searchable_tags": ["<tag1>", "<tag2>", "..."],
  "secret_verification_questions": [
    "<question about a subtle/hidden detail only the real owner would know>",
    "<another question about an internal or less obvious feature>",
    "<a third question about something specific like contents, stickers, inscriptions>"
  ]
}

Rules:
- The "searchable_tags" must include the category, item_type, brand, colors, and material as lowercase individual words.
- The "secret_verification_questions" must ask about details that are visible in the image but not immediately obvious — things only the true owner would confidently know (e.g., "What is the lock screen wallpaper?", "What color is the stitching inside the wallet?", "What text is engraved on the back?").
- Return ONLY valid JSON, no additional commentary.`;

    try {
      const response = await getAIClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts: [imagePart, { text: prompt }],
          },
        ],
      });

      const result = parseGeminiJSON(response.text);

      return {
        success: true,
        category: result.category || 'Other',
        item_type: result.item_type || 'Unknown',
        brand: result.brand || 'Unknown',
        primary_color: result.primary_color || '',
        secondary_color: result.secondary_color || 'None',
        material: result.material || 'Unknown',
        condition: result.condition || '',
        ocr_text_found: result.ocr_text_found || 'None',
        human_style_description: result.human_style_description || '',
        searchable_tags: result.searchable_tags || [],
        secret_verification_questions: result.secret_verification_questions || [],
      };
    } catch (error) {
      console.error('[AI] Gemini analyzeFoundItem error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  //  2. COMPILE LOST OWNER PROFILE — Called when an owner reports a lost item.
  //     Standardizes the user's text description (+ optional reference image)
  //     into structured tags for efficient matching.
  //     Cost: 1 Gemini API call per lost item report.
  // ═══════════════════════════════════════════════════════════════════
  async compileLostProfile(description, itemName, imageUrl = null) {
    console.log(`[AI] Compiling lost item profile for: ${itemName}`);

    const parts = [];

    // If the owner uploaded a reference image, include it
    if (imageUrl) {
      try {
        parts.push(getImagePart(imageUrl));
      } catch (err) {
        console.warn('[AI] Could not read reference image, proceeding with text only:', err.message);
      }
    }

    const prompt = `You are an expert at standardizing lost item descriptions for a matching system. 

A user has reported a lost item with the following details:
- Item Name: "${itemName}"
- Description: "${description}"
${imageUrl ? '- A reference image of the item (or similar item) is also attached.' : ''}

Analyze the description${imageUrl ? ' and reference image' : ''} and extract structured features in the following strict JSON format:

{
  "category": "<broad category: Electronics, Accessories, Documents, Clothing, Bags, Keys, Books, Sports, Personal Items, Other>",
  "item_type": "<specific type: e.g., Wireless Headphones, Leather Wallet>",
  "brand": "<mentioned or detected brand, or 'Unknown'>",
  "primary_color": "<main color mentioned>",
  "secondary_color": "<accent/secondary color or 'None'>",
  "material": "<mentioned material or 'Unknown'>",
  "distinguishing_marks": "<any scratches, stickers, dents, engravings, unique features mentioned>",
  "searchable_tags": ["<tag1>", "<tag2>", "..."]
}

Rules:
- Extract every useful detail from the description text. If the user says "my black Nike bag with a red swoosh", tags should include: ["bag", "nike", "black", "red", "swoosh", "backpack", "accessories"].
- The "searchable_tags" must include category, item_type, brand, all colors, material, and any distinguishing keywords as lowercase words.
- Return ONLY valid JSON, no additional text.`;

    parts.push({ text: prompt });

    try {
      const response = await getAIClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      });

      const result = parseGeminiJSON(response.text);

      return {
        success: true,
        category: result.category || 'Other',
        item_type: result.item_type || 'Unknown',
        brand: result.brand || 'Unknown',
        primary_color: result.primary_color || '',
        secondary_color: result.secondary_color || 'None',
        material: result.material || 'Unknown',
        distinguishing_marks: result.distinguishing_marks || '',
        searchable_tags: result.searchable_tags || [],
      };
    } catch (error) {
      console.error('[AI] Gemini compileLostProfile error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  //  3. GEMINI VISION "JUDGE" — Tier 3 deep comparison.
  //     Compares a specific found item against a specific lost report.
  //     Called only on top 3-5 candidates that survive Tier 1 & Tier 2.
  //     Cost: 1 Gemini API call per candidate pair.
  // ═══════════════════════════════════════════════════════════════════
  async judgeMatch(foundItem, lostItem) {
    console.log(`[AI] Judging match: Found "${foundItem.item_name}" vs Lost "${lostItem.item_name}"`);

    const parts = [];

    // Include the found item image
    if (foundItem.image_url) {
      try {
        parts.push(getImagePart(foundItem.image_url));
      } catch (err) {
        console.warn('[AI] Could not read found item image:', err.message);
      }
    }

    // Include the lost item reference image if available
    if (lostItem.image_url) {
      try {
        parts.push(getImagePart(lostItem.image_url));
      } catch (err) {
        console.warn('[AI] Could not read lost item reference image:', err.message);
      }
    }

    const prompt = `You are an expert lost-and-found investigator performing a detailed comparison.

FOUND ITEM (Image A${lostItem.image_url ? ', first image attached' : ''}):
- AI-Detected Type: ${foundItem.ai_analysis?.item_type || foundItem.item_name}
- AI Description: ${foundItem.ai_analysis?.human_style_description || foundItem.description}
- Brand: ${foundItem.ai_analysis?.brand || 'Unknown'}
- Color: ${foundItem.ai_analysis?.primary_color || 'Unknown'}
- Condition: ${foundItem.ai_analysis?.condition || 'Unknown'}
- Location Found: ${foundItem.location}
- OCR Text: ${foundItem.ai_analysis?.ocr_text_found || 'None'}

LOST ITEM REPORT (${lostItem.image_url ? 'Image B, second image attached' : 'Text only'}):
- Item Name: ${lostItem.item_name}
- Owner's Description: ${lostItem.description}
- Brand: ${lostItem.ai_profile?.brand || 'Unknown'}
- Color: ${lostItem.ai_profile?.primary_color || 'Unknown'}
- Distinguishing Marks: ${lostItem.ai_profile?.distinguishing_marks || 'None mentioned'}
- Last Seen Location: ${lostItem.location}

Perform a careful, human-like visual and textual comparison. Consider:
1. Does the item TYPE match? (e.g., both are wallets, both are headphones)
2. Do the COLORS match? (exact shade comparison)
3. Does the BRAND match?
4. Do any UNIQUE MARKS, scratches, stickers, or text match?
5. Is the LOCATION plausible? (same campus, building, area)
6. If both images are provided, do they look like the SAME physical item?

Return your analysis in strict JSON format:

{
  "match_confidence": <number 0-100>,
  "reasoning": "<3-5 bullet points explaining why this is or isn't a match>",
  "type_match": <true/false>,
  "color_match": <true/false>,
  "brand_match": <true/false>,
  "location_plausible": <true/false>
}

Rules:
- Be conservative. Only give confidence > 80 if multiple strong indicators align.
- If item types don't match (e.g., wallet vs phone), confidence must be < 20.
- Return ONLY valid JSON.`;

    parts.push({ text: prompt });

    try {
      const response = await getAIClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      });

      const result = parseGeminiJSON(response.text);

      return {
        success: true,
        match_confidence: result.match_confidence ?? 0,
        reasoning: result.reasoning || '',
        type_match: result.type_match ?? false,
        color_match: result.color_match ?? false,
        brand_match: result.brand_match ?? false,
        location_plausible: result.location_plausible ?? false,
      };
    } catch (error) {
      console.error('[AI] Gemini judgeMatch error:', error);
      return {
        success: false,
        match_confidence: 0,
        error: error.message,
      };
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  //  4. VERIFY OWNERSHIP — Stage 3 anti-fraud challenge evaluation.
  //     Takes the claimant's answer and evaluates against the found image.
  //     Cost: 1 Gemini API call per verification attempt.
  // ═══════════════════════════════════════════════════════════════════
  async verifyOwnership(question, userAnswer, foundItemImageUrl) {
    console.log(`[AI] Verifying ownership answer for question: "${question}"`);

    const parts = [];

    if (foundItemImageUrl) {
      try {
        parts.push(getImagePart(foundItemImageUrl));
      } catch (err) {
        console.warn('[AI] Could not read found item image for verification:', err.message);
      }
    }

    const prompt = `You are a verification expert for a lost-and-found system. A user is claiming ownership of a found item.

The system asked them this verification question (based on the attached image of the found item):
Question: "${question}"

The claimant answered:
Answer: "${userAnswer}"

Look at the image carefully and evaluate whether the claimant's answer is correct or at least reasonably accurate. The claimant may not remember exact details but should demonstrate genuine knowledge of the item.

Return your evaluation in strict JSON format:

{
  "is_correct": <true/false>,
  "confidence": <number 0-100, how confident you are in their ownership>,
  "evaluation": "<brief explanation of why their answer seems correct or incorrect>"
}

Rules:
- Be fair but cautious. Partial correct answers can still pass if they show genuine knowledge.
- If the answer is vague or could apply to any similar item, confidence should be low.
- Return ONLY valid JSON.`;

    parts.push({ text: prompt });

    try {
      const response = await getAIClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
      });

      const result = parseGeminiJSON(response.text);

      return {
        success: true,
        is_correct: result.is_correct ?? false,
        confidence: result.confidence ?? 0,
        evaluation: result.evaluation || '',
      };
    } catch (error) {
      console.error('[AI] Gemini verifyOwnership error:', error);
      return {
        success: false,
        is_correct: false,
        error: error.message,
      };
    }
  },
};
