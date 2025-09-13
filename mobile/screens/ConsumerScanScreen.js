import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Alert,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

export default function ConsumerScanScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCameraPermissions();
  }, []);

  const getCameraPermissions = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Check if it's a TraceAyur QR code (should contain our domain)
      if (data.includes('trace/') || data.includes('customer/trace/')) {
        // Extract provenance ID from URL
        const urlParts = data.split('/');
        const provenanceId = urlParts[urlParts.length - 1];
        
        // Fetch product data from our API
        await fetchProductData(provenanceId);
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This QR code is not from TraceAyur. Please scan a valid product QR code.',
          [{ text: 'Scan Again', onPress: () => resetScanner() }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to process QR code. Please try again.',
        [{ text: 'Scan Again', onPress: () => resetScanner() }]
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProductData = async (provenanceId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/provenance/${provenanceId}`);
      
      if (!response.ok) {
        throw new Error('Product not found');
      }

      const data = await response.json();
      setProductData(data.provenance);
      setScanning(false);
    } catch (error) {
      Alert.alert(
        'Product Not Found',
        'Unable to retrieve product information. The QR code may be invalid or the product data may not be available.',
        [{ text: 'Scan Again', onPress: () => resetScanner() }]
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setScanning(true);
    setProductData(null);
    setLoading(false);
  };

  const openFullTrace = () => {
    if (productData) {
      const url = `http://localhost:3000/customer/trace/${productData.provenanceId}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Unable to open the full traceability page');
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Icon name="camera-alt" size={60} color="#666" />
        <Text style={styles.text}>No access to camera</Text>
        <Text style={styles.subText}>
          Camera permission is required to scan QR codes
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={getCameraPermissions}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.container}
      >
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.text}>Loading product information...</Text>
      </LinearGradient>
    );
  }

  if (productData && !scanning) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Icon name="verified" size={40} color="#4CAF50" />
            <Text style={styles.title}>Product Verified</Text>
            <Text style={styles.subtitle}>Blockchain-secured traceability</Text>
          </View>

          <View style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productName}>
                {productData.productName || 'Ayurvedic Product'}
              </Text>
              <Text style={styles.batchId}>
                Batch: {productData.productBatchId}
              </Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Icon name="business" size={20} color="#4CAF50" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Manufacturer</Text>
                  <Text style={styles.infoValue}>
                    {productData.manufacturer || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Icon name="location-on" size={20} color="#4CAF50" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Current Location</Text>
                  <Text style={styles.infoValue}>
                    {productData.currentFacilityId || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Icon name="eco" size={20} color="#4CAF50" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Carbon Footprint</Text>
                  <Text style={styles.infoValue}>
                    {productData.carbonFootprint} kg CO2e
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Icon name="water-drop" size={20} color="#4CAF50" />
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Water Usage</Text>
                  <Text style={styles.infoValue}>
                    {productData.waterUsage} L
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.sustainabilitySection}>
              <Text style={styles.sectionTitle}>Sustainability</Text>
              <View style={styles.badgeContainer}>
                <View style={[
                  styles.badge, 
                  productData.fairTradeCompliant ? styles.badgeGreen : styles.badgeGray
                ]}>
                  <Icon 
                    name={productData.fairTradeCompliant ? "check-circle" : "cancel"} 
                    size={16} 
                    color="#fff" 
                  />
                  <Text style={styles.badgeText}>Fair Trade</Text>
                </View>
                <View style={styles.badge}>
                  <Icon name="forest" size={16} color="#fff" />
                  <Text style={styles.badgeText}>
                    Conservation: {productData.conservationScore}/100
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.actionSection}>
              <TouchableOpacity style={styles.primaryButton} onPress={openFullTrace}>
                <Icon name="timeline" size={20} color="#fff" />
                <Text style={styles.buttonText}>View Full Journey</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={resetScanner}>
                <Icon name="qr-code-scanner" size={20} color="#4CAF50" />
                <Text style={styles.secondaryButtonText}>Scan Another</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.trustIndicators}>
            <View style={styles.trustItem}>
              <Icon name="security" size={24} color="#4CAF50" />
              <Text style={styles.trustText}>Blockchain Secured</Text>
            </View>
            <View style={styles.trustItem}>
              <Icon name="verified-user" size={24} color="#4CAF50" />
              <Text style={styles.trustText}>GPS Verified</Text>
            </View>
            <View style={styles.trustItem}>
              <Icon name="assignment-turned-in" size={24} color="#4CAF50" />
              <Text style={styles.trustText}>Quality Tested</Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.overlay}>
        <View style={styles.topOverlay}>
          <Text style={styles.instructionText}>
            Point your camera at a TraceAyur QR code
          </Text>
        </View>
        
        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>
        
        <View style={styles.bottomOverlay}>
          <TouchableOpacity style={styles.helpButton}>
            <Icon name="help-outline" size={24} color="#fff" />
            <Text style={styles.helpText}>Need help scanning?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  text: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  topOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
  },
  instructionText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  scanArea: {
    width: width * 0.8,
    height: width * 0.8,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 15,
    borderRadius: 25,
  },
  helpText: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 5,
  },
  productCard: {
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  productHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  batchId: {
    fontSize: 14,
    color: '#888',
  },
  infoGrid: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoText: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  sustainabilitySection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 5,
  },
  badgeGreen: {
    backgroundColor: '#4CAF50',
  },
  badgeGray: {
    backgroundColor: '#666',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  actionSection: {
    marginTop: 10,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  trustIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2d2d2d',
    borderRadius: 15,
    padding: 20,
  },
  trustItem: {
    alignItems: 'center',
  },
  trustText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
});