"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertTriangle, 
  Map, 
  Clock, 
  Thermometer,
  Droplets,
  Shield,
  TrendingUp,
  QrCode,
  Download
} from "lucide-react";

export default function VendorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalShipments: 0,
    pendingReceival: 0,
    qualityPassed: 0,
    avgTransitTime: 0
  });
  const [shipments, setShipments] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push("/vendor/login");
      return;
    }
    
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const [shipmentsRes, activitiesRes] = await Promise.all([
        fetch('/api/vendor/shipments'),
        fetch('/api/vendor/activities')
      ]);

      if (shipmentsRes.ok) {
        const shipmentsData = await shipmentsRes.json();
        setShipments(shipmentsData.shipments || []);
        setStats(shipmentsData.stats || stats);
      }

      if (activitiesRes.ok) {
        const activitiesData = await activitiesRes.json();
        setActivities(activitiesData.activities || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReceiveShipment = async (shipmentId) => {
    try {
      const response = await fetch(`/api/vendor/receive-shipment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId,
          vendorAddress: user.address,
          receivedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error receiving shipment:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-600';
      case 'in-transit': return 'bg-blue-600';
      case 'pending': return 'bg-yellow-600';
      case 'quality-check': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'in-transit': return <Truck className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'quality-check': return <Shield className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading vendor dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Monitor Ayurvedic herb shipments and quality tracking
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="text-white border-gray-600">
              Home
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Shipments</CardTitle>
              <Package className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalShipments}</div>
              <p className="text-xs text-gray-400">Active supply chain</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Receival</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingReceival}</div>
              <p className="text-xs text-gray-400">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Quality Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.qualityPassed}%</div>
              <p className="text-xs text-gray-400">Quality success rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Avg Transit Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.avgTransitTime}d</div>
              <p className="text-xs text-gray-400">From manufacturer</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="shipments" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="shipments" className="text-white data-[state=active]:bg-gray-700">
              Shipments
            </TabsTrigger>
            <TabsTrigger value="quality" className="text-white data-[state=active]:bg-gray-700">
              Quality Control
            </TabsTrigger>
            <TabsTrigger value="tracking" className="text-white data-[state=active]:bg-gray-700">
              Real-time Tracking
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-gray-700">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-6">
            <div className="grid gap-6">
              {shipments.length > 0 ? (
                shipments.map((shipment) => (
                  <Card key={shipment.id} className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white flex items-center gap-2">
                            {getStatusIcon(shipment.status)}
                            {shipment.productName}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            Batch: {shipment.batchNumber} • From: {shipment.manufacturer}
                          </CardDescription>
                        </div>
                        <Badge className={`${getStatusColor(shipment.status)} text-white`}>
                          {shipment.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Quantity:</span>
                            <span className="text-white">{shipment.quantity} kg</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Expected:</span>
                            <span className="text-white">{new Date(shipment.expectedDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Transport:</span>
                            <span className="text-white">{shipment.transportMode}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Temperature:</span>
                            <span className="text-white flex items-center gap-1">
                              <Thermometer className="w-3 h-3" />
                              {shipment.temperature}°C
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Humidity:</span>
                            <span className="text-white flex items-center gap-1">
                              <Droplets className="w-3 h-3" />
                              {shipment.humidity}%
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">GPS:</span>
                            <span className="text-white flex items-center gap-1">
                              <Map className="w-3 h-3" />
                              Live Tracking
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm">
                            <span className="text-gray-400">Transit Progress:</span>
                            <Progress 
                              value={shipment.transitProgress} 
                              className="mt-1 bg-gray-700"
                            />
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">ETA:</span>
                            <span className="text-white">{shipment.eta}</span>
                          </div>
                        </div>
                      </div>

                      {shipment.status === 'pending' && (
                        <div className="flex gap-3 pt-4 border-t border-gray-700">
                          <Button 
                            onClick={() => handleReceiveShipment(shipment.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirm Receipt
                          </Button>
                          <Button variant="outline" className="text-white border-gray-600">
                            <QrCode className="w-4 h-4 mr-2" />
                            Generate QR
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No shipments found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Quality Control Tab */}
          <TabsContent value="quality" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Quality Control Dashboard
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor quality tests and certifications for received shipments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Quality control interface will display here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Real-time quality testing results and compliance reports
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Map className="w-5 h-5" />
                  Real-time Shipment Tracking
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor live GPS locations and environmental conditions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Map className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Interactive tracking map will display here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      GPS tracking, temperature monitoring, and route optimization
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Vendor Analytics
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Performance metrics and supply chain insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Analytics dashboard will display here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Delivery performance, quality trends, and operational metrics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Recent Activity */}
        <Card className="bg-gray-900 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-gray-400">
              Latest updates from your supply chain network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border border-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(activity.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.message}</p>
                      <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                    </div>
                    <Badge className={`${getStatusColor(activity.status)} text-white`}>
                      {activity.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}