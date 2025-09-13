"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QrCode, Download, Share2, Package, Leaf, MapPin, Calendar } from "lucide-react";

export default function GenerateQRPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [provenanceData, setProvenanceData] = useState({
    productBatchId: '',
    productName: '',
    species: '',
    manufacturer: '',
    batchNumber: '',
    expiryDate: '',
    dosageForm: '',
    collectionEventIds: '',
    qualityTestIds: '',
    processingStepIds: '',
    currentLatitude: '',
    currentLongitude: '',
    currentFacilityId: '',
    carbonFootprint: '',
    waterUsage: '',
    fairTradeCompliant: false,
    conservationScore: ''
  });

  useEffect(() => {
    if (!user) {
      router.push("/manufacturer/login");
      return;
    }
  }, [user, router]);

  const handleInputChange = (field, value) => {
    setProvenanceData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenerateQR = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      const requiredFields = ['productBatchId', 'productName', 'species', 'manufacturer', 'batchNumber', 'expiryDate'];
      const missingFields = requiredFields.filter(field => !provenanceData[field]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.join(', ')}`);
        setLoading(false);
        return;
      }

      // Create provenance record via API
      const response = await fetch('/api/provenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productBatchId: provenanceData.productBatchId,
          collectionEventIds: provenanceData.collectionEventIds.split(',').filter(id => id.trim()),
          qualityTestIds: provenanceData.qualityTestIds.split(',').filter(id => id.trim()),
          processingStepIds: provenanceData.processingStepIds.split(',').filter(id => id.trim()),
          currentOwner: user.address,
          currentLatitude: parseFloat(provenanceData.currentLatitude) || 0,
          currentLongitude: parseFloat(provenanceData.currentLongitude) || 0,
          currentFacilityId: provenanceData.currentFacilityId || 'FAC_DEFAULT',
          carbonFootprint: parseFloat(provenanceData.carbonFootprint) || 0,
          waterUsage: parseFloat(provenanceData.waterUsage) || 0,
          fairTradeCompliant: provenanceData.fairTradeCompliant,
          conservationScore: parseFloat(provenanceData.conservationScore) || 85,
          productName: provenanceData.productName,
          manufacturer: provenanceData.manufacturer,
          batchNumber: provenanceData.batchNumber,
          expiryDate: provenanceData.expiryDate,
          dosageForm: provenanceData.dosageForm || 'Powder'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create provenance record');
      }

      const result = await response.json();
      setQrCodeDataURL(result.qrCodeDataURL);
      setQrGenerated(true);

    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Error generating QR code: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `QR_${provenanceData.productBatchId}_${provenanceData.batchNumber}.png`;
    link.href = qrCodeDataURL;
    link.click();
  };

  const shareQR = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${provenanceData.productName} - QR Code`,
          text: `Trace the complete journey of ${provenanceData.productName} batch ${provenanceData.batchNumber}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('QR code URL copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Generate QR Code</h1>
            <p className="text-gray-400 mt-2">
              Create a blockchain-verified QR code for your Ayurvedic product batch
            </p>
          </div>
          <Link href="/manufacturer/dashboard">
            <Button variant="outline" className="text-white border-gray-600">
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Product Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Enter the details for blockchain provenance record
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerateQR} className="space-y-6">
                {/* Basic Product Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="productBatchId" className="text-white">Product Batch ID *</Label>
                    <Input
                      id="productBatchId"
                      value={provenanceData.productBatchId}
                      onChange={(e) => handleInputChange('productBatchId', e.target.value)}
                      placeholder="e.g., PB_ASH_2024_001"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="productName" className="text-white">Product Name *</Label>
                    <Input
                      id="productName"
                      value={provenanceData.productName}
                      onChange={(e) => handleInputChange('productName', e.target.value)}
                      placeholder="e.g., Ashwagandha Powder"
                      className="bg-gray-800 border-gray-600 text-white"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="species" className="text-white">Botanical Species *</Label>
                    <Select
                      value={provenanceData.species}
                      onValueChange={(value) => handleInputChange('species', value)}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue placeholder="Select species" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-600">
                        <SelectItem value="Withania somnifera">Withania somnifera (Ashwagandha)</SelectItem>
                        <SelectItem value="Asparagus racemosus">Asparagus racemosus (Shatavari)</SelectItem>
                        <SelectItem value="Bacopa monnieri">Bacopa monnieri (Brahmi)</SelectItem>
                        <SelectItem value="Centella asiatica">Centella asiatica (Gotu Kola)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manufacturer" className="text-white">Manufacturer *</Label>
                      <Input
                        id="manufacturer"
                        value={provenanceData.manufacturer}
                        onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                        placeholder="Company Name"
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="batchNumber" className="text-white">Batch Number *</Label>
                      <Input
                        id="batchNumber"
                        value={provenanceData.batchNumber}
                        onChange={(e) => handleInputChange('batchNumber', e.target.value)}
                        placeholder="e.g., B045"
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate" className="text-white">Expiry Date *</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={provenanceData.expiryDate}
                        onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                        className="bg-gray-800 border-gray-600 text-white"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dosageForm" className="text-white">Dosage Form</Label>
                      <Select
                        value={provenanceData.dosageForm}
                        onValueChange={(value) => handleInputChange('dosageForm', value)}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                          <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-600">
                          <SelectItem value="Powder">Powder</SelectItem>
                          <SelectItem value="Capsule">Capsule</SelectItem>
                          <SelectItem value="Tablet">Tablet</SelectItem>
                          <SelectItem value="Extract">Extract</SelectItem>
                          <SelectItem value="Oil">Oil</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Supply Chain IDs */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Leaf className="w-4 h-4 mr-2" />
                    Supply Chain References
                  </h3>
                  
                  <div>
                    <Label htmlFor="collectionEventIds" className="text-white">Collection Event IDs</Label>
                    <Textarea
                      id="collectionEventIds"
                      value={provenanceData.collectionEventIds}
                      onChange={(e) => handleInputChange('collectionEventIds', e.target.value)}
                      placeholder="COL_001, COL_002, COL_003 (comma separated)"
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="qualityTestIds" className="text-white">Quality Test IDs</Label>
                    <Textarea
                      id="qualityTestIds"
                      value={provenanceData.qualityTestIds}
                      onChange={(e) => handleInputChange('qualityTestIds', e.target.value)}
                      placeholder="QT_001, QT_002, QT_003 (comma separated)"
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="processingStepIds" className="text-white">Processing Step IDs</Label>
                    <Textarea
                      id="processingStepIds"
                      value={provenanceData.processingStepIds}
                      onChange={(e) => handleInputChange('processingStepIds', e.target.value)}
                      placeholder="PS_001, PS_002, PS_003 (comma separated)"
                      className="bg-gray-800 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Location and Sustainability */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Current Location & Sustainability
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="currentLatitude" className="text-white">Latitude</Label>
                      <Input
                        id="currentLatitude"
                        type="number"
                        step="any"
                        value={provenanceData.currentLatitude}
                        onChange={(e) => handleInputChange('currentLatitude', e.target.value)}
                        placeholder="15.2993"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currentLongitude" className="text-white">Longitude</Label>
                      <Input
                        id="currentLongitude"
                        type="number"
                        step="any"
                        value={provenanceData.currentLongitude}
                        onChange={(e) => handleInputChange('currentLongitude', e.target.value)}
                        placeholder="74.1240"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="currentFacilityId" className="text-white">Current Facility ID</Label>
                    <Input
                      id="currentFacilityId"
                      value={provenanceData.currentFacilityId}
                      onChange={(e) => handleInputChange('currentFacilityId', e.target.value)}
                      placeholder="FAC_001"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="carbonFootprint" className="text-white">Carbon Footprint (kg CO2e)</Label>
                      <Input
                        id="carbonFootprint"
                        type="number"
                        step="0.1"
                        value={provenanceData.carbonFootprint}
                        onChange={(e) => handleInputChange('carbonFootprint', e.target.value)}
                        placeholder="245.6"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="waterUsage" className="text-white">Water Usage (liters)</Label>
                      <Input
                        id="waterUsage"
                        type="number"
                        step="0.1"
                        value={provenanceData.waterUsage}
                        onChange={(e) => handleInputChange('waterUsage', e.target.value)}
                        placeholder="1250"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="fairTradeCompliant"
                        checked={provenanceData.fairTradeCompliant}
                        onChange={(e) => handleInputChange('fairTradeCompliant', e.target.checked)}
                        className="rounded border-gray-600"
                      />
                      <Label htmlFor="fairTradeCompliant" className="text-white">Fair Trade Compliant</Label>
                    </div>
                    <div>
                      <Label htmlFor="conservationScore" className="text-white">Conservation Score (0-100)</Label>
                      <Input
                        id="conservationScore"
                        type="number"
                        min="0"
                        max="100"
                        value={provenanceData.conservationScore}
                        onChange={(e) => handleInputChange('conservationScore', e.target.value)}
                        placeholder="85"
                        className="bg-gray-800 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    "Generating QR Code..."
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Generate QR Code
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <QrCode className="w-5 h-5 mr-2" />
                Generated QR Code
              </CardTitle>
              <CardDescription className="text-gray-400">
                Blockchain-verified product provenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {qrGenerated ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg">
                      <img 
                        src={qrCodeDataURL} 
                        alt="Generated QR Code" 
                        className="w-64 h-64"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-300">Product:</span>
                      <span className="text-sm font-medium text-white">{provenanceData.productName}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-300">Batch:</span>
                      <span className="text-sm font-medium text-white">{provenanceData.batchNumber}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-300">Species:</span>
                      <span className="text-sm font-medium text-white">{provenanceData.species}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <span className="text-sm text-gray-300">Sustainability:</span>
                      <div className="flex gap-2">
                        {provenanceData.fairTradeCompliant && (
                          <Badge className="bg-green-600">Fair Trade</Badge>
                        )}
                        <Badge className="bg-blue-600">Score: {provenanceData.conservationScore || 85}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={downloadQR} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button onClick={shareQR} variant="outline" className="flex-1 text-white border-gray-600">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                  <QrCode className="w-16 h-16 mb-4" />
                  <p className="text-center">
                    Fill in the product information and click "Generate QR Code" to create a blockchain-verified QR code for your product.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
