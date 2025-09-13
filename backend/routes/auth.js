const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Demo stakeholder credentials - In production, these would be in a secure database
const stakeholderCredentials = {
  farmer: {
    'FARM001': {
      farmerId: 'FARM001',
      landCertificate: 'LC2024001',
      gpsCoordinates: '12.9716,77.5946',
      password: 'harvest2024',
      name: 'TraceAyur Organic Farm',
      fabricId: 'FABRIC_FARMER_001',
      farmDetails: {
        farmSize: '10 acres',
        organicCertified: true,
        crops: ['Turmeric', 'Ashwagandha', 'Brahmi']
      }
    }
  },
  manufacturer: {
    'manufacturer': {
      username: 'manufacturer',
      password: 'password',
      name: 'TraceAyur Manufacturing',
      fabricId: 'FABRIC_MFG_001',
      facilities: ['Processing', 'Packaging', 'Quality Control']
    }
  },
  laboratory: {
    'LAB001': {
      labId: 'LAB001',
      naacertificate: 'NABL-T-12345',
      labLicense: 'AYUSH-LAB-2024-001',
      technicianId: 'TECH001',
      password: 'test2024',
      name: 'TraceAyur Quality Testing Lab',
      fabricId: 'FABRIC_LAB_001',
      accreditation: 'NABL Accredited',
      specialization: ['Ayurvedic Herbs', 'Phytochemical Analysis', 'Heavy Metal Testing']
    }
  },
  vendor: {
    'vendor': {
      username: 'vendor',
      password: 'password',
      name: 'TraceAyur Vendor',
      fabricId: 'FABRIC_VENDOR_001',
      storeDetails: ['Retail', 'Distribution']
    }
  },
  warehouse: {
    'warehouse': {
      username: 'warehouse',
      password: 'password',
      name: 'TraceAyur Warehouse',
      fabricId: 'FABRIC_WAREHOUSE_001',
      facilities: ['Storage', 'Distribution', 'Quality Control']
    }
  },
  customer: {
    'customer': {
      username: 'customer',
      password: 'password',
      name: 'TraceAyur Customer',
      fabricId: 'FABRIC_CUSTOMER_001'
    }
  }
};

// Farmer authentication endpoint
router.post('/login/farmer', (req, res) => {
  try {
    const { farmerId, landCertificate, gpsCoordinates, password } = req.body;

    // Validate required fields
    if (!farmerId || !landCertificate || !gpsCoordinates || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All farmer credentials are required' 
      });
    }

    // Check credentials
    const farmer = stakeholderCredentials.farmer[farmerId];
    if (!farmer || 
        farmer.landCertificate !== landCertificate || 
        !gpsCoordinates.includes(farmer.gpsCoordinates) ||
        farmer.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid farmer credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: farmerId, 
        role: 'farmer', 
        fabricId: farmer.fabricId 
      },
      process.env.JWT_SECRET || 'traceayur_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: {
        id: farmerId,
        role: 'farmer',
        name: farmer.name,
        fabricId: farmer.fabricId,
        farmDetails: farmer.farmDetails,
        permissions: ['crop-registration', 'harvest-logging', 'quality-testing']
      },
      token
    });

  } catch (error) {
    console.error('Farmer login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Laboratory authentication endpoint
router.post('/login/laboratory', (req, res) => {
  try {
    const { labId, naacertificate, labLicense, technicianId, password } = req.body;

    // Validate required fields
    if (!labId || !naacertificate || !labLicense || !technicianId || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All laboratory credentials are required' 
      });
    }

    // Check credentials
    const lab = stakeholderCredentials.laboratory[labId];
    if (!lab || 
        lab.naacertificate !== naacertificate || 
        lab.labLicense !== labLicense ||
        lab.technicianId !== technicianId ||
        lab.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid laboratory credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: labId, 
        role: 'laboratory', 
        fabricId: lab.fabricId 
      },
      process.env.JWT_SECRET || 'traceayur_secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      user: {
        id: labId,
        role: 'laboratory',
        name: lab.name,
        fabricId: lab.fabricId,
        accreditation: lab.accreditation,
        specialization: lab.specialization,
        permissions: ['quality-testing', 'report-generation', 'certificate-issuance']
      },
      token
    });

  } catch (error) {
    console.error('Laboratory login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Generic stakeholder authentication endpoint for simple credentials
router.post('/login/:stakeholderType', (req, res) => {
  try {
    const { stakeholderType } = req.params;
    const { username, password } = req.body;

    // Validate stakeholder type
    if (!stakeholderCredentials[stakeholderType]) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid stakeholder type' 
      });
    }

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Check credentials
    const stakeholder = stakeholderCredentials[stakeholderType][username];
    if (!stakeholder || stakeholder.password !== password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: username, 
        role: stakeholderType, 
        fabricId: stakeholder.fabricId 
      },
      process.env.JWT_SECRET || 'traceayur_secret',
      { expiresIn: '24h' }
    );

    // Define permissions based on stakeholder type
    const permissions = {
      manufacturer: ['dashboard', 'qr-generation', 'batch-management'],
      vendor: ['dashboard', 'product-scanning', 'inventory-management'],
      warehouse: ['dashboard', 'checkpoint-scanning', 'inventory-tracking'],
      customer: ['product-scanning', 'traceability-view']
    };

    res.json({
      success: true,
      user: {
        id: username,
        role: stakeholderType,
        name: stakeholder.name,
        fabricId: stakeholder.fabricId,
        permissions: permissions[stakeholderType] || []
      },
      token
    });

  } catch (error) {
    console.error(`${stakeholderType} login error:`, error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Token verification middleware
router.get('/verify-token', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'traceayur_secret');
    
    res.json({
      success: true,
      user: decoded
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

module.exports = router;