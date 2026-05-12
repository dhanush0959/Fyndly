// This is a Mock AI Service. 
// When you get your Google Vision or OpenAI API keys, you can replace the logic in these functions 
// with actual API calls (e.g., using the `openai` npm package).

export const AIService = {
  /**
   * Analyzes an image and returns a description, category, and key features.
   * In a real app, you would send the image buffer or URL to GPT-4o-Vision or Google Cloud Vision.
   */
  async analyzeFoundItem(imageUrl) {
    console.log(`[AI Mock] Analyzing image: ${imageUrl}...`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response
    return {
      category: "Accessories",
      description: "A set of metallic bike keys attached to a colorful Tom and Jerry character keychain.",
      keywords: ["keys", "bike", "tom and jerry", "keychain", "metal", "cartoon"],
    };
  },

  /**
   * Compares two images (or an image and a description) to verify if they are the exact same item.
   * In a real app, you would send both images to GPT-4o-Vision asking "Are these the exact same item?".
   */
  async verifyMatch(lostItemDescription, foundItemImageUrl) {
    console.log(`[AI Mock] Verifying match between description "${lostItemDescription}" and image "${foundItemImageUrl}"...`);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simple mock logic: if the lost description contains "keys" or "tom", say it's a match.
    const isMatch = lostItemDescription.toLowerCase().includes('keys') || 
                    lostItemDescription.toLowerCase().includes('tom');
    
    return {
      isMatch,
      confidenceScore: isMatch ? 0.95 : 0.12,
      reasoning: isMatch 
        ? "The found image clearly shows bike keys with a Tom and Jerry keychain, perfectly matching the user's lost item description."
        : "The found item does not visually match the description provided for the lost item."
    };
  }
};
