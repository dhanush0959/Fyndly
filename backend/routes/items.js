const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

// POST /api/items/found - Submit found item
router.post('/found', auth, upload.single('image'), itemController.submitFoundItem);

// POST /api/items/lost - Submit lost item
router.post('/lost', auth, upload.single('image'), itemController.submitLostItem);

// GET /api/items/lost - Get all lost items
router.get('/lost', itemController.getLostItems);

// GET /api/items/found - Get all found items
router.get('/found', itemController.getFoundItems);

// GET /api/items/matches/:type/:itemId - Get matches for item
router.get('/matches/:type/:itemId', auth, itemController.getMatches);

module.exports = router;
