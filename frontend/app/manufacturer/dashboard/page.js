"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  QrCode, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  MapPin,
  Leaf,
  Clock,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function ManufacturerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'manufacturer') {
        router.push("/manufacturer/login");
        return;
      }
      fetchDashboardData();
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    try {
      // Mock data - in real implementation, fetch from backend API
      const data = {
        totalProducts: 156,
        activeProducts: 45,
        completedProducts: 111,
        qrCodesGenerated: 145,
        totalBatches: 32,
        activeBatches: 8,
        qualityPassRate: 96.8,
        complianceScore: 94.5,
        recentActivity: [
          {
            id: 1,
            type: "product_created",
            message: "New Ashwagandha batch B045 created",
            timestamp: "2 hours ago",
            status: "success"
          },
          {
            id: 2,
            type: "quality_test",
            message: "Quality test passed for batch B044",
            timestamp: "4 hours ago",
            status: "success"
          },
          {
            id: 3,
            type: "compliance_alert",
            message: "Moisture content alert for batch B043",
            timestamp: "6 hours ago",
            status: "warning"
          }
        ],
        products: [
          {
            id: "P001",
            name: "Ashwagandha Powder",
            batchId: "B045",
            status: "processing",
            progress: 65,
            qrCode: "QR_P001_B045",
            qualityScore: 96.5,
            estimatedCompletion: "2 days"
          },
          {
            id: "P002",
            name: "Shatavari Extract",
            batchId: "B044",
            status: "completed",
            progress: 100,
            qrCode: "QR_P002_B044",
            qualityScore: 98.2,
            estimatedCompletion: "Completed"
          }
        ],
        complianceData: {
          ayushCompliance: 94.5,
          qualityStandards: 96.8,
          exportRequirements: 92.3,
          gmpCompliance: 98.1
        }
      };
      
      setDashboardData(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'manufacturer') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Access denied. Manufacturer login required.</p>
          <Button onClick={() => router.push("/manufacturer/login")} className="bg-green-600 hover:bg-green-700">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manufacturer Dashboard</h1>
            <p className="text-gray-400 mt-2">
              Welcome back! Monitor your product journey and maintain quality standards.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/manufacturer/generate-qr">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <QrCode className="w-4 h-4 mr-2" />
                Generate QR Code
              </Button>
            </Link>
            <Link href="/manufacturer/create-product">
              <Button className="bg-green-600 hover:bg-green-700">
                <Package className="w-4 h-4 mr-2" />
                Create Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Products</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{dashboardData?.totalProducts}</div>
              <p className="text-xs text-gray-400">
                <span className="text-green-400">+12</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Active Batches</CardTitle>
              <Leaf className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{dashboardData?.activeBatches}</div>
              <p className="text-xs text-gray-400">
                Currently in production
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Quality Pass Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{dashboardData?.qualityPassRate}%</div>
              <p className="text-xs text-gray-400">
                <span className="text-green-400">+2.3%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Compliance Score</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{dashboardData?.complianceScore}%</div>
              <p className="text-xs text-gray-400">
                AYUSH compliant
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="products" className="text-white">Products</TabsTrigger>
            <TabsTrigger value="compliance" className="text-white">Compliance</TabsTrigger>
            <TabsTrigger value="analytics" className="text-white">Analytics</TabsTrigger>
            <TabsTrigger value="activity" className="text-white">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Active Products</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor your products through the supply chain
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{product.name}</h3>
                          <p className="text-sm text-gray-400">Batch: {product.batchId}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">Quality Score: {product.qualityScore}%</p>
                          <p className="text-xs text-gray-400">{product.estimatedCompletion}</p>
                        </div>
                        <Progress value={product.progress} className="w-24" />
                        <Badge 
                          variant={product.status === 'completed' ? 'default' : 'secondary'}
                          className={product.status === 'completed' ? 'bg-green-600' : 'bg-yellow-600'}
                        >
                          {product.status}
                        </Badge>
                        <Button size="sm" variant="outline" className="text-white border-gray-600">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Compliance Monitoring</CardTitle>
                <CardDescription className="text-gray-400">
                  Track compliance with AYUSH Ministry regulations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">AYUSH Compliance</span>
                        <span className="text-sm text-white">{dashboardData?.complianceData.ayushCompliance}%</span>
                      </div>
                      <Progress value={dashboardData?.complianceData.ayushCompliance} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">Quality Standards</span>
                        <span className="text-sm text-white">{dashboardData?.complianceData.qualityStandards}%</span>
                      </div>
                      <Progress value={dashboardData?.complianceData.qualityStandards} className="h-2" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">Export Requirements</span>
                        <span className="text-sm text-white">{dashboardData?.complianceData.exportRequirements}%</span>
                      </div>
                      <Progress value={dashboardData?.complianceData.exportRequirements} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">GMP Compliance</span>
                        <span className="text-sm text-white">{dashboardData?.complianceData.gmpCompliance}%</span>
                      </div>
                      <Progress value={dashboardData?.complianceData.gmpCompliance} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Production Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    Production charts would be implemented here using recharts
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Quality Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    Quality trend charts would be implemented here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Latest updates from your manufacturing processes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 border border-gray-700 rounded-lg bg-gray-800">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.status === 'success' ? 'bg-green-600' : 
                        activity.status === 'warning' ? 'bg-yellow-600' : 'bg-red-600'
                      }`}>
                        {activity.status === 'success' ? <CheckCircle className="w-4 h-4" /> :
                         activity.status === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                         <XCircle className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{activity.message}</p>
                        <p className="text-xs text-gray-400">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
