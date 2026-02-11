const vision = require('@google-cloud/vision');
require('dotenv').config();

// Create a client
const client = new vision.ImageAnnotatorClient({
  apiKey: process.env.GOOGLE_CLOUD_API_KEY || undefined,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

/**
 * Analyze image using Google Cloud Vision API
 */
async function analyzeImage(imageBuffer) {
  try {
    // Perform multiple detections
    const [result] = await client.annotateImage({
      image: { content: imageBuffer },
      features: [
        { type: 'LABEL_DETECTION', maxResults: 20 },
        { type: 'TEXT_DETECTION', maxResults: 10 },
        { type: 'IMAGE_PROPERTIES', maxResults: 10 },
        { type: 'OBJECT_LOCALIZATION', maxResults: 20 }
      ]
    });

    // Extract labels (objects)
    const labels = result.labelAnnotations?.map(label => ({
      description: label.description.toLowerCase(),
      score: label.score,
      confidence: Math.round(label.score * 100)
    })) || [];

    // Extract objects
    const objects = result.localizedObjectAnnotations?.map(obj => ({
      name: obj.name.toLowerCase(),
      score: obj.score,
      confidence: Math.round(obj.score * 100)
    })) || [];

    // Combine labels and objects, remove duplicates
    const allObjects = [...labels, ...objects];
    const uniqueObjects = Array.from(
      new Map(allObjects.map(item => [item.description || item.name, item])).values()
    );

    // Extract text
    const textAnnotations = result.textAnnotations || [];
    const detectedText = textAnnotations.length > 0 
      ? textAnnotations[0].description.toLowerCase() 
      : '';

    // Extract dominant colors
    const colors = result.imagePropertiesAnnotation?.dominantColors?.colors?.slice(0, 5).map(color => ({
      red: Math.round(color.color.red || 0),
      green: Math.round(color.color.green || 0),
      blue: Math.round(color.color.blue || 0),
      score: color.score,
      pixelFraction: color.pixelFraction
    })) || [];

    return {
      objects: uniqueObjects,
      text: detectedText,
      colors: colors,
      raw: result
    };
  } catch (error) {
    console.error('Vision API Error:', error);
    throw new Error('Failed to analyze image: ' + error.message);
  }
}

/**
 * Extract just objects from image
 */
async function detectObjects(imageBuffer) {
  try {
    const analysis = await analyzeImage(imageBuffer);
    return analysis.objects;
  } catch (error) {
    console.error('Object Detection Error:', error);
    throw error;
  }
}

module.exports = {
  analyzeImage,
  detectObjects
};
