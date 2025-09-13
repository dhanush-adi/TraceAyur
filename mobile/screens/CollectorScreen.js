import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import NetInfo from '@react-native-community/netinfo';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

export default function CollectorScreen() {
  const [collectorData, setCollectorData] = useState({
    collectorId: '',
    collectorName: '',
    phoneNumber: '',
    location: null,
    isRegistered: false
  });

  const [collectionForm, setCollectionForm] = useState({
    species: '',
    quantity: '',
    harvestingMethod: 'hand-picking',
    qualityNotes: '',
    weatherConditions: '',
    soilType: '',
    photos: []
  });

  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [locationStatus, setLocationStatus] = useState('Getting location...');

  const species = [
    { id: 'withania_somnifera', name: 'Withania somnifera', common: 'Ashwagandha' },
    { id: 'asparagus_racemosus', name: 'Asparagus racemosus', common: 'Shatavari' },
    { id: 'bacopa_monnieri', name: 'Bacopa monnieri', common: 'Brahmi' },
    { id: 'centella_asiatica', name: 'Centella asiatica', common: 'Gotu Kola' },
    { id: 'terminalia_chebula', name: 'Terminalia chebula', common: 'Haritaki' },
    { id: 'emblica_officinalis', name: 'Emblica officinalis', common: 'Amla' }
  ];

  useEffect(() => {
    initializeCollector();
    setupNetworkListener();
    getLocationPermissions();
    loadPendingUploads();
  }, []);

  const initializeCollector = async () => {
    try {
      const storedData = await AsyncStorage.getItem('collectorData');
      if (storedData) {
        setCollectorData(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Error loading collector data:', error);
    }
  };

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected);
      if (state.isConnected) {
        syncPendingData();
      }
    });
    return unsubscribe;
  };

  const getLocationPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is required for geotagging collections');
        setLocationStatus('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      
      setCollectorData(prev => ({
        ...prev,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp
        }
      }));
      
      setLocationStatus(`Lat: ${location.coords.latitude.toFixed(6)}, Lng: ${location.coords.longitude.toFixed(6)}`);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationStatus('Location unavailable');
    }
  };

  const loadPendingUploads = async () => {
    try {
      const pending = await AsyncStorage.getItem('pendingUploads');
      if (pending) {
        setPendingUploads(JSON.parse(pending));
      }
    } catch (error) {
      console.error('Error loading pending uploads:', error);
    }
  };

  const registerCollector = async () => {
    if (!collectorData.collectorName || !collectorData.phoneNumber) {
      Alert.alert('Error', 'Please fill in all collector details');
      return;
    }

    const newCollectorData = {
      ...collectorData,
      collectorId: `COL_${Date.now()}`,
      isRegistered: true
    };

    try {
      await AsyncStorage.setItem('collectorData', JSON.stringify(newCollectorData));
      setCollectorData(newCollectorData);
      Alert.alert('Success', 'Collector registered successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to register collector');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCollectionForm(prev => ({
          ...prev,
          photos: [...prev.photos, result.assets[0]]
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const submitCollection = async () => {
    if (!collectorData.isRegistered) {
      Alert.alert('Error', 'Please register as a collector first');
      return;
    }

    if (!collectionForm.species || !collectionForm.quantity) {
      Alert.alert('Error', 'Please fill in species and quantity');
      return;
    }

    if (!collectorData.location) {
      Alert.alert('Error', 'Location data is required for collection');
      return;
    }

    setLoading(true);

    const collectionEvent = {
      eventId: `COL_${Date.now()}`,
      collectorId: collectorData.collectorId,
      collectorName: collectorData.collectorName,
      species: collectionForm.species,
      quantity: parseFloat(collectionForm.quantity),
      harvestingMethod: collectionForm.harvestingMethod,
      qualityNotes: collectionForm.qualityNotes,
      weatherConditions: collectionForm.weatherConditions,
      soilType: collectionForm.soilType,
      latitude: collectorData.location.latitude,
      longitude: collectorData.location.longitude,
      accuracy: collectorData.location.accuracy,
      timestamp: new Date().toISOString(),
      photos: collectionForm.photos,
      syncStatus: 'pending'
    };

    try {
      if (isOnline) {
        // Try to submit directly to blockchain
        await submitToBlockchain(collectionEvent);
        Alert.alert('Success', 'Collection event submitted successfully!');
      } else {
        // Store locally for later sync
        await storeForLaterSync(collectionEvent);
        Alert.alert('Offline Mode', 'Collection saved locally. Will sync when online.');
      }

      // Reset form
      setCollectionForm({
        species: '',
        quantity: '',
        harvestingMethod: 'hand-picking',
        qualityNotes: '',
        weatherConditions: '',
        soilType: '',
        photos: []
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to submit collection: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitToBlockchain = async (collectionEvent) => {
    try {
      const response = await fetch('http://localhost:3001/api/collector/collection-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(collectionEvent)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('Blockchain submission successful:', result);
    } catch (error) {
      console.error('Blockchain submission failed:', error);
      await storeForLaterSync(collectionEvent);
      throw error;
    }
  };

  const storeForLaterSync = async (collectionEvent) => {
    try {
      const newPending = [...pendingUploads, collectionEvent];
      await AsyncStorage.setItem('pendingUploads', JSON.stringify(newPending));
      setPendingUploads(newPending);
    } catch (error) {
      console.error('Failed to store for later sync:', error);
    }
  };

  const syncPendingData = async () => {
    if (pendingUploads.length === 0) return;

    for (const event of pendingUploads) {
      try {
        await submitToBlockchain(event);
        // Remove from pending on success
        const updatedPending = pendingUploads.filter(item => item.eventId !== event.eventId);
        setPendingUploads(updatedPending);
        await AsyncStorage.setItem('pendingUploads', JSON.stringify(updatedPending));
      } catch (error) {
        console.error('Failed to sync event:', event.eventId, error);
      }
    }
  };

  const selectSpecies = (selectedSpecies) => {
    setCollectionForm(prev => ({
      ...prev,
      species: selectedSpecies.name
    }));
    setShowSpeciesModal(false);
  };

  if (!collectorData.isRegistered) {
    return (
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <Icon name="eco" size={50} color="#4CAF50" />
            <Text style={styles.title}>Collector Registration</Text>
            <Text style={styles.subtitle}>Join the TraceAyur network</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Collector Name</Text>
              <TextInput
                style={styles.input}
                value={collectorData.collectorName}
                onChangeText={(text) => setCollectorData(prev => ({...prev, collectorName: text}))}
                placeholder="Enter your full name"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={collectorData.phoneNumber}
                onChangeText={(text) => setCollectorData(prev => ({...prev, phoneNumber: text}))}
                placeholder="Enter phone number"
                placeholderTextColor="#888"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.locationContainer}>
              <Icon name="location-on" size={24} color="#4CAF50" />
              <Text style={styles.locationText}>{locationStatus}</Text>
            </View>

            <TouchableOpacity style={styles.registerButton} onPress={registerCollector}>
              <Text style={styles.buttonText}>Register Collector</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#1a1a1a', '#2d2d2d']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.statusBar}>
            <View style={styles.statusItem}>
              <Icon 
                name={isOnline ? "wifi" : "wifi-off"} 
                size={20} 
                color={isOnline ? "#4CAF50" : "#f44336"} 
              />
              <Text style={[styles.statusText, {color: isOnline ? "#4CAF50" : "#f44336"}]}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
            {pendingUploads.length > 0 && (
              <View style={styles.statusItem}>
                <Icon name="sync" size={20} color="#ff9800" />
                <Text style={[styles.statusText, {color: "#ff9800"}]}>
                  {pendingUploads.length} pending
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.welcome}>Welcome, {collectorData.collectorName}!</Text>
          <Text style={styles.subtitle}>Record your herb collection</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Species</Text>
            <TouchableOpacity 
              style={styles.speciesButton}
              onPress={() => setShowSpeciesModal(true)}
            >
              <Text style={styles.speciesButtonText}>
                {collectionForm.species || "Select botanical species"}
              </Text>
              <Icon name="arrow-drop-down" size={24} color="#888" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quantity (kg)</Text>
            <TextInput
              style={styles.input}
              value={collectionForm.quantity}
              onChangeText={(text) => setCollectionForm(prev => ({...prev, quantity: text}))}
              placeholder="Enter quantity in kg"
              placeholderTextColor="#888"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Harvesting Method</Text>
            <View style={styles.radioGroup}>
              {['hand-picking', 'cutting', 'digging'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={styles.radioOption}
                  onPress={() => setCollectionForm(prev => ({...prev, harvestingMethod: method}))}
                >
                  <Icon 
                    name={collectionForm.harvestingMethod === method ? "radio-button-checked" : "radio-button-unchecked"}
                    size={20}
                    color="#4CAF50"
                  />
                  <Text style={styles.radioText}>{method.replace('-', ' ').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Quality Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={collectionForm.qualityNotes}
              onChangeText={(text) => setCollectionForm(prev => ({...prev, qualityNotes: text}))}
              placeholder="Notes about plant quality, condition, etc."
              placeholderTextColor="#888"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Weather</Text>
              <TextInput
                style={styles.input}
                value={collectionForm.weatherConditions}
                onChangeText={(text) => setCollectionForm(prev => ({...prev, weatherConditions: text}))}
                placeholder="Sunny, rainy, etc."
                placeholderTextColor="#888"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Soil Type</Text>
              <TextInput
                style={styles.input}
                value={collectionForm.soilType}
                onChangeText={(text) => setCollectionForm(prev => ({...prev, soilType: text}))}
                placeholder="Sandy, clay, etc."
                placeholderTextColor="#888"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Photos ({collectionForm.photos.length})</Text>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Icon name="camera-alt" size={24} color="#4CAF50" />
              <Text style={styles.photoButtonText}>Take Photo</Text>
            </TouchableOpacity>
            
            {collectionForm.photos.length > 0 && (
              <ScrollView horizontal style={styles.photoPreview}>
                {collectionForm.photos.map((photo, index) => (
                  <Image key={index} source={{uri: photo.uri}} style={styles.thumbnail} />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.locationInfo}>
            <Icon name="my-location" size={20} color="#4CAF50" />
            <Text style={styles.locationText}>{locationStatus}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.disabledButton]} 
            onPress={submitCollection}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="send" size={20} color="#fff" />
                <Text style={styles.buttonText}>Submit Collection</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Species Selection Modal */}
        <Modal
          visible={showSpeciesModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Species</Text>
                <TouchableOpacity onPress={() => setShowSpeciesModal(false)}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <ScrollView>
                {species.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.speciesItem}
                    onPress={() => selectSpecies(item)}
                  >
                    <View>
                      <Text style={styles.speciesName}>{item.name}</Text>
                      <Text style={styles.speciesCommon}>{item.common}</Text>
                    </View>
                    <Icon name="chevron-right" size={24} color="#888" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  speciesButton: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  speciesButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  photoButton: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  photoButtonText: {
    color: '#4CAF50',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoPreview: {
    marginTop: 10,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationText: {
    color: '#4CAF50',
    marginLeft: 10,
    fontSize: 12,
  },
  registerButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2d2d2d',
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  speciesItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  speciesName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  speciesCommon: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
});