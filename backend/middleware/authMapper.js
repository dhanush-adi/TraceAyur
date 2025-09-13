// Authentication middleware to map Stacks users to Fabric identities
const jwt = require('jsonwebtoken');

class AuthMapper {
  constructor() {
    this.userRoleMapping = new Map();
    this.fabricIdentities = {
      manufacturer: 'manufacturer',
      collector: 'collector', 
      vendor: 'vendor',
      warehouse: 'warehouse',
      customer: 'appUser'
    };
  }

  // Map Stacks address to user role
  mapUserRole(stacksAddress, role) {
    this.userRoleMapping.set(stacksAddress, role);
  }

  // Get Fabric identity for Stacks user
  getFabricIdentity(stacksAddress) {
    const role = this.userRoleMapping.get(stacksAddress);
    return this.fabricIdentities[role] || 'appUser';
  }

  // Middleware to authenticate and set Fabric identity
  authenticate(requiredRole = null) {
    return (req, res, next) => {
      try {
        // Check for Stacks address in headers or body
        const stacksAddress = req.headers['x-stacks-address'] || 
                            req.body.stacksAddress || 
                            req.query.stacksAddress;

        if (!stacksAddress) {
          return res.status(401).json({ error: 'Stacks address required' });
        }

        // Get user role and map to Fabric identity
        const userRole = this.userRoleMapping.get(stacksAddress);
        const fabricIdentity = this.getFabricIdentity(stacksAddress);

        // Check role permissions if required
        if (requiredRole && userRole !== requiredRole) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Add to request context
        req.user = {
          stacksAddress,
          role: userRole,
          fabricIdentity
        };

        next();
      } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Authentication failed' });
      }
    };
  }

  // Register a new user with role
  registerUser(stacksAddress, role, userData = {}) {
    this.mapUserRole(stacksAddress, role);
    
    // In production, you might want to persist this to a database
    console.log(`Registered user: ${stacksAddress} with role: ${role}`);
    
    return {
      stacksAddress,
      role,
      fabricIdentity: this.getFabricIdentity(stacksAddress),
      ...userData
    };
  }

  // Initialize with some default users for testing
  initializeTestUsers() {
    // These would typically come from a database
    const testUsers = [
      { address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', role: 'manufacturer' },
      { address: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG', role: 'collector' },
      { address: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC', role: 'vendor' },
      { address: 'ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP', role: 'warehouse' }
    ];

    testUsers.forEach(user => {
      this.mapUserRole(user.address, user.role);
    });

    console.log('Test users initialized');
  }
}

module.exports = AuthMapper;