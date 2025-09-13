"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Award, 
  CheckCircle, 
  Clock, 
  Droplets, 
  Factory, 
  Globe, 
  Heart, 
  Leaf, 
  MapPin, 
  Shield, 
  Thermometer, 
  Trees,
  Truck 
} from "lucide-react";

export default function CustomerTracePage() {
  const params = useParams();
  const provenanceId = params.provenanceId;
  const [loading, setLoading] = useState(true);
  const [traceData, setTraceData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (provenanceId) {
      fetchTraceData();
    }
  }, [provenanceId]);

  const fetchTraceData = async () => {
    try {
      const response = await fetch(`/api/provenance/${provenanceId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product information');
      }

      const data = await response.json();
      
      // Also fetch the full supply chain trace
      const traceResponse = await fetch(`/api/trace/${data.provenance.productBatchId}`);
      const traceInfo = await traceResponse.json();
      
      setTraceData({
        ...data.provenance,
        supplyChain: traceInfo.supplyChain
      });
    } catch (error) {
      console.error('Error fetching trace data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getQualityStatus = (status) => {
    switch (status) {
      case 'pass': return { color: 'bg-green-600', icon: <CheckCircle className="w-4 h-4" /> };
      case 'fail': return { color: 'bg-red-600', icon: <Shield className="w-4 h-4" /> };
      default: return { color: 'bg-gray-600', icon: <Clock className="w-4 h-4" /> };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading product information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700 max-w-md">
          <CardContent className="text-center py-8">
            <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Product Not Found</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/">Return Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!traceData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-gray-900 border-gray-700 max-w-md">
          <CardContent className="text-center py-8">
            <Leaf className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No product data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-3 rounded-full">
              <Leaf className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Product Traceability</h1>
          <p className="text-gray-400">
            Complete journey of your Ayurvedic product from farm to shelf
          </p>
        </div>

        {/* Product Summary */}
        <Card className="bg-gray-900 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white text-2xl text-center">
              {traceData.productName || 'Ayurvedic Product'}
            </CardTitle>
            <CardDescription className="text-gray-400 text-center">
              Batch: {traceData.productBatchId} • Manufacturer: {traceData.manufacturer}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Globe className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Carbon Footprint</p>
                <p className="text-white font-semibold">{traceData.carbonFootprint} kg CO2e</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Water Usage</p>
                <p className="text-white font-semibold">{traceData.waterUsage} L</p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Heart className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Fair Trade</p>
                <p className="text-white font-semibold">
                  {traceData.fairTradeCompliant ? 'Certified' : 'No'}
                </p>
              </div>
              <div className="text-center p-4 bg-gray-800 rounded-lg">
                <Tree className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Conservation</p>
                <p className="text-white font-semibold">{traceData.conservationScore}/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supply Chain Journey */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-700 w-full">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-gray-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="collection" className="text-white data-[state=active]:bg-gray-700">
              Collection
            </TabsTrigger>
            <TabsTrigger value="quality" className="text-white data-[state=active]:bg-gray-700">
              Quality Tests
            </TabsTrigger>
            <TabsTrigger value="processing" className="text-white data-[state=active]:bg-gray-700">
              Processing
            </TabsTrigger>
            <TabsTrigger value="sustainability" className="text-white data-[state=active]:bg-gray-700">
              Sustainability
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Current Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Facility:</span>
                      <span className="text-white">{traceData.currentFacilityId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Coordinates:</span>
                      <span className="text-white">
                        {traceData.currentLatitude}°, {traceData.currentLongitude}°
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Owner:</span>
                      <span className="text-white font-mono text-xs">
                        {traceData.currentOwner.substring(0, 10)}...
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Timeline Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {traceData.supplyChain?.collectionEvents?.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <Leaf className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium">Collection Completed</p>
                          <p className="text-gray-400 text-sm">
                            {traceData.supplyChain.collectionEvents.length} collection events recorded
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {traceData.supplyChain?.qualityTests?.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">Quality Verified</p>
                          <p className="text-gray-400 text-sm">
                            {traceData.supplyChain.qualityTests.length} quality tests passed
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {traceData.supplyChain?.processingSteps?.length > 0 && (
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                        <Factory className="w-5 h-5 text-purple-400" />
                        <div>
                          <p className="text-white font-medium">Processing Complete</p>
                          <p className="text-gray-400 text-sm">
                            {traceData.supplyChain.processingSteps.length} processing steps completed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collection Tab */}
          <TabsContent value="collection" className="space-y-6">
            <div className="grid gap-4">
              {traceData.supplyChain?.collectionEvents?.map((event, index) => (
                <Card key={index} className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-green-400" />
                      Collection Event #{index + 1}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Species:</span>
                          <span className="text-white">{event.species}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Quantity:</span>
                          <span className="text-white">{event.quantity} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date:</span>
                          <span className="text-white">{formatDate(event.timestamp)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Collector:</span>
                          <span className="text-white">{event.collectorName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Location:</span>
                          <span className="text-white">
                            {event.latitude}°, {event.longitude}°
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Validated:</span>
                          <Badge className="bg-green-600">Geo-Verified</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="text-center py-8">
                    <Leaf className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No collection events recorded</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Quality Tests Tab */}
          <TabsContent value="quality" className="space-y-6">
            <div className="grid gap-4">
              {traceData.supplyChain?.qualityTests?.map((test, index) => {
                const status = getQualityStatus(test.result);
                return (
                  <Card key={index} className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-blue-400" />
                          {test.testType}
                        </div>
                        <Badge className={`${status.color} text-white flex items-center gap-1`}>
                          {status.icon}
                          {test.result.toUpperCase()}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Test Date:</span>
                            <span className="text-white">{formatDate(test.timestamp)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Lab:</span>
                            <span className="text-white">{test.certificationBody}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tester:</span>
                            <span className="text-white font-mono text-xs">
                              {test.tester.substring(0, 10)}...
                            </span>
                          </div>
                          {test.certificateUrl && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Certificate:</span>
                              <Button size="sm" className="h-6 text-xs bg-blue-600 hover:bg-blue-700">
                                View
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      {test.testParameters && (
                        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                          <p className="text-gray-400 text-sm mb-2">Test Parameters:</p>
                          <pre className="text-white text-xs font-mono">
                            {JSON.stringify(JSON.parse(test.testParameters), null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              }) || (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No quality tests recorded</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Processing Tab */}
          <TabsContent value="processing" className="space-y-6">
            <div className="grid gap-4">
              {traceData.supplyChain?.processingSteps?.map((step, index) => (
                <Card key={index} className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Factory className="w-5 h-5 text-purple-400" />
                      {step.stepType}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-gray-300">{step.description}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Date:</span>
                            <span className="text-white">{formatDate(step.timestamp)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Facility:</span>
                            <span className="text-white">{step.facilityId}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Processor:</span>
                            <span className="text-white font-mono text-xs">
                              {step.processor.substring(0, 10)}...
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Status:</span>
                            <Badge className="bg-green-600">{step.status}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) || (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="text-center py-8">
                    <Factory className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No processing steps recorded</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Sustainability Tab */}
          <TabsContent value="sustainability" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-400" />
                    Environmental Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Carbon Footprint</span>
                      </div>
                      <span className="text-white font-semibold">{traceData.carbonFootprint} kg CO2e</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Droplets className="w-5 h-5 text-blue-400" />
                        <span className="text-white">Water Usage</span>
                      </div>
                      <span className="text-white font-semibold">{traceData.waterUsage} L</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-green-400" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-green-400" />
                        <span className="text-white">Fair Trade</span>
                      </div>
                      <Badge className={traceData.fairTradeCompliant ? "bg-green-600" : "bg-gray-600"}>
                        {traceData.fairTradeCompliant ? "Certified" : "Not Certified"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Tree className="w-5 h-5 text-green-400" />
                        <span className="text-white">Conservation Score</span>
                      </div>
                      <span className="text-white font-semibold">{traceData.conservationScore}/100</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center mt-8 pb-8">
          <p className="text-gray-400 text-sm mb-4">
            This product information is secured by blockchain technology
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/">Learn More About TraceAyur</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}