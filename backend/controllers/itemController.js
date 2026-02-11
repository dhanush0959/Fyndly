const db = require('../config/database');
const visionService = require('../services/visionService');
const matchingService = require('../services/matchingService');
const fs = require('fs').promises;
const path = require('path');

// Submit found item
exports.submitFoundItem = async (req, res) => {
  try {
    const { itemName, description, location, dateFound } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Move image to permanent storage
    const fileName = `found-${Date.now()}-${req.file.originalname}`;
    const imagePath = path.join(__dirname, '../uploads/found', fileName);
    await fs.rename(req.file.path, imagePath);

    // Image URL for frontend
    const imageUrl = `http://localhost:5000/uploads/found/${fileName}`;

    // Analyze image with Google Vision
    const imageBuffer = await fs.readFile(imagePath);
    const analysis = await visionService.analyzeImage(imageBuffer);

    // Insert found item
    const [result] = await db.query(
      `INSERT INTO found_items 
      (user_id, item_name, description, location, date_found, image_url, detected_objects, detected_text, dominant_colors) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        itemName,
        description,
        location,
        dateFound || new Date().toISOString().split('T')[0],
        imageUrl,
        JSON.stringify(analysis.objects),
        analysis.text,
        JSON.stringify(analysis.colors)
      ]
    );

    const foundItemId = result.insertId;

    // Find matching lost items
    const [lostItems] = await db.query(
      'SELECT * FROM lost_items WHERE status = "active"'
    );

    const foundItem = {
      id: foundItemId,
      item_name: itemName,
      description,
      location,
      date_found: dateFound,
      detected_objects: analysis.objects,
      detected_text: analysis.text
    };

    const matches = await matchingService.findMatches(
      foundItem,
      lostItems.map(item => ({
        ...item,
        detected_objects: JSON.parse(item.detected_objects || '[]'),
        date_lost: item.date_lost
      })),
      50 // 50% threshold
    );

    // Store matches in database
    for (const match of matches) {
      await db.query(
        `INSERT INTO matches 
        (lost_item_id, found_item_id, match_score, object_score, text_score, location_score, time_score) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          match.foundItem.id,
          foundItemId,
          match.totalScore,
          match.objectScore,
          match.textScore,
          match.locationScore,
          match.timeScore
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Found item submitted successfully',
      item: {
        id: foundItemId,
        itemName,
        imageUrl: imageUrl,
        detectedObjects: analysis.objects,
        matchesFound: matches.length
      },
      matches: matches.slice(0, 5) // Return top 5 matches
    });
  } catch (error) {
    console.error('Submit found item error:', error);
    res.status(500).json({ error: 'Failed to submit item: ' + error.message });
  }
};

// Submit lost item
exports.submitLostItem = async (req, res) => {
  try {
    const { itemName, description, location, dateLost } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'Image is required' });
    }

    // Move image to permanent storage
    const fileName = `lost-${Date.now()}-${req.file.originalname}`;
    const imagePath = path.join(__dirname, '../uploads/lost', fileName);
    await fs.rename(req.file.path, imagePath);

    // Image URL for frontend
    const imageUrl = `http://localhost:5000/uploads/lost/${fileName}`;

    // Analyze image with Google Vision
    const imageBuffer = await fs.readFile(imagePath);
    const analysis = await visionService.analyzeImage(imageBuffer);

    // Insert lost item
    const [result] = await db.query(
      `INSERT INTO lost_items 
      (user_id, item_name, description, location, date_lost, image_url, detected_objects, detected_text, dominant_colors) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        itemName,
        description,
        location,
        dateLost || new Date().toISOString().split('T')[0],
        imageUrl,
        JSON.stringify(analysis.objects),
        analysis.text,
        JSON.stringify(analysis.colors)
      ]
    );

    const lostItemId = result.insertId;

    // Find matching found items
    const [foundItems] = await db.query(
      'SELECT * FROM found_items WHERE status = "active"'
    );

    const lostItem = {
      id: lostItemId,
      item_name: itemName,
      description,
      location,
      date_lost: dateLost,
      detected_objects: analysis.objects,
      detected_text: analysis.text
    };

    const matches = await matchingService.findMatches(
      lostItem,
      foundItems.map(item => ({
        ...item,
        detected_objects: JSON.parse(item.detected_objects || '[]'),
        date_found: item.date_found
      })),
      50 // 50% threshold
    );

    // Store matches in database
    for (const match of matches) {
      await db.query(
        `INSERT INTO matches 
        (lost_item_id, found_item_id, match_score, object_score, text_score, location_score, time_score) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          lostItemId,
          match.foundItem.id,
          match.totalScore,
          match.objectScore,
          match.textScore,
          match.locationScore,
          match.timeScore
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Lost item submitted successfully',
      item: {
        id: lostItemId,
        itemName,
        imageUrl: imageUrl,
        detectedObjects: analysis.objects,
        matchesFound: matches.length
      },
      matches: matches.slice(0, 5) // Return top 5 matches
    });
  } catch (error) {
    console.error('Submit lost item error:', error);
    res.status(500).json({ error: 'Failed to submit item: ' + error.message });
  }
};

// Get all lost items
exports.getLostItems = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT l.*, u.name as user_name, u.email as user_email 
       FROM lost_items l 
       JOIN users u ON l.user_id = u.id 
       WHERE l.status = 'active' 
       ORDER BY l.created_at DESC`
    );

    res.json({
      success: true,
      items: items.map(item => ({
        ...item,
        detected_objects: typeof item.detected_objects === 'string' 
          ? JSON.parse(item.detected_objects || '[]') 
          : item.detected_objects || [],
        dominant_colors: typeof item.dominant_colors === 'string'
          ? JSON.parse(item.dominant_colors || '[]')
          : item.dominant_colors || []
      }))
    });
  } catch (error) {
    console.error('Get lost items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

// Get all found items
exports.getFoundItems = async (req, res) => {
  try {
    const [items] = await db.query(
      `SELECT f.*, u.name as user_name, u.email as user_email 
       FROM found_items f 
       JOIN users u ON f.user_id = u.id 
       WHERE f.status = 'active' 
       ORDER BY f.created_at DESC`
    );

    res.json({
      success: true,
      items: items.map(item => ({
        ...item,
        detected_objects: typeof item.detected_objects === 'string'
          ? JSON.parse(item.detected_objects || '[]')
          : item.detected_objects || [],
        dominant_colors: typeof item.dominant_colors === 'string'
          ? JSON.parse(item.dominant_colors || '[]')
          : item.dominant_colors || []
      }))
    });
  } catch (error) {
    console.error('Get found items error:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
};

// Get matches for specific item
exports.getMatches = async (req, res) => {
  try {
    const { itemId, type } = req.params; // type: 'lost' or 'found'

    let query;
    if (type === 'lost') {
      query = `
        SELECT m.*, 
               f.item_name as found_item_name, 
               f.image_url as found_image_url,
               f.description as found_description,
               f.location as found_location
        FROM matches m
        JOIN found_items f ON m.found_item_id = f.id
        WHERE m.lost_item_id = ?
        ORDER BY m.match_score DESC
      `;
    } else {
      query = `
        SELECT m.*, 
               l.item_name as lost_item_name, 
               l.image_url as lost_image_url,
               l.description as lost_description,
               l.location as lost_location
        FROM matches m
        JOIN lost_items l ON m.lost_item_id = l.id
        WHERE m.found_item_id = ?
        ORDER BY m.match_score DESC
      `;
    }

    const [matches] = await db.query(query, [itemId]);

    res.json({
      success: true,
      matches
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};
