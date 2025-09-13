import { Contract, Context, Info, Returns, Transaction } from 'fabric-contract-api';
import { Iterators } from 'fabric-shim';

// FHIR-style data models
interface CollectionEvent {
  id: string;
  collectorId: string;
  species: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  harvestZoneId: string;
  initialQualityMetrics: {
    moisture: number;
    weight: number;
    grade: string;
  };
  seasonalRestrictions: boolean;
  geoFenceCompliant: boolean;
  blockNumber: number;
  txId: string;
}

interface QualityTest {
  id: string;
  batchId: string;
  testType: 'MOISTURE' | 'PESTICIDE' | 'DNA_BARCODE' | 'HEAVY_METALS' | 'MICROBIOLOGICAL';
  testDate: string;
  labId: string;
  results: {
    value: number;
    unit: string;
    passed: boolean;
    threshold: number;
  };
  certificate: string;
  validUntil: string;
  blockNumber: number;
  txId: string;
}

interface ProcessingStep {
  id: string;
  batchId: string;
  stepType: 'DRYING' | 'GRINDING' | 'STORAGE' | 'PACKAGING' | 'TRANSPORT';
  processedBy: string;
  startTime: string;
  endTime: string;
  conditions: {
    temperature?: number;
    humidity?: number;
    pressure?: number;
    duration: number;
  };
  inputWeight: number;
  outputWeight: number;
  location: {
    latitude: number;
    longitude: number;
    facilityId: string;
  };
  qualityChecks: string[];
  blockNumber: number;
  txId: string;
}

interface Provenance {
  id: string;
  productBatchId: string;
  collectionEvents: string[];
  qualityTests: string[];
  processingSteps: string[];
  currentLocation: {
    latitude: number;
    longitude: number;
    facilityId: string;
  };
  custody: {
    currentOwner: string;
    transferHistory: {
      from: string;
      to: string;
      timestamp: string;
      txId: string;
    }[];
  };
  sustainabilityMetrics: {
    carbonFootprint: number;
    waterUsage: number;
    fairTradeCompliant: boolean;
    conservationScore: number;
  };
  qrCode: string;
  finalProduct: {
    productName: string;
    manufacturer: string;
    batchNumber: string;
    expiryDate: string;
    dosageForm: string;
  };
  blockNumber: number;
  txId: string;
}

interface HarvestZone {
  id: string;
  name: string;
  boundaries: {
    latitude: number;
    longitude: number;
  }[];
  approvedSpecies: string[];
  seasonalRestrictions: {
    species: string;
    startDate: string;
    endDate: string;
  }[];
  conservationLimits: {
    species: string;
    maxHarvestPerSeason: number;
    currentHarvested: number;
  }[];
  active: boolean;
}

// Geo-fencing helper functions
function isPointInPolygon(point: {latitude: number, longitude: number}, polygon: {latitude: number, longitude: number}[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i].latitude > point.latitude) !== (polygon[j].latitude > point.latitude)) &&
        (point.longitude < (polygon[j].longitude - polygon[i].longitude) * (point.latitude - polygon[i].latitude) / (polygon[j].latitude - polygon[i].latitude) + polygon[i].longitude)) {
      inside = !inside;
    }
  }
  return inside;
}

function isInSeason(species: string, date: string, restrictions: {species: string, startDate: string, endDate: string}[]): boolean {
  const restriction = restrictions.find(r => r.species === species);
  if (!restriction) return true;
  
  const checkDate = new Date(date);
  const startDate = new Date(restriction.startDate);
  const endDate = new Date(restriction.endDate);
  
  return checkDate >= startDate && checkDate <= endDate;
}

@Info({ title: 'HerbTraceContract', description: 'Ayurvedic herb traceability smart contract' })
export class HerbTraceContract extends Contract {

