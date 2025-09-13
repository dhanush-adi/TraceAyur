# TraceAyur - Blockchain-Based Botanical Traceability System

## Project Overview

TraceAyur is a comprehensive proof-of-concept blockchain-based botanical traceability system for Ayurvedic herbs, built with Hyperledger Fabric, Next.js, and React Native. The system provides end-to-end traceability from collection to consumer, with geo-fencing, quality validation, and smart labeling capabilities.

## Architecture

### 1. Blockchain Layer (Hyperledger Fabric)
- **Location**: `chaincode/src/herbTraceContract.ts`
- **Purpose**: Smart contracts for geo-fencing, quality gates, supply chain validation
- **Features**: 
  - Collection event validation with GPS coordinates
  - Quality test recording with threshold checking
  - Processing step tracking with environmental conditions
  - Provenance creation with QR code generation
  - Transfer of custody with blockchain immutability

### 2. Backend API (Node.js/Express)
- **Location**: `backend/`
- **Purpose**: REST APIs and real-time communication
- **Key Routes**:
  - `/api/blockchain/*` - Blockchain interaction
  - `/api/collector/*` - Mobile collector operations
  - `/api/quality/*` - Quality test management
  - `/api/dashboard/*` - Dashboard metrics
  - `/api/provenance/*` - QR code and traceability
  - `/api/vendor/*` - Vendor operations
  - `/api/warehouse/*` - Warehouse management

### 3. Frontend (Next.js 15 + React 19)
- **Location**: `frontend/`
- **Purpose**: Web interfaces for all stakeholders
- **Key Pages**:
  - Manufacturer dashboard and QR generation
  - Vendor shipment tracking
  - Warehouse inventory and environmental monitoring
  - Customer traceability interface

### 4. Mobile DApp (React Native/Expo)
- **Location**: `mobile/`
- **Purpose**: Collector interface with offline capabilities
- **Features**:
  - GPS-enabled collection recording
  - Offline data storage with sync
  - Photo documentation
  - Species selection and validation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Hyperledger Fabric 2.5.4 (for production deployment)
- Expo CLI (for mobile development)

### Installation

1. **Backend Setup**
```bash
cd backend
npm install
npm start  # Runs on port 5000
```

2. **Frontend Setup**
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev  # Runs on port 3000
```

3. **Chaincode Setup**
```bash
cd chaincode
npm install
npm run build
```

4. **Mobile Setup**
```bash
cd mobile
npm install
expo start  # Opens Expo development tools
```

### Environment Configuration

Create `.env` files in each directory:

**Backend (.env)**
```env
NODE_ENV=development
PORT=5000
FABRIC_NETWORK_PATH=./fabric/connection-profile.json
FABRIC_WALLET_PATH=./wallet
FABRIC_CHANNEL=botanicalchannel
FABRIC_CONTRACT=herbTraceContract
JWT_SECRET=your-jwt-secret
FIREBASE_SERVICE_ACCOUNT_KEY=path-to-firebase-key.json
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

## Key Features Implemented

### 1. Geo-Fencing and Seasonal Validation
- GPS coordinate validation against permitted harvest zones
- Seasonal restriction enforcement
- Conservation limit tracking

### 2. Quality Testing Integration
- Threshold-based quality validation
- Certificate management
- Lab integration APIs

### 3. Processing Step Tracking
- Environmental condition monitoring
- Equipment and personnel tracking
- Input/output quantity validation

### 4. QR Code Generation and Scanning
- Blockchain-backed provenance QR codes
- Consumer-facing traceability interface
- Complete supply chain visualization

### 5. Multi-Stakeholder Dashboards
- **Collectors**: Mobile app with GPS and offline capabilities
- **Manufacturers**: Batch management and QR generation
- **Vendors**: Shipment tracking and order management
- **Warehouses**: Inventory and environmental monitoring
- **Consumers**: Product journey visualization

### 6. Real-Time Monitoring
- Socket.IO integration for live updates
- Environmental sensor data
- Alert system for threshold violations

## API Documentation

### Blockchain APIs
```
POST /api/blockchain/collection-event
POST /api/blockchain/quality-test
POST /api/blockchain/processing-step
POST /api/blockchain/provenance
GET  /api/blockchain/trace/:qrCode
```

### Collector APIs
```
POST /api/collector/register
POST /api/collector/collect
POST /api/collector/sync
GET  /api/collector/zones
```

### Quality APIs
```
POST /api/quality/test
GET  /api/quality/batch/:batchId
POST /api/quality/certificate
```

### Dashboard APIs
```
GET  /api/dashboard/manufacturer/:id
GET  /api/dashboard/vendor/:id
GET  /api/dashboard/warehouse
GET  /api/dashboard/metrics
```

## Security Features

- JWT-based authentication
- Rate limiting and DDoS protection
- Input validation with Joi schemas
- Helmet security headers
- CORS configuration
- Request logging with Winston

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### Frontend Testing
```bash
cd frontend
npm run build  # Tests compilation
```

### Mobile Testing
```bash
cd mobile
expo start
# Test on device or simulator
```

## Deployment Guide

### Development
1. Start all services as shown in installation
2. Access frontend at http://localhost:3000
3. Backend API at http://localhost:5000
4. Mobile app through Expo

### Production Considerations
1. **Hyperledger Fabric Network**: Deploy production network with multiple organizations
2. **Database**: Replace mock data with MongoDB/PostgreSQL
3. **File Storage**: Integrate with IPFS or cloud storage
4. **Environment**: Configure production environment variables
5. **SSL/TLS**: Enable HTTPS for all endpoints
6. **Load Balancing**: Scale backend APIs horizontally
7. **Mobile Distribution**: Build and distribute through app stores

## Technical Specifications

### Blockchain
- **Platform**: Hyperledger Fabric 2.5.4
- **Language**: TypeScript
- **Consensus**: PBFT (recommended for production)
- **Data Model**: FHIR-inspired structures

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: In-memory (development), MongoDB (production)
- **Real-time**: Socket.IO
- **Security**: JWT, Helmet, Rate Limiting

### Frontend
- **Framework**: Next.js 15 (React 19)
- **UI Library**: shadcn/ui + Tailwind CSS
- **Icons**: Lucide React
- **Theme**: Dark mode optimized
- **Build**: Static generation + SSR

### Mobile
- **Platform**: React Native (Expo 49)
- **Navigation**: React Navigation 6
- **State**: React Hooks + AsyncStorage
- **Camera**: Expo Camera
- **Location**: Expo Location

## Troubleshooting

### Common Issues

1. **TypeScript Decorator Errors**
   - Ensure `experimentalDecorators: true` in tsconfig.json
   - Use TypeScript 4.9.x for chaincode

2. **React Version Conflicts**
   - Use `--legacy-peer-deps` flag for npm install
   - Verify React 19 compatibility

3. **Mobile Dependencies**
   - Update react-native-svg to 14.x
   - Use @react-native-community/netinfo

4. **Backend Connection Issues**
   - Verify port 5000 is available
   - Check Fabric network connectivity
   - Validate environment variables

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions:
- Create an issue in the GitHub repository
- Review API documentation
- Check troubleshooting guide

---

**Note**: This is a proof-of-concept implementation. For production deployment, additional security hardening, scalability considerations, and regulatory compliance measures should be implemented.
