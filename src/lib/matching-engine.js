import LostItem from '@/models/LostItem';
import FoundItem from '@/models/FoundItem';
import Match from '@/models/Match';
import { AIService } from '@/lib/ai-service';

/**
 * ────────────────────────────────────────────────────────────────
 *  3-TIER HYBRID MATCHING ENGINE
 * ────────────────────────────────────────────────────────────────
 *
 *  Tier 1: DB Index & Geo Filter        → 0 tokens cost
 *  Tier 2: Tag Similarity Scoring       → 0 tokens cost
 *  Tier 3: Gemini Vision "Judge"        → Only top N candidates
 *
 *  This funnel ensures that out of thousands of items in the DB,
 *  only 3-5 items ever reach the expensive Gemini Vision call.
 * ────────────────────────────────────────────────────────────────
 */

// ── Tier 2 Helper: Compute tag similarity score between two tag arrays ──
function computeTagSimilarity(tagsA, tagsB) {
  if (!tagsA?.length || !tagsB?.length) return 0;

  const setA = new Set(tagsA.map(t => t.toLowerCase().trim()));
  const setB = new Set(tagsB.map(t => t.toLowerCase().trim()));

  let intersectionCount = 0;
  for (const tag of setA) {
    if (setB.has(tag)) intersectionCount++;
  }

  // Jaccard similarity: intersection / union
  const unionCount = new Set([...setA, ...setB]).size;
  if (unionCount === 0) return 0;

  return (intersectionCount / unionCount) * 100;
}

// ── Check if OCR text provides a direct match ──
function checkOCRMatch(foundOCR, lostDescription) {
  if (!foundOCR || foundOCR === 'None' || foundOCR.trim() === '') return false;

  // If any meaningful OCR text appears in the lost description, it's a strong signal
  const ocrWords = foundOCR.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const descLower = lostDescription.toLowerCase();

  let matchedWords = 0;
  for (const word of ocrWords) {
    if (descLower.includes(word)) matchedWords++;
  }

  // If more than half the OCR words match the description, it's a hit
  return ocrWords.length > 0 && matchedWords / ocrWords.length > 0.5;
}


/**
 * Run the full 3-tier matching pipeline for a newly uploaded FOUND item.
 * Called after Gemini analyzes the found item image.
 *
 * @param {Object} foundItem - The newly created FoundItem document (with ai_analysis populated)
 * @returns {Object} { matches: [...], tier1Count, tier2Count }
 */
