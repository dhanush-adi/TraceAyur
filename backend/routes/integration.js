const express = require('express');
const router = express.Router();

// ERP/QMS Integration endpoints

// Get available integrations
router.get('/available', async (req, res) => {
  try {
    const integrations = [
      {
        id: 'sap-erp',
        name: 'SAP ERP',
        type: 'ERP',
        status: 'available',
        description: 'Enterprise Resource Planning integration',
        endpoints: ['inventory', 'orders', 'suppliers']
      },
      {
        id: 'oracle-qms',
        name: 'Oracle Quality Management',
        type: 'QMS',
        status: 'available',
        description: 'Quality Management System integration',
        endpoints: ['quality-tests', 'certifications', 'non-conformances']
      },
      {
        id: 'dynamics-365',
        name: 'Microsoft Dynamics 365',
        type: 'ERP',
        status: 'available',
        description: 'Business applications integration',
        endpoints: ['supply-chain', 'finance', 'operations']
      }
    ];

    res.status(200).json({
      success: true,
      integrations
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting available integrations:', error);
    res.status(500).json({
      error: 'Failed to get available integrations',
      details: error.message
    });
  }
});

// Real-time dashboard data for ERP systems
router.get('/realtime/dashboard', async (req, res) => {
  try {
    const { system } = req.query;
    const fabricClient = req.app.locals.fabricClient;
    
    // Get real-time data from blockchain
    const collections = await fabricClient.getAllCollectionEvents();
    
    // Format data for ERP consumption
    const dashboardData = {
      timestamp: new Date().toISOString(),
      system: system || 'generic',
      summary: {
        totalCollections: collections.length,
        activeProducts: 45,
        pendingQualityTests: 8,
        completedBatches: 32
      },
      kpis: {
        collectionRate: 156, // per day
        qualityPassRate: 96.8,
        processEfficiency: 89.2,
        complianceScore: 94.5
      },
      alerts: [
        {
          level: 'warning',
          message: 'Quality test pending for Batch B045',
          timestamp: new Date().toISOString(),
          category: 'quality'
        }
      ],
      trends: {
        collections: [120, 135, 142, 156, 148], // last 5 periods
        quality: [95.2, 96.1, 94.8, 96.8, 97.2],
        efficiency: [87.5, 88.9, 89.2, 90.1, 89.2]
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting realtime dashboard data:', error);
    res.status(500).json({
      error: 'Failed to get realtime dashboard data',
      details: error.message
    });
  }
});

// Inventory synchronization endpoint
router.post('/sync/inventory', async (req, res) => {
  try {
    const { system, inventoryData } = req.body;
    
    if (!system || !inventoryData) {
      return res.status(400).json({ error: 'System and inventory data are required' });
    }

    // Process inventory updates
    const processed = inventoryData.map(item => ({
      sku: item.sku,
      batchId: item.batchId,
      quantity: item.quantity,
      location: item.location,
      lastUpdated: new Date().toISOString(),
      status: 'synchronized'
    }));

    req.app.locals.logger.info(`Inventory sync from ${system}: ${processed.length} items`);

    res.status(200).json({
      success: true,
      system,
      processed: processed.length,
      items: processed
    });

  } catch (error) {
    req.app.locals.logger.error('Error syncing inventory:', error);
    res.status(500).json({
      error: 'Failed to sync inventory',
      details: error.message
    });
  }
});

// Quality data export for QMS
router.get('/export/quality-data', async (req, res) => {
  try {
    const { batchId, format = 'json', system } = req.query;
    
    // Mock quality data export
    const qualityData = {
      batchId: batchId || 'ALL',
      exportDate: new Date().toISOString(),
      system: system || 'generic',
      format,
      data: [
        {
          testId: 'QT_001',
          batchId: 'B001',
          testType: 'MOISTURE',
          result: 8.5,
          threshold: 12.0,
          passed: true,
          labId: 'LAB_001',
          testDate: '2024-09-12T10:30:00Z'
        },
        {
          testId: 'QT_002',
          batchId: 'B001',
          testType: 'PESTICIDE',
          result: 0.2,
          threshold: 0.5,
          passed: true,
          labId: 'LAB_001',
          testDate: '2024-09-12T14:15:00Z'
        }
      ]
    };

    if (format === 'xml') {
      // Convert to XML format for legacy systems
      const xml = convertToXML(qualityData);
      res.set('Content-Type', 'application/xml');
      res.status(200).send(xml);
    } else {
      res.status(200).json({
        success: true,
        qualityData
      });
    }

  } catch (error) {
    req.app.locals.logger.error('Error exporting quality data:', error);
    res.status(500).json({
      error: 'Failed to export quality data',
      details: error.message
    });
  }
});

// Webhook endpoint for external system notifications
router.post('/webhook/:system', async (req, res) => {
  try {
    const { system } = req.params;
    const { event, data } = req.body;
    
    req.app.locals.logger.info(`Webhook received from ${system}: ${event}`);
    
    // Process webhook based on event type
    switch (event) {
      case 'inventory.updated':
        // Handle inventory update
        break;
      case 'quality.test.required':
        // Handle quality test requirement
        break;
      case 'batch.completed':
        // Handle batch completion
        break;
      default:
        req.app.locals.logger.warn(`Unknown webhook event: ${event}`);
    }

    // Emit to connected clients
    req.app.locals.io.emit('external-system-event', {
      system,
      event,
      data,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    req.app.locals.logger.error('Error processing webhook:', error);
    res.status(500).json({
      error: 'Failed to process webhook',
      details: error.message
    });
  }
});

// FHIR-style resource endpoint for standardized data exchange
router.get('/fhir/:resourceType/:id?', async (req, res) => {
  try {
    const { resourceType, id } = req.params;
    
    // Mock FHIR-style resources
    const resources = {
      CollectionEvent: {
        resourceType: 'CollectionEvent',
        id: id || 'COL_001',
        status: 'completed',
        category: {
          coding: [{
            system: 'http://ayush.gov.in/fhir/collection-category',
            code: 'herb-collection',
            display: 'Herb Collection'
          }]
        },
        subject: {
          reference: 'Species/withania-somnifera'
        },
        effectiveDateTime: '2024-09-12T08:30:00Z',
        performer: {
          reference: 'Collector/COL_001'
        },
        location: {
          latitude: 15.2993,
          longitude: 74.1240
        }
      },
      QualityTest: {
        resourceType: 'QualityTest',
        id: id || 'QT_001',
        status: 'final',
        category: {
          coding: [{
            system: 'http://ayush.gov.in/fhir/test-category',
            code: 'chemical-analysis',
            display: 'Chemical Analysis'
          }]
        },
        result: {
          value: 8.5,
          unit: '%',
          code: 'moisture-content'
        }
      }
    };

    const resource = resources[resourceType];
    
    if (!resource) {
      return res.status(404).json({ error: 'Resource type not found' });
    }

    res.status(200).json(resource);

  } catch (error) {
    req.app.locals.logger.error('Error getting FHIR resource:', error);
    res.status(500).json({
      error: 'Failed to get FHIR resource',
      details: error.message
    });
  }
});

// Batch processing status for manufacturing systems
router.get('/batch-status/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    // Mock batch status
    const batchStatus = {
      batchId,
      status: 'in-processing',
      stage: 'drying',
      progress: 65,
      estimatedCompletion: '2024-09-15T16:00:00Z',
      qualityChecks: {
        completed: 3,
        pending: 2,
        passed: 3
      },
      location: {
        facilityId: 'FAC_001',
        name: 'Primary Processing Unit',
        coordinates: { latitude: 15.3045, longitude: 74.1290 }
      },
      timeline: [
        { stage: 'collection', completed: true, timestamp: '2024-09-12T08:30:00Z' },
        { stage: 'initial-processing', completed: true, timestamp: '2024-09-12T14:00:00Z' },
        { stage: 'drying', completed: false, timestamp: null },
        { stage: 'quality-testing', completed: false, timestamp: null },
        { stage: 'packaging', completed: false, timestamp: null }
      ]
    };

    res.status(200).json({
      success: true,
      batchStatus
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting batch status:', error);
    res.status(500).json({
      error: 'Failed to get batch status',
      details: error.message
    });
  }
});

// Helper function to convert JSON to XML
function convertToXML(obj) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<QualityData>\n';
  
  if (obj.data && Array.isArray(obj.data)) {
    obj.data.forEach(item => {
      xml += '  <Test>\n';
      Object.keys(item).forEach(key => {
        xml += `    <${key}>${item[key]}</${key}>\n`;
      });
      xml += '  </Test>\n';
    });
  }
  
  xml += '</QualityData>';
  return xml;
}

module.exports = router;