const express = require('express');
const Joi = require('joi');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Validation schemas
const collectionEventSchema = Joi.object({
  collectorId: Joi.string().required(),
  species: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  harvestZoneId: Joi.string().required(),
  moisture: Joi.number().min(0).max(100).required(),
  weight: Joi.number().min(0).required(),
  grade: Joi.string().valid('A', 'B', 'C', 'D').required()
});

const qualityTestSchema = Joi.object({
  batchId: Joi.string().required(),
  testType: Joi.string().valid('MOISTURE', 'PESTICIDE', 'DNA_BARCODE', 'HEAVY_METALS', 'MICROBIOLOGICAL').required(),
  labId: Joi.string().required(),
  value: Joi.number().required(),
  unit: Joi.string().required(),
  threshold: Joi.number().required(),
  certificate: Joi.string().required(),
  validUntil: Joi.string().isoDate().required()
});

const processingStepSchema = Joi.object({
  batchId: Joi.string().required(),
  stepType: Joi.string().valid('DRYING', 'GRINDING', 'STORAGE', 'PACKAGING', 'TRANSPORT').required(),
  processedBy: Joi.string().required(),
  startTime: Joi.string().isoDate().required(),
  endTime: Joi.string().isoDate().required(),
  temperature: Joi.number().optional(),
  humidity: Joi.number().min(0).max(100).optional(),
  duration: Joi.number().min(0).required(),
  inputWeight: Joi.number().min(0).required(),
  outputWeight: Joi.number().min(0).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  facilityId: Joi.string().required()
});

const provenanceSchema = Joi.object({
  productBatchId: Joi.string().required(),
  collectionEventIds: Joi.array().items(Joi.string()).required(),
  qualityTestIds: Joi.array().items(Joi.string()).required(),
  processingStepIds: Joi.array().items(Joi.string()).required(),
  currentOwner: Joi.string().required(),
  currentLatitude: Joi.number().min(-90).max(90).required(),
  currentLongitude: Joi.number().min(-180).max(180).required(),
  currentFacilityId: Joi.string().required(),
  carbonFootprint: Joi.number().min(0).required(),
  waterUsage: Joi.number().min(0).required(),
  fairTradeCompliant: Joi.boolean().required(),
  conservationScore: Joi.number().min(0).max(100).required(),
  productName: Joi.string().required(),
  manufacturer: Joi.string().required(),
  batchNumber: Joi.string().required(),
  expiryDate: Joi.string().isoDate().required(),
  dosageForm: Joi.string().required()
});

