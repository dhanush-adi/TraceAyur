const express = require('express');
const router = express.Router();
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const { v4: uuidv4 } = require('uuid');

// Mock warehouse data - Replace with actual database integration
let warehouseInventory = [
  {
    id: 'inv_001',
    productName: 'Ashwagandha Root Powder',
    sku: 'ASH-PWD-001',
    batchNumber: 'B001-2024',
    quantity: 45,
    minStock: 50,
    location: 'A1-B3-S2',
    zone: 'CONTROLLED_TEMP',
    lastReceived: '2024-01-15T10:30:00Z',
    expiryDate: '2025-01-15T00:00:00Z',
    condition: 'Good',
    reserved: 10
  },
  {
    id: 'inv_002',
    productName: 'Turmeric Extract',
    sku: 'TUR-EXT-002',
    batchNumber: 'B002-2024',
    quantity: 15,
    minStock: 100,
    location: 'A2-B1-S4',
    zone: 'COLD_STORAGE',
    lastReceived: '2024-01-20T14:15:00Z',
    expiryDate: '2025-06-20T00:00:00Z',
    condition: 'Good',
    reserved: 5
  },
  {
    id: 'inv_003',
    productName: 'Brahmi Leaf Extract',
    sku: 'BRA-EXT-003',
    batchNumber: 'B003-2024',
    quantity: 120,
    minStock: 75,
    location: 'A1-B2-S1',
    zone: 'STANDARD',
    lastReceived: '2024-01-18T09:45:00Z',
    expiryDate: '2024-12-18T00:00:00Z',
    condition: 'Good',
    reserved: 20
  }
];

let warehouseShipments = [
  {
    id: 'ship_001',
    productName: 'Neem Oil Extract',
    origin: 'Kerala Farms',
    destination: 'Central Warehouse',
    quantity: 200,
    expectedDate: '2024-01-25T00:00:00Z',
    status: 'pending',
    carrier: 'Green Logistics',
    trackingNumber: 'GL123456789',
    priority: 'high'
  },
  {
    id: 'ship_002',
    productName: 'Ginger Powder',
    origin: 'Karnataka Processors',
    destination: 'Central Warehouse',
    quantity: 150,
    expectedDate: '2024-01-28T00:00:00Z',
    status: 'in_transit',
    carrier: 'Herbal Express',
    trackingNumber: 'HE987654321',
    priority: 'normal'
  }
];

let environmentalSensors = [
  {
    sensorId: 'TEMP_001',
    location: 'Cold Storage Unit A',
    temperature: 18.5,
    humidity: 55,
    lastUpdate: '2024-01-24T15:30:00Z'
  },
  {
    sensorId: 'TEMP_002',
    location: 'Controlled Temperature Zone',
    temperature: 22.1,
    humidity: 45,
    lastUpdate: '2024-01-24T15:30:00Z'
  },
  {
    sensorId: 'TEMP_003',
    location: 'Standard Storage Area',
    temperature: 28.3,
    humidity: 65,
    lastUpdate: '2024-01-24T15:30:00Z'
  }
];

let recentActivities = [
  {
    message: 'Received shipment GL123456789 - Neem Oil Extract (200 units)',
    timestamp: '2024-01-24T14:30:00Z',
    type: 'RECEIVE'
  },
  {
    message: 'Stock level critical for Turmeric Extract (15 units remaining)',
    timestamp: '2024-01-24T13:15:00Z',
    type: 'ALERT'
  },
  {
    message: 'Processed order ORD_456 - Brahmi Leaf Extract (25 units)',
    timestamp: '2024-01-24T11:45:00Z',
    type: 'PROCESS'
  },
  {
    message: 'Environmental alert: High humidity in Standard Storage Area',
    timestamp: '2024-01-24T10:20:00Z',
    type: 'ENVIRONMENT'
  }
];

