const express = require('express');
const multer = require('multer');
const path = require('path');
const Joi = require('joi');
const router = express.Router();

// Configure multer for lab certificate uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/certificates/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed for certificates'));
    }
  }
});

// Quality test submission schema
const qualityTestSubmissionSchema = Joi.object({
  batchId: Joi.string().required(),
  testType: Joi.string().valid('MOISTURE', 'PESTICIDE', 'DNA_BARCODE', 'HEAVY_METALS', 'MICROBIOLOGICAL').required(),
  labId: Joi.string().required(),
  testDate: Joi.string().isoDate().required(),
  results: Joi.object({
    value: Joi.number().required(),
    unit: Joi.string().required(),
    threshold: Joi.number().required(),
    method: Joi.string().required(),
    equipment: Joi.string().optional(),
    operator: Joi.string().required()
  }).required(),
  validUntil: Joi.string().isoDate().required(),
  accreditation: Joi.string().optional(),
  notes: Joi.string().max(1000).optional()
});

// Submit quality test results
router.post('/submit-test', upload.single('certificate'), async (req, res) => {
  try {
    const { error, value } = qualityTestSubmissionSchema.validate(JSON.parse(req.body.data || '{}'));
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Certificate file is required' });
    }

    const certificatePath = `/uploads/certificates/${req.file.filename}`;
    const fabricClient = req.app.locals.fabricClient;
    
    // Submit quality test to blockchain
    const testId = await fabricClient.addQualityTest(
      value.batchId,
      value.testType,
      value.labId,
      value.results.value,
      value.results.unit,
      value.results.threshold,
      certificatePath,
      value.validUntil
    );

    const testData = {
      testId,
      batchId: value.batchId,
      testType: value.testType,
      labId: value.labId,
      testDate: value.testDate,
      results: value.results,
      certificatePath,
      validUntil: value.validUntil,
      passed: value.results.value <= value.results.threshold,
      submissionTimestamp: new Date().toISOString()
    };

    req.app.locals.logger.info(`Quality test submitted: ${testId} by lab ${value.labId}`);

    // Emit real-time update
    req.app.locals.io.emit('quality-test-submitted', testData);

    res.status(201).json({
      success: true,
      testId,
      testData,
      message: 'Quality test submitted successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error submitting quality test:', error);
    res.status(500).json({
      error: 'Failed to submit quality test',
      details: error.message
    });
  }
});