// Create collection event
router.post('/collection-events', async (req, res) => {
  try {
    const { error, value } = collectionEventSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const fabricClient = req.app.locals.fabricClient;
    const eventId = await fabricClient.createCollectionEvent(
      value.collectorId,
      value.species,
      value.latitude,
      value.longitude,
      value.harvestZoneId,
      value.moisture,
      value.weight,
      value.grade
    );

    // Emit real-time update
    req.app.locals.io.emit('collection-event-created', {
      eventId,
      collectorId: value.collectorId,
      species: value.species,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      eventId,
      message: 'Collection event created successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error creating collection event:', error);
    res.status(500).json({
      error: 'Failed to create collection event',
      details: error.message
    });
  }
});

// Add quality test
router.post('/quality-tests', async (req, res) => {
  try {
    const { error, value } = qualityTestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const fabricClient = req.app.locals.fabricClient;
    const testId = await fabricClient.addQualityTest(
      value.batchId,
      value.testType,
      value.labId,
      value.value,
      value.unit,
      value.threshold,
      value.certificate,
      value.validUntil
    );

    // Emit real-time update
    req.app.locals.io.emit('quality-test-added', {
      testId,
      batchId: value.batchId,
      testType: value.testType,
      passed: value.value <= value.threshold,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      testId,
      message: 'Quality test added successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error adding quality test:', error);
    res.status(500).json({
      error: 'Failed to add quality test',
      details: error.message
    });
  }
});

// Add processing step
router.post('/processing-steps', async (req, res) => {
  try {
    const { error, value } = processingStepSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const fabricClient = req.app.locals.fabricClient;
    const stepId = await fabricClient.addProcessingStep(
      value.batchId,
      value.stepType,
      value.processedBy,
      value.startTime,
      value.endTime,
      value.temperature || 0,
      value.humidity || 0,
      value.duration,
      value.inputWeight,
      value.outputWeight,
      value.latitude,
      value.longitude,
      value.facilityId
    );

    // Emit real-time update
    req.app.locals.io.emit('processing-step-added', {
      stepId,
      batchId: value.batchId,
      stepType: value.stepType,
      facilityId: value.facilityId,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      stepId,
      message: 'Processing step added successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error adding processing step:', error);
    res.status(500).json({
      error: 'Failed to add processing step',
      details: error.message
    });
  }
});

// Create provenance record
router.post('/provenance', async (req, res) => {
  try {
    const { error, value } = provenanceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const fabricClient = req.app.locals.fabricClient;
    const provenanceId = await fabricClient.createProvenance(
      value.productBatchId,
      value.collectionEventIds.join(','),
      value.qualityTestIds.join(','),
      value.processingStepIds.join(','),
      value.currentOwner,
      value.currentLatitude,
      value.currentLongitude,
      value.currentFacilityId,
      value.carbonFootprint,
      value.waterUsage,
      value.fairTradeCompliant,
      value.conservationScore,
      value.productName,
      value.manufacturer,
      value.batchNumber,
      value.expiryDate,
      value.dosageForm
    );

    // Generate QR code
    const qrCode = `QR_${provenanceId}`;
    const qrCodeUrl = `${req.protocol}://${req.get('host')}/api/scan/${qrCode}`;
    const qrCodeDataURL = await QRCode.toDataURL(qrCodeUrl);

    // Emit real-time update
    req.app.locals.io.emit('provenance-created', {
      provenanceId,
      productBatchId: value.productBatchId,
      qrCode,
      manufacturer: value.manufacturer,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      success: true,
      provenanceId,
      qrCode,
      qrCodeDataURL,
      scanUrl: qrCodeUrl,
      message: 'Provenance record created successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error creating provenance:', error);
    res.status(500).json({
      error: 'Failed to create provenance record',
      details: error.message
    });
  }
});

// Transfer custody
router.post('/transfer-custody', async (req, res) => {
  try {
    const { provenanceId, newOwner, newLatitude, newLongitude, newFacilityId } = req.body;

    if (!provenanceId || !newOwner || !newLatitude || !newLongitude || !newFacilityId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const fabricClient = req.app.locals.fabricClient;
    await fabricClient.transferCustody(
      provenanceId,
      newOwner,
      newLatitude,
      newLongitude,
      newFacilityId
    );

    // Emit real-time update
    req.app.locals.io.emit('custody-transferred', {
      provenanceId,
      newOwner,
      newFacilityId,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Custody transferred successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error transferring custody:', error);
    res.status(500).json({
      error: 'Failed to transfer custody',
      details: error.message
    });
  }
});

// Scan QR code endpoint for consumers
router.get('/scan/:qrCode', async (req, res) => {
  try {
    const { qrCode } = req.params;
    const fabricClient = req.app.locals.fabricClient;
    
    const provenance = await fabricClient.getProvenanceByQR(qrCode);
    
    // Get detailed information for each component
    const collectionEvents = await Promise.all(
      provenance.collectionEvents.map(eventId => fabricClient.getCollectionEvent(eventId))
    );
    
    const qualityTests = await Promise.all(
      provenance.qualityTests.map(testId => fabricClient.getQualityTest(testId))
    );
    
    const processingSteps = await Promise.all(
      provenance.processingSteps.map(stepId => fabricClient.getProcessingStep(stepId))
    );

    const fullProvenance = {
      ...provenance,
      collectionEventsDetails: collectionEvents,
      qualityTestsDetails: qualityTests,
      processingStepsDetails: processingSteps,
      scanTimestamp: new Date().toISOString()
    };

    // Log scan event
    req.app.locals.logger.info(`QR code scanned: ${qrCode} from IP: ${req.ip}`);
    
    // Emit scan event
    req.app.locals.io.emit('qr-code-scanned', {
      qrCode,
      productName: provenance.finalProduct.productName,
      scanTimestamp: new Date().toISOString(),
      scannerIP: req.ip
    });

    res.status(200).json({
      success: true,
      provenance: fullProvenance
    });

  } catch (error) {
    req.app.locals.logger.error('Error scanning QR code:', error);
    res.status(404).json({
      error: 'QR code not found or invalid',
      details: error.message
    });
  }
});

// Get all collection events
router.get('/collection-events', async (req, res) => {
  try {
    const fabricClient = req.app.locals.fabricClient;
    const events = await fabricClient.getAllCollectionEvents();
    
    res.status(200).json({
      success: true,
      events
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting collection events:', error);
    res.status(500).json({
      error: 'Failed to retrieve collection events',
      details: error.message
    });
  }
});

// Query by species
router.get('/query/species/:species', async (req, res) => {
  try {
    const { species } = req.params;
    const fabricClient = req.app.locals.fabricClient;
    const results = await fabricClient.queryBySpecies(species);
    
    res.status(200).json({
      success: true,
      species,
      results
    });

  } catch (error) {
    req.app.locals.logger.error('Error querying by species:', error);
    res.status(500).json({
      error: 'Failed to query by species',
      details: error.message
    });
  }
});

// Query by collector
router.get('/query/collector/:collectorId', async (req, res) => {
  try {
    const { collectorId } = req.params;
    const fabricClient = req.app.locals.fabricClient;
    const results = await fabricClient.queryByCollector(collectorId);
    
    res.status(200).json({
      success: true,
      collectorId,
      results
    });

  } catch (error) {
    req.app.locals.logger.error('Error querying by collector:', error);
    res.status(500).json({
      error: 'Failed to query by collector',
      details: error.message
    });
  }
});

// Get harvest zone information
router.get('/harvest-zones/:zoneId', async (req, res) => {
  try {
    const { zoneId } = req.params;
    const fabricClient = req.app.locals.fabricClient;
    const zone = await fabricClient.getHarvestZone(zoneId);
    
    res.status(200).json({
      success: true,
      zone
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting harvest zone:', error);
    res.status(500).json({
      error: 'Failed to retrieve harvest zone',
      details: error.message
    });
  }
});

module.exports = router;
