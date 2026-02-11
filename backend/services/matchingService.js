/**
 * Calculate Jaccard similarity between two arrays
 */
function jaccardSimilarity(arr1, arr2) {
  const set1 = new Set(arr1.map(item => item.toLowerCase()));
  const set2 = new Set(arr2.map(item => item.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Calculate object similarity score (40% weight)
 */
function calculateObjectScore(lostObjects, foundObjects) {
  if (!lostObjects || !foundObjects || lostObjects.length === 0 || foundObjects.length === 0) {
    return 0;
  }

  // Extract object names/descriptions
  const lostNames = lostObjects.map(obj => obj.description || obj.name);
  const foundNames = foundObjects.map(obj => obj.description || obj.name);
  
  // Calculate Jaccard similarity
  const similarity = jaccardSimilarity(lostNames, foundNames);
  
  // Boost score if high-confidence objects match
  let boost = 0;
  for (const lostObj of lostObjects) {
    for (const foundObj of foundObjects) {
      const lostName = (lostObj.description || lostObj.name).toLowerCase();
      const foundName = (foundObj.description || foundObj.name).toLowerCase();
      
      if (lostName === foundName) {
        const avgConfidence = ((lostObj.confidence || 0) + (foundObj.confidence || 0)) / 2;
        if (avgConfidence > 80) {
          boost += 0.1;
        }
      }
    }
  }
  
  return Math.min((similarity + boost) * 100, 100);
}

/**
 * Calculate text similarity score (30% weight)
 */
function calculateTextScore(lostText, foundText, lostDesc, foundDesc) {
  if (!lostText && !foundText && !lostDesc && !foundDesc) {
    return 0;
  }

  // Combine detected text with descriptions
  const lostContent = `${lostText || ''} ${lostDesc || ''}`.toLowerCase();
  const foundContent = `${foundText || ''} ${foundDesc || ''}`.toLowerCase();
  
  if (!lostContent.trim() || !foundContent.trim()) {
    return 0;
  }

  // Split into words
  const lostWords = lostContent.match(/\b\w+\b/g) || [];
  const foundWords = foundContent.match(/\b\w+\b/g) || [];
  
  // Calculate Jaccard similarity
  const similarity = jaccardSimilarity(lostWords, foundWords);
  
  return similarity * 100;
}

/**
 * Calculate location similarity score (20% weight)
 */
function calculateLocationScore(lostLocation, foundLocation) {
  if (!lostLocation || !foundLocation) {
    return 50; // Neutral score if location missing
  }

  const lost = lostLocation.toLowerCase();
  const found = foundLocation.toLowerCase();
  
  // Exact match
  if (lost === found) {
    return 100;
  }
  
  // Partial match
  const lostWords = lost.split(/\s+/);
  const foundWords = found.split(/\s+/);
  const similarity = jaccardSimilarity(lostWords, foundWords);
  
  return similarity * 100;
}

/**
 * Calculate time proximity score (10% weight)
 */
function calculateTimeScore(lostDate, foundDate) {
  if (!lostDate || !foundDate) {
    return 50; // Neutral score if date missing
  }

  const lost = new Date(lostDate);
  const found = new Date(foundDate);
  
  // Calculate days difference
  const diffTime = Math.abs(found - lost);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Score decreases with time difference
  if (diffDays === 0) return 100;
  if (diffDays === 1) return 90;
  if (diffDays <= 3) return 80;
  if (diffDays <= 7) return 70;
  if (diffDays <= 14) return 60;
  if (diffDays <= 30) return 50;
  if (diffDays <= 60) return 40;
  return 30;
}

/**
 * Calculate overall match score with weighted components
 */
function calculateMatchScore(lostItem, foundItem) {
  // Component scores
  const objectScore = calculateObjectScore(
    lostItem.detected_objects,
    foundItem.detected_objects
  );
  
  const textScore = calculateTextScore(
    lostItem.detected_text,
    foundItem.detected_text,
    lostItem.description,
    foundItem.description
  );
  
  const locationScore = calculateLocationScore(
    lostItem.location,
    foundItem.location
  );
  
  const timeScore = calculateTimeScore(
    lostItem.date_lost,
    foundItem.date_found
  );
  
  // Weighted total: 40% objects, 30% text, 20% location, 10% time
  const totalScore = (
    objectScore * 0.40 +
    textScore * 0.30 +
    locationScore * 0.20 +
    timeScore * 0.10
  );
  
  return {
    totalScore: Math.round(totalScore * 100) / 100,
    objectScore: Math.round(objectScore * 100) / 100,
    textScore: Math.round(textScore * 100) / 100,
    locationScore: Math.round(locationScore * 100) / 100,
    timeScore: Math.round(timeScore * 100) / 100
  };
}

/**
 * Find potential matches for a lost item
 */
async function findMatches(lostItem, foundItems, threshold = 50) {
  const matches = [];
  
  for (const foundItem of foundItems) {
    const scores = calculateMatchScore(lostItem, foundItem);
    
    if (scores.totalScore >= threshold) {
      matches.push({
        foundItem: foundItem,
        ...scores
      });
    }
  }
  
  // Sort by total score descending
  matches.sort((a, b) => b.totalScore - a.totalScore);
  
  return matches;
}

module.exports = {
  calculateMatchScore,
  findMatches,
  calculateObjectScore,
  calculateTextScore,
  calculateLocationScore,
  calculateTimeScore
};