// Get quality standards and thresholds
router.get('/standards/:species?', async (req, res) => {
  try {
    const { species } = req.params;
    
    // Return quality standards based on AYUSH Ministry guidelines
    const standards = {
      'Withania somnifera': {
        moisture: { max: 12, unit: '%', method: 'Oven drying at 105°C' },
        pesticides: { max: 0.5, unit: 'ppm', method: 'GC-MS analysis' },
        heavy_metals: {
          lead: { max: 10, unit: 'ppm', method: 'ICP-MS' },
          cadmium: { max: 0.3, unit: 'ppm', method: 'ICP-MS' },
          mercury: { max: 1, unit: 'ppm', method: 'ICP-MS' },
          arsenic: { max: 3, unit: 'ppm', method: 'ICP-MS' }
        },
        microbiological: {
          total_plate_count: { max: 100000, unit: 'cfu/g', method: 'Plate count' },
          yeast_mold: { max: 1000, unit: 'cfu/g', method: 'Plate count' },
          enterobacteria: { max: 1000, unit: 'cfu/g', method: 'Plate count' }
        },
        active_compounds: {
          withanolides: { min: 0.3, unit: '%', method: 'HPLC analysis' }
        }
      },
      'Asparagus racemosus': {
        moisture: { max: 12, unit: '%', method: 'Oven drying at 105°C' },
        pesticides: { max: 0.5, unit: 'ppm', method: 'GC-MS analysis' },
        heavy_metals: {
          lead: { max: 10, unit: 'ppm', method: 'ICP-MS' },
          cadmium: { max: 0.3, unit: 'ppm', method: 'ICP-MS' },
          mercury: { max: 1, unit: 'ppm', method: 'ICP-MS' },
          arsenic: { max: 3, unit: 'ppm', method: 'ICP-MS' }
        },
        active_compounds: {
          saponins: { min: 1.0, unit: '%', method: 'Gravimetric analysis' }
        }
      }
    };

    const result = species ? standards[species] : standards;

    res.status(200).json({
      success: true,
      species: species || 'all',
      standards: result,
      source: 'AYUSH Ministry Guidelines 2023'
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting quality standards:', error);
    res.status(500).json({
      error: 'Failed to get quality standards',
      details: error.message
    });
  }
});

// Get lab accreditation status
router.get('/labs/:labId/accreditation', async (req, res) => {
  try {
    const { labId } = req.params;
    
    // Mock lab accreditation data
    const labs = {
      'LAB_001': {
        name: 'Central Ayurvedic Research Laboratory',
        accreditation: 'NABL Accredited',
        certificationNumber: 'T-2345',
        validUntil: '2025-12-31',
        scope: ['Chemical Analysis', 'Microbiological Testing', 'Heavy Metals'],
        address: 'Mumbai, Maharashtra'
      },
      'LAB_002': {
        name: 'Regional Testing Center',
        accreditation: 'NABL Accredited',
        certificationNumber: 'T-5678',
        validUntil: '2025-06-30',
        scope: ['DNA Barcoding', 'Pesticide Residue', 'Authenticity Testing'],
        address: 'Bangalore, Karnataka'
      }
    };

    const lab = labs[labId];
    
    if (!lab) {
      return res.status(404).json({ error: 'Lab not found' });
    }

    res.status(200).json({
      success: true,
      labId,
      lab
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting lab accreditation:', error);
    res.status(500).json({
      error: 'Failed to get lab accreditation',
      details: error.message
    });
  }
});

// Get quality test history for a batch
router.get('/batch/:batchId/tests', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // This would query the blockchain for all quality tests for a specific batch
    // For now, return a placeholder
    res.status(200).json({
      success: true,
      batchId,
      tests: [],
      message: 'Quality test history for batch'
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting batch test history:', error);
    res.status(500).json({
      error: 'Failed to get batch test history',
      details: error.message
    });
  }
});

// DNA barcode verification
router.post('/dna-verify', async (req, res) => {
  try {
    const { species, sequence, referenceDatabase } = req.body;
    
    if (!species || !sequence) {
      return res.status(400).json({ error: 'Species and DNA sequence are required' });
    }

    // Mock DNA verification (in reality, this would query GenBank or similar)
    const verification = {
      species,
      inputSequence: sequence,
      referenceDatabase: referenceDatabase || 'GenBank',
      match: true,
      confidence: 98.5,
      matchedAccession: 'KC123456',
      verificationDate: new Date().toISOString()
    };

    req.app.locals.logger.info(`DNA verification performed for species: ${species}`);

    res.status(200).json({
      success: true,
      verification
    });

  } catch (error) {
    req.app.locals.logger.error('Error performing DNA verification:', error);
    res.status(500).json({
      error: 'Failed to perform DNA verification',
      details: error.message
    });
  }
});

// Generate QR code for quality certificate
router.post('/generate-certificate-qr', async (req, res) => {
  try {
    const { testId, labId } = req.body;
    
    if (!testId || !labId) {
      return res.status(400).json({ error: 'Test ID and Lab ID are required' });
    }

    const QRCode = require('qrcode');
    const certificateUrl = `${req.protocol}://${req.get('host')}/api/quality/certificate/${testId}`;
    const qrCodeDataURL = await QRCode.toDataURL(certificateUrl);

    res.status(200).json({
      success: true,
      testId,
      certificateUrl,
      qrCodeDataURL
    });

  } catch (error) {
    req.app.locals.logger.error('Error generating certificate QR:', error);
    res.status(500).json({
      error: 'Failed to generate certificate QR code',
      details: error.message
    });
  }
});

// Validate quality certificate
router.get('/certificate/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const fabricClient = req.app.locals.fabricClient;
    
    // Get quality test from blockchain
    const qualityTest = await fabricClient.getQualityTest(testId);
    
    res.status(200).json({
      success: true,
      certificate: qualityTest,
      validationTimestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Error validating certificate:', error);
    res.status(404).json({
      error: 'Certificate not found or invalid',
      details: error.message
    });
  }
});

module.exports = router;