// Helper function to connect to Fabric network
async function connectToNetwork() {
  try {
    const ccpPath = path.resolve(__dirname, '..', 'fabric', 'connection-profile.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: 'warehouseUser',
      discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork('botanicalchannel');
    const contract = network.getContract('herbTraceContract');

    return { gateway, contract };
  } catch (error) {
    console.error('Failed to connect to network:', error);
    throw error;
  }
}

// Get warehouse inventory with statistics
router.get('/inventory', async (req, res) => {
  try {
    const totalInventory = warehouseInventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = warehouseInventory.filter(item => item.quantity < item.minStock * 0.5).length;
    const incomingShipments = warehouseShipments.filter(s => s.status === 'pending').length;
    const outgoingOrders = 8; // Mock data

    const stats = {
      totalInventory,
      lowStockItems,
      incomingShipments,
      outgoingOrders
    };

    res.json({
      inventory: warehouseInventory,
      stats
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory data' });
  }
});

// Get warehouse shipments
router.get('/shipments', async (req, res) => {
  try {
    res.json({
      shipments: warehouseShipments
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({ error: 'Failed to fetch shipments data' });
  }
});

// Get environmental monitoring data
router.get('/environmental', async (req, res) => {
  try {
    const avgTemperature = (environmentalSensors.reduce((sum, sensor) => sum + sensor.temperature, 0) / environmentalSensors.length).toFixed(1);
    const avgHumidity = (environmentalSensors.reduce((sum, sensor) => sum + sensor.humidity, 0) / environmentalSensors.length).toFixed(0);

    res.json({
      data: environmentalSensors,
      avgTemperature: parseFloat(avgTemperature),
      avgHumidity: parseInt(avgHumidity)
    });
  } catch (error) {
    console.error('Error fetching environmental data:', error);
    res.status(500).json({ error: 'Failed to fetch environmental data' });
  }
});

// Get recent warehouse activities
router.get('/activities', async (req, res) => {
  try {
    res.json({
      activities: recentActivities
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities data' });
  }
});

// Receive shipment and create processing step on blockchain
router.post('/receive-shipment', async (req, res) => {
  try {
    const { shipmentId, warehouseAddress, receivedAt, location } = req.body;

    // Find and update shipment status
    const shipmentIndex = warehouseShipments.findIndex(s => s.id === shipmentId);
    if (shipmentIndex === -1) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    warehouseShipments[shipmentIndex].status = 'received';
    warehouseShipments[shipmentIndex].receivedAt = receivedAt;
    warehouseShipments[shipmentIndex].receiveLocation = location;

    // Add to inventory
    const newInventoryItem = {
      id: `inv_${Date.now()}`,
      productName: warehouseShipments[shipmentIndex].productName,
      sku: `SKU-${Date.now()}`,
      batchNumber: `B${Date.now()}`,
      quantity: warehouseShipments[shipmentIndex].quantity,
      minStock: 100,
      location: location,
      zone: 'STANDARD',
      lastReceived: receivedAt,
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      condition: 'Good',
      reserved: 0
    };

    warehouseInventory.push(newInventoryItem);

    // Record processing step on blockchain
    try {
      const { gateway, contract } = await connectToNetwork();

      const processingStep = {
        stepId: uuidv4(),
        provenanceId: `PROV_${shipmentId}`,
        stepType: 'WAREHOUSE_RECEIPT',
        facilityType: 'WAREHOUSE',
        facilityAddress: warehouseAddress,
        processedAt: receivedAt,
        location: {
          latitude: 0, // Replace with actual warehouse coordinates
          longitude: 0,
          address: `Warehouse Location: ${location}`
        },
        environmentalConditions: {
          temperature: 22,
          humidity: 50,
          lighting: 'controlled'
        },
        qualityParameters: {
          visualInspection: 'passed',
          packaging: 'intact',
          documentation: 'complete'
        },
        equipment: [`Scanner_${location}`, `Scale_${location}`],
        personnel: ['warehouse_operator'],
        outputQuantity: warehouseShipments[shipmentIndex].quantity,
        certifications: ['GMP', 'ISO22000'],
        notes: `Received shipment ${shipmentId} at ${location}`
      };

      await contract.submitTransaction('createProcessingStep', JSON.stringify(processingStep));
      await gateway.disconnect();

      console.log('Processing step recorded on blockchain');
    } catch (blockchainError) {
      console.error('Blockchain recording failed:', blockchainError);
      // Continue with local update even if blockchain fails
    }

    // Add activity log
    recentActivities.unshift({
      message: `Received shipment ${shipmentId} - ${warehouseShipments[shipmentIndex].productName} (${warehouseShipments[shipmentIndex].quantity} units)`,
      timestamp: receivedAt,
      type: 'RECEIVE'
    });

    res.json({
      success: true,
      message: 'Shipment received successfully',
      inventoryItem: newInventoryItem
    });

  } catch (error) {
    console.error('Error receiving shipment:', error);
    res.status(500).json({ error: 'Failed to receive shipment' });
  }
});

// Create new warehouse processing step
router.post('/processing-step', async (req, res) => {
  try {
    const {
      provenanceId,
      stepType,
      facilityAddress,
      processedAt,
      location,
      environmentalConditions,
      qualityParameters,
      equipment,
      personnel,
      outputQuantity,
      notes
    } = req.body;

    const { gateway, contract } = await connectToNetwork();

    const processingStep = {
      stepId: uuidv4(),
      provenanceId,
      stepType: stepType || 'WAREHOUSE_PROCESSING',
      facilityType: 'WAREHOUSE',
      facilityAddress,
      processedAt: processedAt || new Date().toISOString(),
      location,
      environmentalConditions: environmentalConditions || {
        temperature: 22,
        humidity: 50,
        lighting: 'controlled'
      },
      qualityParameters: qualityParameters || {
        visualInspection: 'passed',
        packaging: 'intact'
      },
      equipment: equipment || [],
      personnel: personnel || ['warehouse_operator'],
      outputQuantity,
      certifications: ['GMP', 'ISO22000'],
      notes
    };

    await contract.submitTransaction('createProcessingStep', JSON.stringify(processingStep));
    await gateway.disconnect();

    // Log activity
    recentActivities.unshift({
      message: `Processing step completed: ${stepType} for ${provenanceId}`,
      timestamp: processedAt || new Date().toISOString(),
      type: 'PROCESS'
    });

    res.json({
      success: true,
      message: 'Processing step recorded successfully',
      stepId: processingStep.stepId
    });

  } catch (error) {
    console.error('Error creating processing step:', error);
    res.status(500).json({ error: 'Failed to create processing step' });
  }
});

// Update inventory item
router.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const itemIndex = warehouseInventory.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    warehouseInventory[itemIndex] = { ...warehouseInventory[itemIndex], ...updates };

    // Log activity
    recentActivities.unshift({
      message: `Updated inventory for ${warehouseInventory[itemIndex].productName}`,
      timestamp: new Date().toISOString(),
      type: 'UPDATE'
    });

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      item: warehouseInventory[itemIndex]
    });

  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Failed to update inventory' });
  }
});

// Create outgoing shipment
router.post('/ship-order', async (req, res) => {
  try {
    const {
      orderId,
      productId,
      quantity,
      destination,
      carrier,
      estimatedDelivery
    } = req.body;

    // Find inventory item
    const itemIndex = warehouseInventory.findIndex(item => item.id === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Product not found in inventory' });
    }

    if (warehouseInventory[itemIndex].quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Update inventory
    warehouseInventory[itemIndex].quantity -= quantity;

    // Record shipment
    const shipment = {
      id: `ship_out_${Date.now()}`,
      orderId,
      productName: warehouseInventory[itemIndex].productName,
      quantity,
      destination,
      carrier,
      estimatedDelivery,
      status: 'dispatched',
      trackingNumber: `TN${Date.now()}`,
      shippedAt: new Date().toISOString()
    };

    // Log activity
    recentActivities.unshift({
      message: `Shipped order ${orderId} - ${warehouseInventory[itemIndex].productName} (${quantity} units) to ${destination}`,
      timestamp: new Date().toISOString(),
      type: 'SHIP'
    });

    res.json({
      success: true,
      message: 'Order shipped successfully',
      shipment,
      updatedInventory: warehouseInventory[itemIndex]
    });

  } catch (error) {
    console.error('Error shipping order:', error);
    res.status(500).json({ error: 'Failed to ship order' });
  }
});

// Get warehouse statistics
router.get('/stats', async (req, res) => {
  try {
    const totalInventory = warehouseInventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = warehouseInventory.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 100)), 0);
    const lowStockItems = warehouseInventory.filter(item => item.quantity < item.minStock * 0.5).length;
    const criticalStockItems = warehouseInventory.filter(item => item.quantity < item.minStock * 0.2).length;
    
    const incomingShipments = warehouseShipments.filter(s => s.status === 'pending' || s.status === 'in_transit').length;
    const receivedToday = warehouseShipments.filter(s => {
      if (!s.receivedAt) return false;
      const today = new Date().toDateString();
      const receivedDate = new Date(s.receivedAt).toDateString();
      return today === receivedDate;
    }).length;

    // Environmental alerts
    const environmentalAlerts = environmentalSensors.filter(sensor => 
      sensor.temperature < 15 || sensor.temperature > 25 || 
      sensor.humidity < 40 || sensor.humidity > 60
    ).length;

    res.json({
      inventory: {
        totalItems: totalInventory,
        totalValue,
        lowStockItems,
        criticalStockItems,
        categories: warehouseInventory.length
      },
      shipments: {
        incoming: incomingShipments,
        receivedToday,
        pending: warehouseShipments.filter(s => s.status === 'pending').length
      },
      environmental: {
        sensorsActive: environmentalSensors.length,
        alerts: environmentalAlerts,
        avgTemperature: (environmentalSensors.reduce((sum, s) => sum + s.temperature, 0) / environmentalSensors.length).toFixed(1),
        avgHumidity: (environmentalSensors.reduce((sum, s) => sum + s.humidity, 0) / environmentalSensors.length).toFixed(0)
      },
      activities: {
        totalToday: recentActivities.filter(a => {
          const today = new Date().toDateString();
          const activityDate = new Date(a.timestamp).toDateString();
          return today === activityDate;
        }).length,
        recentCount: recentActivities.length
      }
    });

  } catch (error) {
    console.error('Error fetching warehouse stats:', error);
    res.status(500).json({ error: 'Failed to fetch warehouse statistics' });
  }
});

module.exports = router;