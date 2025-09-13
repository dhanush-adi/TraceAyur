const express = require('express');
const router = express.Router();

// Dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const fabricClient = req.app.locals.fabricClient;
    
    // Get all collection events for statistics
    const collections = await fabricClient.getAllCollectionEvents();
    
    // Calculate dashboard metrics
    const metrics = {
      totalCollections: collections.length,
      activeCollectors: [...new Set(collections.map(c => c.collectorId))].length,
      speciesTracked: [...new Set(collections.map(c => c.species))].length,
      totalWeight: collections.reduce((sum, c) => sum + c.initialQualityMetrics.weight, 0),
      recentActivity: collections
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10),
      complianceRate: 98.5, // Mock compliance rate
      sustainabilityScore: 85, // Mock sustainability score
      networkHealth: {
        nodes: 4,
        averageBlockTime: 2.3,
        throughput: '150 TPS'
      }
    };

    res.status(200).json({
      success: true,
      metrics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting dashboard overview:', error);
    res.status(500).json({
      error: 'Failed to get dashboard overview',
      details: error.message
    });
  }
});

// Harvest volumes by region
router.get('/harvest-volumes', async (req, res) => {
  try {
    const { timeframe = '30d', species } = req.query;
    const fabricClient = req.app.locals.fabricClient;
    
    let collections = await fabricClient.getAllCollectionEvents();
    
    // Filter by species if provided
    if (species) {
      collections = collections.filter(c => c.species === species);
    }
    
    // Group by harvest zone
    const volumesByZone = collections.reduce((acc, collection) => {
      const zone = collection.harvestZoneId;
      if (!acc[zone]) {
        acc[zone] = {
          zoneId: zone,
          totalWeight: 0,
          collectionCount: 0,
          species: new Set()
        };
      }
      acc[zone].totalWeight += collection.initialQualityMetrics.weight;
      acc[zone].collectionCount += 1;
      acc[zone].species.add(collection.species);
      return acc;
    }, {});

    // Convert to array and add zone names
    const volumes = Object.values(volumesByZone).map(zone => ({
      ...zone,
      species: Array.from(zone.species),
      zoneName: zone.zoneId === 'ZONE_001' ? 'Western Ghats Ashwagandha Zone' : zone.zoneId
    }));

    res.status(200).json({
      success: true,
      timeframe,
      species: species || 'all',
      volumes
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting harvest volumes:', error);
    res.status(500).json({
      error: 'Failed to get harvest volumes',
      details: error.message
    });
  }
});

// Quality metrics dashboard
router.get('/quality-metrics', async (req, res) => {
  try {
    // Mock quality metrics data
    const metrics = {
      testPass: {
        moisture: 94.2,
        pesticides: 98.7,
        heavyMetals: 96.1,
        microbiological: 89.3,
        dnaAuthenticity: 99.1
      },
      trendsOver30Days: {
        moisture: [95, 94, 96, 93, 94],
        pesticides: [99, 98, 99, 97, 99],
        heavyMetals: [97, 96, 95, 96, 96],
        microbiological: [90, 89, 91, 88, 89],
        dnaAuthenticity: [99, 99, 100, 98, 99]
      },
      labPerformance: {
        'LAB_001': { testsCompleted: 150, averageTime: 3.2, accuracy: 98.5 },
        'LAB_002': { testsCompleted: 89, averageTime: 4.1, accuracy: 97.8 }
      },
      alerts: [
        {
          type: 'warning',
          message: 'Batch B001 has moisture content above threshold',
          timestamp: new Date().toISOString(),
          batchId: 'B001'
        }
      ]
    };

    res.status(200).json({
      success: true,
      metrics
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting quality metrics:', error);
    res.status(500).json({
      error: 'Failed to get quality metrics',
      details: error.message
    });
  }
});

// Supply chain visibility
router.get('/supply-chain', async (req, res) => {
  try {
    // Mock supply chain data showing product flow
    const supplyChain = {
      activeProducts: 45,
      inTransit: 12,
      processing: 8,
      qualityTesting: 5,
      readyForMarket: 20,
      flowData: [
        {
          stage: 'Collection',
          products: 15,
          averageDuration: '1 day',
          location: 'Western Ghats'
        },
        {
          stage: 'Primary Processing',
          products: 12,
          averageDuration: '3 days',
          location: 'Local Facilities'
        },
        {
          stage: 'Quality Testing',
          products: 8,
          averageDuration: '2 days',
          location: 'Testing Labs'
        },
        {
          stage: 'Secondary Processing',
          products: 6,
          averageDuration: '5 days',
          location: 'Manufacturing Units'
        },
        {
          stage: 'Packaging & Distribution',
          products: 4,
          averageDuration: '2 days',
          location: 'Distribution Centers'
        }
      ]
    };

    res.status(200).json({
      success: true,
      supplyChain
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting supply chain data:', error);
    res.status(500).json({
      error: 'Failed to get supply chain data',
      details: error.message
    });
  }
});

// Sustainability metrics
router.get('/sustainability', async (req, res) => {
  try {
    const sustainability = {
      carbonFootprint: {
        total: 245.6,
        unit: 'kg CO2e',
        breakdown: {
          transportation: 45.2,
          processing: 89.3,
          packaging: 23.1,
          storage: 88.0
        },
        trend: [-2.3, -1.8, -0.5, 1.2, -1.9] // % change over 5 periods
      },
      waterUsage: {
        total: 1250,
        unit: 'liters per kg',
        efficient: true,
        target: 1500
      },
      fairTradeCompliance: {
        percentage: 92.3,
        cooperatives: 8,
        farmers: 156,
        premiumPaid: 45000 // INR
      },
      conservationScore: {
        overall: 85,
        biodiversity: 90,
        soilHealth: 82,
        waterConservation: 83,
        renewableEnergy: 85
      },
      certifications: [
        { name: 'Organic Certification', status: 'Valid', expiryDate: '2025-12-31' },
        { name: 'Fair Trade', status: 'Valid', expiryDate: '2025-06-30' },
        { name: 'GACP Compliance', status: 'Valid', expiryDate: '2025-09-15' }
      ]
    };

    res.status(200).json({
      success: true,
      sustainability
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting sustainability metrics:', error);
    res.status(500).json({
      error: 'Failed to get sustainability metrics',
      details: error.message
    });
  }
});

// Compliance reporting
router.get('/compliance', async (req, res) => {
  try {
    const { reportType = 'monthly' } = req.query;
    
    const compliance = {
      reportType,
      period: '2024-09',
      overallCompliance: 96.8,
      ayushCompliance: {
        gmpCompliance: 98.2,
        qualityStandards: 95.4,
        labelingRequirements: 99.1,
        exportRequirements: 94.7
      },
      regulatoryChecks: {
        passed: 47,
        failed: 2,
        pending: 3
      },
      auditTrail: [
        {
          date: '2024-09-10',
          type: 'Quality Audit',
          result: 'Passed',
          score: 96.5,
          auditor: 'AYUSH Certified Auditor'
        },
        {
          date: '2024-09-05',
          type: 'Export Documentation',
          result: 'Passed',
          score: 98.2,
          auditor: 'Export Authority'
        }
      ],
      nonCompliances: [
        {
          date: '2024-09-08',
          issue: 'Batch B045 - Moisture content slightly above limit',
          severity: 'Minor',
          status: 'Resolved',
          action: 'Re-processing completed'
        }
      ]
    };

    res.status(200).json({
      success: true,
      compliance
    });

  } catch (error) {
    req.app.locals.logger.error('Error getting compliance report:', error);
    res.status(500).json({
      error: 'Failed to get compliance report',
      details: error.message
    });
  }
});

// Export compliance report
router.post('/export-report', async (req, res) => {
  try {
    const { reportType, format = 'pdf', period } = req.body;
    
    // Generate report ID
    const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Mock report generation
    const report = {
      id: reportId,
      type: reportType,
      format,
      period,
      status: 'generating',
      createdAt: new Date().toISOString(),
      downloadUrl: null
    };

    // Simulate async report generation
    setTimeout(() => {
      report.status = 'completed';
      report.downloadUrl = `/api/reports/download/${reportId}`;
      
      // Emit completion event
      req.app.locals.io.emit('report-generated', report);
    }, 3000);

    res.status(202).json({
      success: true,
      report,
      message: 'Report generation started'
    });

  } catch (error) {
    req.app.locals.logger.error('Error generating report:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
});

module.exports = router;