  // Initialize the ledger with approved harvest zones
  @Transaction()
  public async initLedger(ctx: Context): Promise<void> {
    const zones: HarvestZone[] = [
      {
        id: 'ZONE_001',
        name: 'Western Ghats Ashwagandha Zone',
        boundaries: [
          { latitude: 15.2993, longitude: 74.1240 },
          { latitude: 15.3593, longitude: 74.1840 },
          { latitude: 15.2393, longitude: 74.2440 },
          { latitude: 15.1793, longitude: 74.1640 }
        ],
        approvedSpecies: ['Withania somnifera', 'Asparagus racemosus'],
        seasonalRestrictions: [
          {
            species: 'Withania somnifera',
            startDate: '2024-10-01',
            endDate: '2025-03-31'
          }
        ],
        conservationLimits: [
          {
            species: 'Withania somnifera',
            maxHarvestPerSeason: 1000,
            currentHarvested: 0
          }
        ],
        active: true
      }
    ];

    for (const zone of zones) {
      await ctx.stub.putState(`ZONE_${zone.id}`, Buffer.from(JSON.stringify(zone)));
    }
  }

  // Create collection event with geo-fencing and seasonal validation
  @Transaction()
  public async createCollectionEvent(
    ctx: Context,
    collectorId: string,
    species: string,
    latitude: number,
    longitude: number,
    harvestZoneId: string,
    moisture: number,
    weight: number,
    grade: string
  ): Promise<string> {
    
    // Validate harvest zone
    const zoneKey = `ZONE_${harvestZoneId}`;
    const zoneBytes = await ctx.stub.getState(zoneKey);
    if (!zoneBytes || zoneBytes.length === 0) {
      throw new Error(`Harvest zone ${harvestZoneId} does not exist`);
    }
    
    const zone: HarvestZone = JSON.parse(zoneBytes.toString());
    
    // Check if zone is active
    if (!zone.active) {
      throw new Error(`Harvest zone ${harvestZoneId} is not active`);
    }
    
    // Check if species is approved for this zone
    if (!zone.approvedSpecies.includes(species)) {
      throw new Error(`Species ${species} is not approved for harvest zone ${harvestZoneId}`);
    }
    
    // Validate geo-fencing
    const collectionPoint = { latitude, longitude };
    const geoFenceCompliant = isPointInPolygon(collectionPoint, zone.boundaries);
    
    if (!geoFenceCompliant) {
      throw new Error('Collection point is outside approved harvest zone boundaries');
    }
    
    // Check seasonal restrictions
    const currentDate = new Date().toISOString();
    const seasonalCompliant = isInSeason(species, currentDate, zone.seasonalRestrictions);
    
    if (!seasonalCompliant) {
      throw new Error(`Collection of ${species} is not allowed in current season`);
    }
    
    // Check conservation limits
    const conservationLimit = zone.conservationLimits.find(c => c.species === species);
    if (conservationLimit && conservationLimit.currentHarvested >= conservationLimit.maxHarvestPerSeason) {
      throw new Error(`Conservation limit exceeded for ${species} in zone ${harvestZoneId}`);
    }
    
    // Create collection event
    const eventId = `COL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const collectionEvent: CollectionEvent = {
      id: eventId,
      collectorId,
      species,
      latitude,
      longitude,
      timestamp: currentDate,
      harvestZoneId,
      initialQualityMetrics: {
        moisture,
        weight,
        grade
      },
      seasonalRestrictions: seasonalCompliant,
      geoFenceCompliant,
      blockNumber: parseInt(ctx.stub.getTxTimestamp().seconds.toString()),
      txId: ctx.stub.getTxID()
    };
    
    // Update conservation limits
    if (conservationLimit) {
      conservationLimit.currentHarvested += weight;
      await ctx.stub.putState(zoneKey, Buffer.from(JSON.stringify(zone)));
    }
    
    await ctx.stub.putState(eventId, Buffer.from(JSON.stringify(collectionEvent)));
    
    // Emit event
    ctx.stub.setEvent('CollectionEventCreated', Buffer.from(JSON.stringify({
      eventId,
      collectorId,
      species,
      weight,
      harvestZoneId
    })));
    
    return eventId;
  }

  // Add quality test results
  @Transaction()
  public async addQualityTest(
    ctx: Context,
    batchId: string,
    testType: string,
    labId: string,
    value: number,
    unit: string,
    threshold: number,
    certificate: string,
    validUntil: string
  ): Promise<string> {
    
    const testId = `QT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const passed = value <= threshold; // Assuming lower values are better (e.g., pesticide levels)
    
    const qualityTest: QualityTest = {
      id: testId,
      batchId,
      testType: testType as any,
      testDate: new Date().toISOString(),
      labId,
      results: {
        value,
        unit,
        passed,
        threshold
      },
      certificate,
      validUntil,
      blockNumber: parseInt(ctx.stub.getTxTimestamp().seconds.toString()),
      txId: ctx.stub.getTxID()
    };
    
    await ctx.stub.putState(testId, Buffer.from(JSON.stringify(qualityTest)));
    
    // Emit event
    ctx.stub.setEvent('QualityTestAdded', Buffer.from(JSON.stringify({
      testId,
      batchId,
      testType,
      passed,
      labId
    })));
    
    return testId;
  }

