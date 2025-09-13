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
  Thermometer, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  MapPin,
  Droplets,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Archive,
  ShoppingCart,
  Warehouse
} from "lucide-react";

export default function WarehouseDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInventory: 0,
    incomingShipments: 0,
    outgoingOrders: 0,
    lowStockItems: 0,
    avgTemperature: 0,
    avgHumidity: 0
  });
  const [inventory, setInventory] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [environmentalData, setEnvironmentalData] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!user) {
      router.push("/warehouse/login");
      return;
    }
    
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      const [inventoryRes, shipmentsRes, environmentalRes, activitiesRes] = await Promise.all([
        fetch('/api/warehouse/inventory'),
        fetch('/api/warehouse/shipments'),
        fetch('/api/warehouse/environmental'),
        fetch('/api/warehouse/activities')
      ]);

      if (inventoryRes.ok) {
        const inventoryData = await inventoryRes.json();
        setInventory(inventoryData.inventory || []);
        setStats(prev => ({ ...prev, ...inventoryData.stats }));
      }

      if (shipmentsRes.ok) {
        const shipmentsData = await shipmentsRes.json();
        setShipments(shipmentsData.shipments || []);
      }

      if (environmentalRes.ok) {
        const environmentalData = await environmentalRes.json();
        setEnvironmentalData(environmentalData.data || []);
        setStats(prev => ({ 
          ...prev, 
          avgTemperature: environmentalData.avgTemperature || 0,
          avgHumidity: environmentalData.avgHumidity || 0 
        }));
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
      const response = await fetch('/api/warehouse/receive-shipment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shipmentId,
          warehouseAddress: user.address,
          receivedAt: new Date().toISOString(),
          location: 'DOCK_A'
        })
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error('Error receiving shipment:', error);
    }
  };

  const getStockStatus = (quantity, minStock) => {
    const ratio = quantity / minStock;
    if (ratio < 0.2) return { status: 'critical', color: 'bg-red-600', icon: <AlertTriangle className="w-4 h-4" /> };
    if (ratio < 0.5) return { status: 'low', color: 'bg-yellow-600', icon: <Clock className="w-4 h-4" /> };
    return { status: 'good', color: 'bg-green-600', icon: <CheckCircle className="w-4 h-4" /> };
  };

  const getEnvironmentalStatus = (temp, humidity) => {
    const tempOk = temp >= 15 && temp <= 25;
    const humidityOk = humidity >= 40 && humidity <= 60;
    
    if (tempOk && humidityOk) return { status: 'optimal', color: 'bg-green-600' };
    if (tempOk || humidityOk) return { status: 'caution', color: 'bg-yellow-600' };
    return { status: 'alert', color: 'bg-red-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading warehouse dashboard...</p>
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
            <h1 className="text-3xl font-bold">Warehouse Operations</h1>
            <p className="text-gray-400 mt-2">
              Monitor inventory, shipments, and environmental conditions
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" className="text-white border-gray-600">
              Home
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Inventory</CardTitle>
              <Package className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalInventory}</div>
              <p className="text-xs text-gray-400">Items in stock</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Incoming</CardTitle>
              <Truck className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.incomingShipments}</div>
              <p className="text-xs text-gray-400">Pending receipt</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Outgoing</CardTitle>
              <ShoppingCart className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.outgoingOrders}</div>
              <p className="text-xs text-gray-400">Orders to fulfill</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Low Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.lowStockItems}</div>
              <p className="text-xs text-gray-400">Items below threshold</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Temperature</CardTitle>
              <Thermometer className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.avgTemperature}°C</div>
              <p className="text-xs text-gray-400">Average facility temp</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Humidity</CardTitle>
              <Droplets className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.avgHumidity}%</div>
              <p className="text-xs text-gray-400">Average humidity</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="inventory" className="space-y-6">
          <TabsList className="bg-gray-900 border-gray-700">
            <TabsTrigger value="inventory" className="text-white data-[state=active]:bg-gray-700">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="shipments" className="text-white data-[state=active]:bg-gray-700">
              Shipments
            </TabsTrigger>
            <TabsTrigger value="environmental" className="text-white data-[state=active]:bg-gray-700">
              Environmental
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-gray-700">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="grid gap-4">
              {inventory.length > 0 ? (
                inventory.map((item) => {
                  const stockStatus = getStockStatus(item.quantity, item.minStock);
                  return (
                    <Card key={item.id} className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-white">{item.productName}</CardTitle>
                            <CardDescription className="text-gray-400">
                              SKU: {item.sku} • Batch: {item.batchNumber}
                            </CardDescription>
                          </div>
                          <Badge className={`${stockStatus.color} text-white flex items-center gap-1`}>
                            {stockStatus.icon}
                            {stockStatus.status.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Current Stock:</span>
                              <span className="text-white font-semibold">{item.quantity} units</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Min Stock:</span>
                              <span className="text-white">{item.minStock} units</span>
                            </div>
                            <Progress 
                              value={(item.quantity / item.minStock) * 100} 
                              className="bg-gray-700"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Location:</span>
                              <span className="text-white">{item.location}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Zone:</span>
                              <span className="text-white">{item.zone}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Last Received:</span>
                              <span className="text-white">{new Date(item.lastReceived).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Expiry Date:</span>
                              <span className="text-white">{new Date(item.expiryDate).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Condition:</span>
                              <span className="text-white">{item.condition}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Reserved:</span>
                              <span className="text-white">{item.reserved} units</span>
                            </div>
                          </div>
                        </div>

                        {stockStatus.status === 'critical' && (
                          <div className="mt-4 p-3 bg-red-900 border border-red-700 rounded-lg">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-red-400 font-medium">Critical Stock Level</span>
                            </div>
                            <p className="text-red-300 text-sm mt-1">
                              Immediate reorder required. Current stock below safety threshold.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="text-center py-8">
                    <Archive className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No inventory items found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments" className="space-y-6">
            <div className="grid gap-4">
              {shipments.length > 0 ? (
                shipments.map((shipment) => (
                  <Card key={shipment.id} className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-white">{shipment.productName}</CardTitle>
                          <CardDescription className="text-gray-400">
                            From: {shipment.origin} • To: {shipment.destination}
                          </CardDescription>
                        </div>
                        <Badge className={`${shipment.status === 'received' ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
                          {shipment.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Quantity:</span>
                            <span className="text-white">{shipment.quantity} units</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Expected:</span>
                            <span className="text-white">{new Date(shipment.expectedDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Carrier:</span>
                            <span className="text-white">{shipment.carrier}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Tracking:</span>
                            <span className="text-white font-mono text-xs">{shipment.trackingNumber}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Priority:</span>
                            <Badge className={shipment.priority === 'high' ? 'bg-red-600' : 'bg-blue-600'}>
                              {shipment.priority}
                            </Badge>
                          </div>
                          {shipment.status === 'pending' && (
                            <Button 
                              onClick={() => handleReceiveShipment(shipment.id)}
                              size="sm"
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Receive
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gray-900 border-gray-700">
                  <CardContent className="text-center py-8">
                    <Truck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No pending shipments</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Environmental Tab */}
          <TabsContent value="environmental" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {environmentalData.length > 0 ? (
                environmentalData.map((sensor) => {
                  const status = getEnvironmentalStatus(sensor.temperature, sensor.humidity);
                  return (
                    <Card key={sensor.sensorId} className="bg-gray-900 border-gray-700">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white">{sensor.location}</CardTitle>
                          <Badge className={`${status.color} text-white`}>
                            {status.status.toUpperCase()}
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-400">
                          Sensor ID: {sensor.sensorId}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-gray-800 rounded-lg">
                            <Thermometer className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Temperature</p>
                            <p className="text-2xl font-bold text-white">{sensor.temperature}°C</p>
                            <p className="text-xs text-gray-500">Target: 15-25°C</p>
                          </div>
                          <div className="text-center p-4 bg-gray-800 rounded-lg">
                            <Droplets className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Humidity</p>
                            <p className="text-2xl font-bold text-white">{sensor.humidity}%</p>
                            <p className="text-xs text-gray-500">Target: 40-60%</p>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-400">
                          Last updated: {new Date(sensor.lastUpdate).toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="bg-gray-900 border-gray-700 md:col-span-2">
                  <CardContent className="text-center py-8">
                    <Thermometer className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No environmental sensors configured</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Warehouse Analytics
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Operational metrics and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Analytics dashboard will display here</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Inventory turnover, efficiency metrics, and trend analysis
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
              Latest warehouse operations and events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border border-gray-700 rounded-lg">
                    <div className="flex-shrink-0">
                      <Warehouse className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.message}</p>
                      <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                    </div>
                    <Badge className="bg-blue-600 text-white">
                      {activity.type}
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
