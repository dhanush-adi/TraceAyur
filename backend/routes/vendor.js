const express = require('express');
const router = express.Router();
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');

// Get vendor shipments and dashboard data
router.get('/shipments', async (req, res) => {
  try {
    // Mock data for shipments - in production, this would come from blockchain and external systems
    const shipments = [
      {
        id: 'SH_001',
        productName: 'Ashwagandha Powder',
        batchNumber: 'B045',
        manufacturer: 'Himalayan Herbs Ltd',
        quantity: 500,
        expectedDate: '2024-01-15',
        status: 'in-transit',
        transportMode: 'Refrigerated Truck',
        temperature: 22,
        humidity: 45,
        transitProgress: 75,
        eta: '2 hours'
      },
      {
        id: 'SH_002',
        productName: 'Brahmi Extract',
        batchNumber: 'B067',
        manufacturer: 'Kerala Organics',
        quantity: 250,
        expectedDate: '2024-01-16',
        status: 'pending',
        transportMode: 'Standard Delivery',
        temperature: 24,
        humidity: 42,
        transitProgress: 100,
        eta: 'Arrived'
      },
      {
        id: 'SH_003',
        productName: 'Shatavari Capsules',
        batchNumber: 'B089',
        manufacturer: 'Ayur Wellness Co',
        quantity: 1000,
        expectedDate: '2024-01-14',
        status: 'delivered',
        transportMode: 'Express Courier',
        temperature: 23,
        humidity: 40,
        transitProgress: 100,
        eta: 'Delivered'
      }
    ];

    const stats = {
      totalShipments: shipments.length,
      pendingReceival: shipments.filter(s => s.status === 'pending').length,
      qualityPassed: 94, // Percentage
      avgTransitTime: 3 // Days
    };

    res.json({
      success: true,
      shipments,
      stats
    });

  } catch (error) {
    console.error('Error fetching vendor shipments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shipments',
      details: error.message 
    });
  }
});

// Get vendor activities
router.get('/activities', async (req, res) => {
  try {
    const activities = [
      {
        id: 'ACT_001',
        type: 'delivered',
        status: 'delivered',
        message: 'Ashwagandha Powder batch B045 delivered successfully',
        timestamp: '2 hours ago'
      },
      {
        id: 'ACT_002',
        type: 'quality-check',
        status: 'quality-check',
        message: 'Quality inspection completed for Brahmi Extract batch B067',
        timestamp: '4 hours ago'
      },
      {
        id: 'ACT_003',
        type: 'in-transit',
        status: 'in-transit',
        message: 'Shatavari Capsules batch B089 en route to facility',
        timestamp: '6 hours ago'
      }
    ];

    res.json({
      success: true,
      activities
    });

  } catch (error) {
    console.error('Error fetching vendor activities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch activities',
      details: error.message 
    });
  }
});

// Receive shipment
router.post('/receive-shipment', async (req, res) => {
  try {
    const { shipmentId, vendorAddress, receivedAt } = req.body;

    // Connect to Fabric network
    const ccpPath = path.resolve(__dirname, '..', '..', 'fabric', 'connection-org1.json');
    const ccp = JSON.parse(require('fs').readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('appUser');
    if (!identity) {
      return res.status(401).json({ error: 'User identity not found in wallet' });
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('herbTraceContract');

    // Create a processing step for shipment receipt
    const processingStepId = `PS_RECEIPT_${shipmentId}_${Date.now()}`;
    
    await contract.submitTransaction(
      'addProcessingStep',
      processingStepId,
      shipmentId, // Use shipment ID as product batch ID
      'Shipment Received',
      'Goods received at vendor facility',
      vendorAddress,
      receivedAt,
      'Vendor Facility',
      '{}', // Empty parameters
      'received' // Status
    );

    await gateway.disconnect();

    res.json({
      success: true,
      message: 'Shipment received successfully',
      processingStepId
    });

  } catch (error) {
    console.error('Error receiving shipment:', error);
    res.status(500).json({ 
      error: 'Failed to receive shipment',
      details: error.message 
    });
  }
});

// Add quality check for received goods
router.post('/quality-check', async (req, res) => {
  try {
    const { 
      shipmentId, 
      testType, 
      result, 
      certificationBody,
      testParameters,
      vendorAddress 
    } = req.body;

    // Connect to Fabric network
    const ccpPath = path.resolve(__dirname, '..', '..', 'fabric', 'connection-org1.json');
    const ccp = JSON.parse(require('fs').readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('appUser');
    if (!identity) {
      return res.status(401).json({ error: 'User identity not found in wallet' });
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('herbTraceContract');

    // Add quality test
    const qualityTestId = `QT_VENDOR_${shipmentId}_${Date.now()}`;
    
    await contract.submitTransaction(
      'addQualityTest',
      qualityTestId,
      shipmentId, // Use shipment ID as product batch ID
      testType,
      result === 'passed' ? 'pass' : 'fail',
      JSON.stringify(testParameters),
      '', // No file upload for now
      certificationBody,
      new Date().toISOString(),
      vendorAddress
    );

    await gateway.disconnect();

    res.json({
      success: true,
      message: 'Quality check recorded successfully',
      qualityTestId
    });

  } catch (error) {
    console.error('Error recording quality check:', error);
    res.status(500).json({ 
      error: 'Failed to record quality check',
      details: error.message 
    });
  }
});

// Get shipment tracking info
router.get('/track/:shipmentId', async (req, res) => {
  try {
    const { shipmentId } = req.params;

    // Connect to Fabric network to get blockchain data
    const ccpPath = path.resolve(__dirname, '..', '..', 'fabric', 'connection-org1.json');
    const ccp = JSON.parse(require('fs').readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('appUser');
    if (!identity) {
      return res.status(401).json({ error: 'User identity not found in wallet' });
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('herbTraceContract');

    // Get processing steps for tracking
    const result = await contract.evaluateTransaction('getProcessingStepsByProduct', shipmentId);
    const processingSteps = JSON.parse(result.toString());

    // Mock real-time tracking data (would come from IoT sensors in production)
    const trackingData = {
      currentLocation: {
        latitude: 15.2993,
        longitude: 74.1240,
        address: 'Karnataka, India'
      },
      environmentalConditions: {
        temperature: 22,
        humidity: 45,
        timestamp: new Date().toISOString()
      },
      estimatedArrival: '2024-01-15T14:30:00Z',
      route: [
        { lat: 15.8497, lng: 74.4977, timestamp: '2024-01-13T10:00:00Z' },
        { lat: 15.5740, lng: 74.3209, timestamp: '2024-01-13T14:00:00Z' },
        { lat: 15.2993, lng: 74.1240, timestamp: '2024-01-14T08:00:00Z' }
      ]
    };

    await gateway.disconnect();

    res.json({
      success: true,
      shipmentId,
      processingSteps,
      tracking: trackingData
    });

  } catch (error) {
    console.error('Error getting shipment tracking:', error);
    res.status(500).json({ 
      error: 'Failed to get shipment tracking',
      details: error.message 
    });
  }
});

module.exports = router;