  // Add processing step
  @Transaction()
  public async addProcessingStep(
    ctx: Context,
    batchId: string,
    stepType: string,
    processedBy: string,
    startTime: string,
    endTime: string,
    temperature: number,
    humidity: number,
    duration: number,
    inputWeight: number,
    outputWeight: number,
    latitude: number,
    longitude: number,
    facilityId: string
  ): Promise<string> {
    
    const stepId = `PS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const processingStep: ProcessingStep = {
      id: stepId,
      batchId,
      stepType: stepType as any,
      processedBy,
      startTime,
      endTime,
      conditions: {
        temperature,
        humidity,
        duration
      },
      inputWeight,
      outputWeight,
      location: {
        latitude,
        longitude,
        facilityId
      },
      qualityChecks: [],
      blockNumber: parseInt(ctx.stub.getTxTimestamp().seconds.toString()),
      txId: ctx.stub.getTxID()
    };
    
    await ctx.stub.putState(stepId, Buffer.from(JSON.stringify(processingStep)));
    
    // Emit event
    ctx.stub.setEvent('ProcessingStepAdded', Buffer.from(JSON.stringify({
      stepId,
      batchId,
      stepType,
      processedBy,
      facilityId
    })));
    
    return stepId;
  }

  // Create complete provenance record
  @Transaction()
  public async createProvenance(
    ctx: Context,
    productBatchId: string,
    collectionEventIds: string,
    qualityTestIds: string,
    processingStepIds: string,
    currentOwner: string,
    currentLatitude: number,
    currentLongitude: number,
    currentFacilityId: string,
    carbonFootprint: number,
    waterUsage: number,
    fairTradeCompliant: boolean,
    conservationScore: number,
    productName: string,
    manufacturer: string,
    batchNumber: string,
    expiryDate: string,
    dosageForm: string
  ): Promise<string> {
    
    const provenanceId = `PROV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const qrCode = `QR_${provenanceId}`;
    
    const provenance: Provenance = {
      id: provenanceId,
      productBatchId,
      collectionEvents: collectionEventIds.split(','),
      qualityTests: qualityTestIds.split(','),
      processingSteps: processingStepIds.split(','),
      currentLocation: {
        latitude: currentLatitude,
        longitude: currentLongitude,
        facilityId: currentFacilityId
      },
      custody: {
        currentOwner,
        transferHistory: []
      },
      sustainabilityMetrics: {
        carbonFootprint,
        waterUsage,
        fairTradeCompliant,
        conservationScore
      },
      qrCode,
      finalProduct: {
        productName,
        manufacturer,
        batchNumber,
        expiryDate,
        dosageForm
      },
      blockNumber: parseInt(ctx.stub.getTxTimestamp().seconds.toString()),
      txId: ctx.stub.getTxID()
    };
    
    await ctx.stub.putState(provenanceId, Buffer.from(JSON.stringify(provenance)));
    
    // Create QR code mapping
    await ctx.stub.putState(qrCode, Buffer.from(provenanceId));
    
    // Emit event
    ctx.stub.setEvent('ProvenanceCreated', Buffer.from(JSON.stringify({
      provenanceId,
      productBatchId,
      qrCode,
      manufacturer
    })));
    
    return provenanceId;
  }

