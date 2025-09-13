const express = require('express');
const multer = require('multer');
const path = require('path');
const Joi = require('joi');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/collector-data/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and JSON data are allowed'));
    }
  }
});

// GPS location validation schema
const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  accuracy: Joi.number().min(0).optional(),
  timestamp: Joi.string().isoDate().required()
});

// Collection data schema for mobile app
const mobileCollectionSchema = Joi.object({
  collectorId: Joi.string().required(),
  species: Joi.string().required(),
  location: locationSchema.required(),
  harvestZoneId: Joi.string().required(),
  qualityMetrics: Joi.object({
    moisture: Joi.number().min(0).max(100).required(),
    weight: Joi.number().min(0).required(),
    grade: Joi.string().valid('A', 'B', 'C', 'D').required(),
    visualQuality: Joi.string().optional(),
    notes: Joi.string().max(500).optional()
  }).required(),
  images: Joi.array().items(Joi.string()).optional(),
  offline: Joi.boolean().default(false),
  syncTimestamp: Joi.string().isoDate().optional()
});

// Register new collector
router.post('/register', async (req, res) => {
  try {
    const { name, phone, email, cooperativeId, gpsEnabled } = req.body;
    
    if (!name || !phone || !cooperativeId) {
      return res.status(400).json({ error: 'Name, phone, and cooperative ID are required' });
    }

    const collectorId = `COL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store collector registration (in a real implementation, this would go to a database)
    const collector = {
      id: collectorId,
      name,
      phone,
      email,
      cooperativeId,
      gpsEnabled,
      registrationDate: new Date().toISOString(),
      status: 'active'
    };

    req.app.locals.logger.info(`New collector registered: ${collectorId}`);
    
    res.status(201).json({
      success: true,
      collector,
      message: 'Collector registered successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error registering collector:', error);
    res.status(500).json({
      error: 'Failed to register collector',
      details: error.message
    });
  }
});

// Submit collection data from mobile app
router.post('/collect', upload.array('images', 5), async (req, res) => {
  try {
    const { error, value } = mobileCollectionSchema.validate(JSON.parse(req.body.data || '{}'));
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const fabricClient = req.app.locals.fabricClient;
    
    // Create collection event on blockchain
    const eventId = await fabricClient.createCollectionEvent(
      value.collectorId,
      value.species,
      value.location.latitude,
      value.location.longitude,
      value.harvestZoneId,
      value.qualityMetrics.moisture,
      value.qualityMetrics.weight,
      value.qualityMetrics.grade
    );

    // Store image references if any
    const imageUrls = req.files ? req.files.map(file => `/uploads/collector-data/${file.filename}`) : [];

    // Log collection data
    const collectionData = {
      eventId,
      collectorId: value.collectorId,
      species: value.species,
      location: value.location,
      qualityMetrics: value.qualityMetrics,
      images: imageUrls,
      timestamp: new Date().toISOString(),
      offline: value.offline || false
    };

    req.app.locals.logger.info(`Collection data submitted: ${eventId}`);

    // Emit real-time update
    req.app.locals.io.emit('mobile-collection-submitted', collectionData);

    res.status(201).json({
      success: true,
      eventId,
      collectionData,
      message: 'Collection data submitted successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error submitting collection data:', error);
    res.status(500).json({
      error: 'Failed to submit collection data',
      details: error.message
    });
  }
});

// Sync offline data
router.post('/sync', async (req, res) => {
  try {
    const { collectorId, offlineData } = req.body;
    
    if (!collectorId || !Array.isArray(offlineData)) {
      return res.status(400).json({ error: 'Collector ID and offline data array are required' });
    }

    const results = [];
    const fabricClient = req.app.locals.fabricClient;

    // Process each offline collection record
    for (const data of offlineData) {
      try {
        const { error, value } = mobileCollectionSchema.validate(data);
        if (error) {
          results.push({
            localId: data.localId || 'unknown',
            success: false,
            error: error.details[0].message
          });
          continue;
        }

        const eventId = await fabricClient.createCollectionEvent(
          value.collectorId,
          value.species,
          value.location.latitude,
          value.location.longitude,
          value.harvestZoneId,
          value.qualityMetrics.moisture,
          value.qualityMetrics.weight,
          value.qualityMetrics.grade
        );

        results.push({
          localId: data.localId || 'unknown',
          success: true,
          eventId
        });

      } catch (syncError) {
        results.push({
          localId: data.localId || 'unknown',
          success: false,
          error: syncError.message
        });
      }
    }

    req.app.locals.logger.info(`Synced ${results.filter(r => r.success).length}/${offlineData.length} records for collector ${collectorId}`);

    // Emit sync completion
    req.app.locals.io.emit('offline-data-synced', {
      collectorId,
      syncedCount: results.filter(r => r.success).length,
      totalCount: offlineData.length,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      results,
      message: `Synced ${results.filter(r => r.success).length}/${offlineData.length} records`
    });

  } catch (error) {
    req.app.locals.logger.error('Error syncing offline data:', error);
    res.status(500).json({
      error: 'Failed to sync offline data',
      details: error.message
    });
  }
});

// Get collector profile
router.get('/profile/:collectorId', async (req, res) => {
  try {
    const { collectorId } = req.params;
    const fabricClient = req.app.locals.fabricClient;
    
    // Get collector's collection history
    const collections = await fabricClient.queryByCollector(collectorId);
    
    // Calculate statistics
    const stats = {
      totalCollections: collections.length,
      speciesCollected: [...new Set(collections.map(c => c.species))].length,
      totalWeight: collections.reduce((sum, c) => sum + c.initialQualityMetrics.weight, 0),
      lastCollection: collections.length > 0 ? collections[collections.length - 1].timestamp : null
    };

    res.status(200).json({
      success: true,
      collectorId,
      collections,
      stats
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting collector profile:', error);
    res.status(500).json({
      error: 'Failed to get collector profile',
      details: error.message
    });
  }
});

// Get harvest zones for mobile app
router.get('/harvest-zones', async (req, res) => {
  try {
    // Return predefined harvest zones for mobile app
    const zones = [
      {
        id: 'ZONE_001',
        name: 'Western Ghats Ashwagandha Zone',
        center: { latitude: 15.2993, longitude: 74.1240 },
        radius: 5000, // meters
        approvedSpecies: ['Withania somnifera', 'Asparagus racemosus'],
        active: true
      }
    ];

    res.status(200).json({
      success: true,
      zones
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting harvest zones:', error);
    res.status(500).json({
      error: 'Failed to get harvest zones',
      details: error.message
    });
  }
});

// SMS webhook for SMS-over-blockchain gateway
router.post('/sms-webhook', async (req, res) => {
  try {
    const { from, body } = req.body;
    
    // Parse SMS format: "COLLECT,species,latitude,longitude,weight,grade"
    const parts = body.toUpperCase().split(',');
    
    if (parts[0] !== 'COLLECT' || parts.length < 6) {
      return res.status(400).json({ error: 'Invalid SMS format' });
    }

    const [, species, latitude, longitude, weight, grade] = parts;
    
    // Validate GPS coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const wt = parseFloat(weight);
    
    if (isNaN(lat) || isNaN(lng) || isNaN(wt)) {
      return res.status(400).json({ error: 'Invalid numeric values' });
    }

    const fabricClient = req.app.locals.fabricClient;
    
    // Create collection event via SMS
    const eventId = await fabricClient.createCollectionEvent(
      `SMS_${from}`,
      species,
      lat,
      lng,
      'ZONE_001', // Default zone
      15, // Default moisture
      wt,
      grade || 'B'
    );

    req.app.locals.logger.info(`SMS collection event created: ${eventId} from ${from}`);

    res.status(200).json({
      success: true,
      eventId,
      message: 'Collection recorded via SMS'
    });

  } catch (error) {
    req.app.locals.logger.error('Error processing SMS webhook:', error);
    res.status(500).json({
      error: 'Failed to process SMS collection',
      details: error.message
    });
  }
});

module.exports = router;