export async function runMatchingPipeline(foundItem) {
  console.log(`[Matcher] Starting 3-tier pipeline for found item: ${foundItem._id}`);

  const foundTags = foundItem.ai_analysis?.searchable_tags || [];
  const foundCategory = foundItem.category || 'Other';
  const foundOCR = foundItem.ai_analysis?.ocr_text_found || '';

  // ════════════════════════════════════════════════════════
  //  TIER 1: Database Pre-Filter (0 tokens)
  //  - Status must be 'active'
  //  - Category must match (broad filter)
  //  - Lost date must be before or on found date
  // ════════════════════════════════════════════════════════

  const tier1Query = {
    status: 'active',
  };

  // If we have a category, prefer same category, but also include 'Other' as fallback
  if (foundCategory && foundCategory !== 'Other') {
    tier1Query.$or = [
      { category: foundCategory },
      { category: 'Other' },
    ];
  }

  const tier1Candidates = await LostItem.find(tier1Query)
    .sort({ created_at: -1 })
    .limit(200) // Cap at 200 candidates for safety
    .lean();

  console.log(`[Matcher] Tier 1: ${tier1Candidates.length} candidates after DB filter`);

  if (tier1Candidates.length === 0) {
    return { matches: [], tier1Count: 0, tier2Count: 0 };
  }

  // ════════════════════════════════════════════════════════
  //  TIER 2: Tag & Text Similarity Scoring (0 tokens)
  //  - Compute Jaccard similarity between found tags and lost tags
  //  - Bonus points for OCR text matches
  //  - Sort by score, take top 5
  // ════════════════════════════════════════════════════════

  const scoredCandidates = tier1Candidates.map(lostItem => {
    const lostTags = lostItem.ai_profile?.searchable_tags || [];

    // Base tag similarity
    let score = computeTagSimilarity(foundTags, lostTags);

    // OCR boost: if found item has readable text that appears in lost description
    if (checkOCRMatch(foundOCR, lostItem.description || '')) {
      score += 30; // Strong signal
    }

    // Brand match boost
    const foundBrand = (foundItem.ai_analysis?.brand || '').toLowerCase();
    const lostBrand = (lostItem.ai_profile?.brand || '').toLowerCase();
    if (foundBrand && lostBrand && foundBrand !== 'unknown' && lostBrand !== 'unknown') {
      if (foundBrand === lostBrand) {
        score += 15;
      }
    }

    // Color match boost
    const foundColor = (foundItem.ai_analysis?.primary_color || '').toLowerCase();
    const lostColor = (lostItem.ai_profile?.primary_color || '').toLowerCase();
    if (foundColor && lostColor && foundColor === lostColor) {
      score += 10;
    }

    return {
      lostItem,
      tier2Score: Math.min(score, 100), // Cap at 100
    };
  });

  // Sort by score descending and take top 5
  scoredCandidates.sort((a, b) => b.tier2Score - a.tier2Score);
  const tier2Top = scoredCandidates
    .filter(c => c.tier2Score > 10) // At least some similarity needed
    .slice(0, 5);

  console.log(`[Matcher] Tier 2: ${tier2Top.length} candidates after tag similarity (top scores: ${tier2Top.map(c => c.tier2Score.toFixed(1)).join(', ')})`);

  if (tier2Top.length === 0) {
    return { matches: [], tier1Count: tier1Candidates.length, tier2Count: 0 };
  }

  // ════════════════════════════════════════════════════════
  //  TIER 3: Gemini Vision "Judge" (only top candidates)
  //  - Deep multimodal comparison using AI
  //  - Most expensive step, but limited to 3-5 calls
  // ════════════════════════════════════════════════════════

  const finalMatches = [];

  for (const candidate of tier2Top) {
    try {
      const judgeResult = await AIService.judgeMatch(foundItem, candidate.lostItem);

      if (!judgeResult.success) {
        console.warn(`[Matcher] Tier 3 judge failed for lost item ${candidate.lostItem._id}:`, judgeResult.error);
        continue;
      }

      console.log(`[Matcher] Tier 3: Found vs "${candidate.lostItem.item_name}" → ${judgeResult.match_confidence}% confidence`);

      // Only consider matches with confidence > 60%
      if (judgeResult.match_confidence >= 60) {
        // Select a verification question from the found item's secret questions
        const secretQuestions = await FoundItem.findById(foundItem._id)
          .select('+secret_verification_questions')
          .lean();

        const verificationQ = secretQuestions?.secret_verification_questions?.[0] || '';

        const reasoningText = Array.isArray(judgeResult.reasoning)
          ? judgeResult.reasoning.join('\n')
          : (judgeResult.reasoning || '');

        // Create a Match record
        const match = await Match.create({
          foundItemId: foundItem._id,
          lostItemId: candidate.lostItem._id,
          finderId: foundItem.userId,
          ownerId: candidate.lostItem.userId,
          confidence_score: judgeResult.match_confidence,
          ai_reasoning: reasoningText,
          matched_tier: 'tier3',
          verification_status: judgeResult.match_confidence >= 80 ? 'challenge_sent' : 'pending',
          verification_question: verificationQ,
        });

        finalMatches.push({
          matchId: match._id.toString(),
          lostItemId: candidate.lostItem._id.toString(),
          lostItemName: candidate.lostItem.item_name,
          ownerEmail: candidate.lostItem.email,
          confidence: judgeResult.match_confidence,
          reasoning: reasoningText,
          tier2Score: candidate.tier2Score,
        });
      }
    } catch (err) {
      console.error(`[Matcher] Error in Tier 3 for candidate ${candidate.lostItem._id}:`, err);
    }
  }

  console.log(`[Matcher] Pipeline complete: ${finalMatches.length} match(es) found`);

  return {
    matches: finalMatches,
    tier1Count: tier1Candidates.length,
    tier2Count: tier2Top.length,
  };
}


/**
 * Run matching in the REVERSE direction: when a new LOST item is reported,
 * check against existing FOUND items in the database.
 *
 * @param {Object} lostItem - The newly created LostItem document (with ai_profile populated)
 * @returns {Object} { matches: [...], tier1Count, tier2Count }
 */
