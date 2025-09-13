const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

class FabricClient {
  constructor() {
    this.gateway = new Gateway();
    this.wallet = null;
    this.contract = null;
    this.network = null;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()]
    });
  }

  async initWallet() {
    try {
      // Create a new file system based wallet for managing identities
      const walletPath = path.join(process.cwd(), 'wallet');
      this.wallet = await Wallets.newFileSystemWallet(walletPath);
      this.logger.info(`Wallet path: ${walletPath}`);

      // Check to see if we've already enrolled the user
      const identity = await this.wallet.get('appUser');
      if (!identity) {
        this.logger.info('An identity for the user "appUser" does not exist in the wallet');
        this.logger.info('Run the registerUser.js application before retrying');
        return false;
      }
      
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize wallet: ${error}`);
      return false;
    }
  }

  async connect() {
    try {
      // Load the network configuration
      const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
      const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

      // Create a new gateway for connecting to our peer node
      const connectionOptions = {
        wallet: this.wallet,
        identity: 'appUser',
        discovery: { enabled: true, asLocalhost: true }
      };

      await this.gateway.connect(ccp, connectionOptions);
      this.logger.info('Connected to Fabric gateway');

      // Get the network (channel) our contract is deployed to
      this.network = await this.gateway.getNetwork('mychannel');
      this.logger.info('Connected to channel: mychannel');

      // Get the contract from the network
      this.contract = this.network.getContract('herbTrace');
      this.logger.info('Connected to contract: herbTrace');

      return true;
    } catch (error) {
      this.logger.error(`Failed to connect to Fabric network: ${error}`);
      return false;
    }
  }

  async disconnect() {
    try {
      if (this.gateway) {
        await this.gateway.disconnect();
        this.logger.info('Disconnected from Fabric gateway');
      }
    } catch (error) {
      this.logger.error(`Failed to disconnect: ${error}`);
    }
  }

  // Collection Event operations
  async createCollectionEvent(collectorId, species, latitude, longitude, harvestZoneId, moisture, weight, grade) {
    try {
      const result = await this.contract.submitTransaction(
        'createCollectionEvent',
        collectorId,
        species,
        latitude.toString(),
        longitude.toString(),
        harvestZoneId,
        moisture.toString(),
        weight.toString(),
        grade
      );
      
      this.logger.info(`Collection event created: ${result.toString()}`);
      return result.toString();
    } catch (error) {
      this.logger.error(`Failed to create collection event: ${error}`);
      throw error;
    }
  }

  async addQualityTest(batchId, testType, labId, value, unit, threshold, certificate, validUntil) {
    try {
      const result = await this.contract.submitTransaction(
        'addQualityTest',
        batchId,
        testType,
        labId,
        value.toString(),
        unit,
        threshold.toString(),
        certificate,
        validUntil
      );
      
      this.logger.info(`Quality test added: ${result.toString()}`);
      return result.toString();
    } catch (error) {
      this.logger.error(`Failed to add quality test: ${error}`);
      throw error;
    }
  }

  async addProcessingStep(batchId, stepType, processedBy, startTime, endTime, temperature, humidity, duration, inputWeight, outputWeight, latitude, longitude, facilityId) {
    try {
      const result = await this.contract.submitTransaction(
        'addProcessingStep',
        batchId,
        stepType,
        processedBy,
        startTime,
        endTime,
        temperature.toString(),
        humidity.toString(),
        duration.toString(),
        inputWeight.toString(),
        outputWeight.toString(),
        latitude.toString(),
        longitude.toString(),
        facilityId
      );
      
      this.logger.info(`Processing step added: ${result.toString()}`);
      return result.toString();
    } catch (error) {
      this.logger.error(`Failed to add processing step: ${error}`);
      throw error;
    }
  }

  async createProvenance(productBatchId, collectionEventIds, qualityTestIds, processingStepIds, currentOwner, currentLatitude, currentLongitude, currentFacilityId, carbonFootprint, waterUsage, fairTradeCompliant, conservationScore, productName, manufacturer, batchNumber, expiryDate, dosageForm) {
    try {
      const result = await this.contract.submitTransaction(
        'createProvenance',
        productBatchId,
        collectionEventIds,
        qualityTestIds,
        processingStepIds,
        currentOwner,
        currentLatitude.toString(),
        currentLongitude.toString(),
        currentFacilityId,
        carbonFootprint.toString(),
        waterUsage.toString(),
        fairTradeCompliant.toString(),
        conservationScore.toString(),
        productName,
        manufacturer,
        batchNumber,
        expiryDate,
        dosageForm
      );
      
      this.logger.info(`Provenance created: ${result.toString()}`);
      return result.toString();
    } catch (error) {
      this.logger.error(`Failed to create provenance: ${error}`);
      throw error;
    }
  }

  async transferCustody(provenanceId, newOwner, newLatitude, newLongitude, newFacilityId) {
    try {
      await this.contract.submitTransaction(
        'transferCustody',
        provenanceId,
        newOwner,
        newLatitude.toString(),
        newLongitude.toString(),
        newFacilityId
      );
      
      this.logger.info(`Custody transferred for provenance: ${provenanceId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to transfer custody: ${error}`);
      throw error;
    }
  }

  // Query operations
  async getProvenanceByQR(qrCode) {
    try {
      const result = await this.contract.evaluateTransaction('getProvenanceByQR', qrCode);
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`Failed to get provenance by QR: ${error}`);
      throw error;
    }
  }

  async getCollectionEvent(eventId) {
    try {
      const result = await this.contract.evaluateTransaction('getCollectionEvent', eventId);
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`Failed to get collection event: ${error}`);
      throw error;
    }
  }

  async getQualityTest(testId) {
    try {
      const result = await this.contract.evaluateTransaction('getQualityTest', testId);
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`Failed to get quality test: ${error}`);
      throw error;
    }
  }

  async getProcessingStep(stepId) {
    try {
      const result = await this.contract.evaluateTransaction('getProcessingStep', stepId);
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`Failed to get processing step: ${error}`);
      throw error;
    }
  }

  async getAllCollectionEvents() {
    try {
      const result = await this.contract.evaluateTransaction('getAllCollectionEvents');
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`Failed to get all collection events: ${error}`);
      throw error;
    }
  }

  async getHarvestZone(zoneId) {
    try {
      const result = await this.contract.evaluateTransaction('getHarvestZone', zoneId);
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`Failed to get harvest zone: ${error}`);
      throw error;
    }
  }

  async queryBySpecies(species) {
    try {
      const result = await this.contract.evaluateTransaction('queryBySpecies', species);
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`Failed to query by species: ${error}`);
      throw error;
    }
  }

  async queryByCollector(collectorId) {
    try {
      const result = await this.contract.evaluateTransaction('queryByCollector', collectorId);
      return JSON.parse(result.toString());
    } catch (error) {
      this.logger.error(`Failed to query by collector: ${error}`);
      throw error;
    }
  }

  // Get network events
  async listenForEvents() {
    try {
      const listener = await this.contract.addContractListener('all-events', 'all', (err, event) => {
        if (err) {
          this.logger.error(`Event listener error: ${err}`);
          return;
        }
        
        this.logger.info(`Event received: ${event.eventName}`);
        
        // Emit to connected clients via Socket.IO if available
        if (global.io) {
          global.io.emit('blockchain-event', {
            eventName: event.eventName,
            payload: JSON.parse(event.payload.toString())
          });
        }
      });
      
      this.logger.info('Event listener registered');
      return listener;
    } catch (error) {
      this.logger.error(`Failed to register event listener: ${error}`);
      throw error;
    }
  }
}

module.exports = FabricClient;