  // Transfer custody
  @Transaction()
  public async transferCustody(
    ctx: Context,
    provenanceId: string,
    newOwner: string,
    newLatitude: number,
    newLongitude: number,
    newFacilityId: string
  ): Promise<void> {
    
    const provenanceBytes = await ctx.stub.getState(provenanceId);
    if (!provenanceBytes || provenanceBytes.length === 0) {
      throw new Error(`Provenance record ${provenanceId} does not exist`);
    }
    
    const provenance: Provenance = JSON.parse(provenanceBytes.toString());
    
    // Add to transfer history
    provenance.custody.transferHistory.push({
      from: provenance.custody.currentOwner,
      to: newOwner,
      timestamp: new Date().toISOString(),
      txId: ctx.stub.getTxID()
    });
    
    // Update current owner and location
    provenance.custody.currentOwner = newOwner;
    provenance.currentLocation = {
      latitude: newLatitude,
      longitude: newLongitude,
      facilityId: newFacilityId
    };
    
    await ctx.stub.putState(provenanceId, Buffer.from(JSON.stringify(provenance)));
    
    // Emit event
    ctx.stub.setEvent('CustodyTransferred', Buffer.from(JSON.stringify({
      provenanceId,
      from: provenance.custody.transferHistory[provenance.custody.transferHistory.length - 1].from,
      to: newOwner,
      facilityId: newFacilityId
    })));
  }

  // Query functions
  @Transaction(false)
  @Returns('string')
  public async getProvenanceByQR(ctx: Context, qrCode: string): Promise<string> {
    const provenanceIdBytes = await ctx.stub.getState(qrCode);
    if (!provenanceIdBytes || provenanceIdBytes.length === 0) {
      throw new Error(`QR code ${qrCode} not found`);
    }
    
    const provenanceId = provenanceIdBytes.toString();
    const provenanceBytes = await ctx.stub.getState(provenanceId);
    
    if (!provenanceBytes || provenanceBytes.length === 0) {
      throw new Error(`Provenance record ${provenanceId} not found`);
    }
    
    return provenanceBytes.toString();
  }

  @Transaction(false)
  @Returns('string')
  public async getCollectionEvent(ctx: Context, eventId: string): Promise<string> {
    const eventBytes = await ctx.stub.getState(eventId);
    if (!eventBytes || eventBytes.length === 0) {
      throw new Error(`Collection event ${eventId} not found`);
    }
    return eventBytes.toString();
  }

  @Transaction(false)
  @Returns('string')
  public async getQualityTest(ctx: Context, testId: string): Promise<string> {
    const testBytes = await ctx.stub.getState(testId);
    if (!testBytes || testBytes.length === 0) {
      throw new Error(`Quality test ${testId} not found`);
    }
    return testBytes.toString();
  }

  @Transaction(false)
  @Returns('string')
  public async getProcessingStep(ctx: Context, stepId: string): Promise<string> {
    const stepBytes = await ctx.stub.getState(stepId);
    if (!stepBytes || stepBytes.length === 0) {
      throw new Error(`Processing step ${stepId} not found`);
    }
    return stepBytes.toString();
  }

  @Transaction(false)
  @Returns('string')
  public async getAllCollectionEvents(ctx: Context): Promise<string> {
    const startKey = 'COL_';
    const endKey = 'COL_~';
    
    const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    const results = [];
    
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
      results.push(JSON.parse(strValue));
      result = await iterator.next();
    }
    
    return JSON.stringify(results);
  }

  @Transaction(false)
  @Returns('string')
  public async getHarvestZone(ctx: Context, zoneId: string): Promise<string> {
    const zoneBytes = await ctx.stub.getState(`ZONE_${zoneId}`);
    if (!zoneBytes || zoneBytes.length === 0) {
      throw new Error(`Harvest zone ${zoneId} not found`);
    }
    return zoneBytes.toString();
  }

  @Transaction(false)
  @Returns('string')
  public async queryBySpecies(ctx: Context, species: string): Promise<string> {
    const queryString = {
      selector: {
        species: species
      }
    };
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = [];
    
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
      results.push(JSON.parse(strValue));
      result = await iterator.next();
    }
    
    return JSON.stringify(results);
  }

  @Transaction(false)
  @Returns('string')
  public async queryByCollector(ctx: Context, collectorId: string): Promise<string> {
    const queryString = {
      selector: {
        collectorId: collectorId
      }
    };
    
    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = [];
    
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
      results.push(JSON.parse(strValue));
      result = await iterator.next();
    }
    
    return JSON.stringify(results);
  }
}
