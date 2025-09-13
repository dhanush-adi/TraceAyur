const express = require('express');
const router = express.Router();
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const QRCode = require('qrcode');

// Create provenance record and generate QR code
router.post('/provenance', async (req, res) => {
  try {
    const {
      productBatchId,
      collectionEventIds,
      qualityTestIds,
      processingStepIds,
      currentOwner,
      currentLatitude,
      currentLongitude,
      currentFacilityId,
      carbonFootprint,
      waterUsage,
      fairTradeCompliant,
      conservationScore,
      productName,
      manufacturer,
      batchNumber,
      expiryDate,
      dosageForm
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

    // Create provenance record
    const provenanceId = `PROV_${productBatchId}_${Date.now()}`;
    
    await contract.submitTransaction(
      'createProvenance',
      provenanceId,
      productBatchId,
      JSON.stringify(collectionEventIds),
      JSON.stringify(qualityTestIds),
      JSON.stringify(processingStepIds),
      currentOwner,
      currentLatitude.toString(),
      currentLongitude.toString(),
      currentFacilityId,
      carbonFootprint.toString(),
      waterUsage.toString(),
      fairTradeCompliant.toString(),
      conservationScore.toString()
    );

    // Create consumer-facing URL with provenance ID
    const consumerUrl = `${req.protocol}://${req.get('host')}/customer/trace/${provenanceId}`;
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(consumerUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Store additional product metadata (could be stored off-chain or in a separate system)
    const productMetadata = {
      provenanceId,
      productName,
      manufacturer,
      batchNumber,
      expiryDate,
      dosageForm,
      consumerUrl,
      createdAt: new Date().toISOString()
    };

    await gateway.disconnect();

    res.json({
      success: true,
      provenanceId,
      qrCodeDataURL,
      consumerUrl,
      metadata: productMetadata
    });

  } catch (error) {
    console.error('Error creating provenance record:', error);
    res.status(500).json({ 
      error: 'Failed to create provenance record',
      details: error.message 
    });
  }
});

// Get provenance record by ID
router.get('/provenance/:provenanceId', async (req, res) => {
  try {
    const { provenanceId } = req.params;

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

    // Get provenance record
    const result = await contract.evaluateTransaction('getProvenance', provenanceId);
    const provenance = JSON.parse(result.toString());

    await gateway.disconnect();

    res.json({
      success: true,
      provenance
    });

  } catch (error) {
    console.error('Error getting provenance record:', error);
    res.status(500).json({ 
      error: 'Failed to get provenance record',
      details: error.message 
    });
  }
});

// Get full supply chain history for a product batch
router.get('/trace/:productBatchId', async (req, res) => {
  try {
    const { productBatchId } = req.params;

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

    // Get collection events
    const collectionEventsResult = await contract.evaluateTransaction('getCollectionEventsByProduct', productBatchId);
    const collectionEvents = JSON.parse(collectionEventsResult.toString());

    // Get quality tests
    const qualityTestsResult = await contract.evaluateTransaction('getQualityTestsByProduct', productBatchId);
    const qualityTests = JSON.parse(qualityTestsResult.toString());

    // Get processing steps
    const processingStepsResult = await contract.evaluateTransaction('getProcessingStepsByProduct', productBatchId);
    const processingSteps = JSON.parse(processingStepsResult.toString());

    // Get provenance records
    const provenanceResult = await contract.evaluateTransaction('getProvenanceByProduct', productBatchId);
    const provenanceRecords = JSON.parse(provenanceResult.toString());

    await gateway.disconnect();

    res.json({
      success: true,
      productBatchId,
      supplyChain: {
        collectionEvents,
        qualityTests,
        processingSteps,
        provenance: provenanceRecords
      }
    });

  } catch (error) {
    console.error('Error getting supply chain trace:', error);
    res.status(500).json({ 
      error: 'Failed to get supply chain trace',
      details: error.message 
    });
  }
});

module.exports = router;