"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { useScroll, useTransform } from "motion/react";

export default function FarmerLogin() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    farmerId: '', 
    landCertificate: '', 
    gpsCoordinates: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user && user.role === 'farmer') {
      router.push("/farmer/dashboard");
    }
  }, [user, loading, router]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    // Certificate-based validation for farmers
    if (formData.farmerId === 'FARM001' && 
        formData.landCertificate === 'LC2024001' && 
        formData.gpsCoordinates.includes('12.9716,77.5946') &&
        formData.password === 'harvest2024') {
      
      const userData = {
        id: formData.farmerId,
        username: formData.farmerId,
        role: 'farmer',
        name: 'TraceAyur Organic Farm',
        address: 'FABRIC_FARMER_001',
        farmDetails: {
          landCertificate: formData.landCertificate,
          gpsCoordinates: formData.gpsCoordinates,
          farmSize: '10 acres',
          organicCertified: true,
          crops: ['Turmeric', 'Ashwagandha', 'Brahmi']
        },
        permissions: ['crop-registration', 'harvest-logging', 'quality-testing']
      };
      
      login(userData);
      router.push("/farmer/dashboard");
    } else {
      setLoginError('Invalid farmer credentials. Please verify your Farmer ID, Land Certificate, GPS coordinates, and password.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Verifying agricultural credentials...</p>
        </div>
      </div>
    );
  }

  const pathLengths = [
    useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0, 1.2]),
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Google Gemini Effect */}
      <div
        className="h-[100vh] bg-black w-full dark:border dark:border-white/[0.1] relative pt-40 overflow-hidden"
        ref={ref}
      >
        <GoogleGeminiEffect
          pathLengths={pathLengths}
          title="Farmer Portal"
          description="Register and track your crops from seed to harvest. Log farming activities, maintain organic certification, and ensure quality at the source."
          className=""
        />
        
        {/* Login Card Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-lg shadow-xl p-8 border border-white/20">
            <h1 className="text-2xl font-bold text-center text-white mb-8">Farmer Verification</h1>
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="farmerId" className="block text-sm font-medium text-gray-200 mb-2">
                    Farmer ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="farmerId"
                    placeholder="Enter registered Farmer ID"
                    value={formData.farmerId}
                    onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="landCertificate" className="block text-sm font-medium text-gray-200 mb-2">
                    Land Certificate No. <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="landCertificate"
                    placeholder="Land ownership certificate"
                    value={formData.landCertificate}
                    onChange={(e) => setFormData({ ...formData, landCertificate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="gpsCoordinates" className="block text-sm font-medium text-gray-200 mb-2">
                    Farm GPS Coordinates <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="gpsCoordinates"
                    placeholder="e.g., 12.9716,77.5946"
                    value={formData.gpsCoordinates}
                    onChange={(e) => setFormData({ ...formData, gpsCoordinates: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                    Access Password <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Verifying Credentials...' : 'Verify & Login'}
                </button>
                {loginError && (
                  <div className="text-red-400 text-sm text-center mt-2">
                    {loginError}
                  </div>
                )}
              </form>
              <div className="text-sm text-gray-300 text-center">
                <div className="bg-gray-800/50 p-3 rounded-md">
                  <p className="font-medium mb-2">Demo Farmer Credentials:</p>
                  <p>Farmer ID: FARM001</p>
                  <p>Land Certificate: LC2024001</p>
                  <p>GPS: 12.9716,77.5946</p>
                  <p>Password: harvest2024</p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/" className="text-green-300 hover:text-green-200 transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}