export async function runReverseMatchingPipeline(lostItem) {
  console.log(`[Matcher] Starting reverse pipeline for lost item: ${lostItem._id}`);

  const lostTags = lostItem.ai_profile?.searchable_tags || [];
  const lostCategory = lostItem.category || 'Other';

  // TIER 1: DB Filter
  const tier1Query = { status: 'active' };
  if (lostCategory && lostCategory !== 'Other') {
    tier1Query.$or = [
      { category: lostCategory },
      { category: 'Other' },
    ];
  }

  const tier1Candidates = await FoundItem.find(tier1Query)
    .sort({ created_at: -1 })
    .limit(200)
    .lean();

  console.log(`[Matcher] Reverse Tier 1: ${tier1Candidates.length} found items after DB filter`);

  if (tier1Candidates.length === 0) {
    return { matches: [], tier1Count: 0, tier2Count: 0 };
  }

  // TIER 2: Tag Similarity
  const scoredCandidates = tier1Candidates.map(foundItem => {
    const foundTags = foundItem.ai_analysis?.searchable_tags || [];
    let score = computeTagSimilarity(lostTags, foundTags);

    const foundOCR = foundItem.ai_analysis?.ocr_text_found || '';
    if (checkOCRMatch(foundOCR, lostItem.description || '')) {
      score += 30;
    }

    const lostBrand = (lostItem.ai_profile?.brand || '').toLowerCase();
    const foundBrand = (foundItem.ai_analysis?.brand || '').toLowerCase();
    if (lostBrand && foundBrand && lostBrand !== 'unknown' && foundBrand !== 'unknown') {
      if (lostBrand === foundBrand) score += 15;
    }

    const lostColor = (lostItem.ai_profile?.primary_color || '').toLowerCase();
    const foundColor = (foundItem.ai_analysis?.primary_color || '').toLowerCase();
    if (lostColor && foundColor && lostColor === foundColor) score += 10;

    return { foundItem, tier2Score: Math.min(score, 100) };
  });

  scoredCandidates.sort((a, b) => b.tier2Score - a.tier2Score);
  const tier2Top = scoredCandidates.filter(c => c.tier2Score > 10).slice(0, 5);

  console.log(`[Matcher] Reverse Tier 2: ${tier2Top.length} candidates`);

  if (tier2Top.length === 0) {
    return { matches: [], tier1Count: tier1Candidates.length, tier2Count: 0 };
  }

  // TIER 3: Gemini Judge
  const finalMatches = [];

  for (const candidate of tier2Top) {
    try {
      const judgeResult = await AIService.judgeMatch(candidate.foundItem, lostItem);

      if (!judgeResult.success) continue;

      console.log(`[Matcher] Reverse Tier 3: "${candidate.foundItem.item_name}" vs Lost "${lostItem.item_name}" → ${judgeResult.match_confidence}%`);

      if (judgeResult.match_confidence >= 60) {
        const secretQuestions = await FoundItem.findById(candidate.foundItem._id)
          .select('+secret_verification_questions')
          .lean();

        const verificationQ = secretQuestions?.secret_verification_questions?.[0] || '';

        const reasoningText = Array.isArray(judgeResult.reasoning)
          ? judgeResult.reasoning.join('\n')
          : (judgeResult.reasoning || '');

        const match = await Match.create({
          foundItemId: candidate.foundItem._id,
          lostItemId: lostItem._id,
          finderId: candidate.foundItem.userId,
          ownerId: lostItem.userId,
          confidence_score: judgeResult.match_confidence,
          ai_reasoning: reasoningText,
          matched_tier: 'tier3',
          verification_status: judgeResult.match_confidence >= 80 ? 'challenge_sent' : 'pending',
          verification_question: verificationQ,
        });

        finalMatches.push({
          matchId: match._id.toString(),
          foundItemId: candidate.foundItem._id.toString(),
          foundItemName: candidate.foundItem.item_name || candidate.foundItem.ai_analysis?.item_type,
          finderEmail: candidate.foundItem.email,
          confidence: judgeResult.match_confidence,
          reasoning: reasoningText,
        });
      }
    } catch (err) {
      console.error(`[Matcher] Error in reverse Tier 3 for candidate ${candidate.foundItem._id}:`, err);
    }
  }

  console.log(`[Matcher] Reverse pipeline complete: ${finalMatches.length} match(es)`);

  return {
    matches: finalMatches,
    tier1Count: tier1Candidates.length,
    tier2Count: tier2Top.length,
  };
}
