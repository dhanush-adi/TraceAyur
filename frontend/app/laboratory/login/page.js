"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { useScroll, useTransform } from "motion/react";

export default function LaboratoryLogin() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    labId: '', 
    naacertificate: '', 
    labLicense: '',
    technicianId: '',
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
    if (!loading && user && user.role === 'laboratory') {
      router.push("/laboratory/dashboard");
    }
  }, [user, loading, router]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    // Certificate-based validation for laboratories
    if (formData.labId === 'LAB001' && 
        formData.naacertificate === 'NABL-T-12345' && 
        formData.labLicense === 'AYUSH-LAB-2024-001' &&
        formData.technicianId === 'TECH001' &&
        formData.password === 'test2024') {
      
      const userData = {
        id: formData.labId,
        username: formData.labId,
        role: 'laboratory',
        name: 'TraceAyur Quality Testing Lab',
        address: 'FABRIC_LAB_001',
        labDetails: {
          naacertificate: formData.naacertificate,
          labLicense: formData.labLicense,
          technicianId: formData.technicianId,
          accreditation: 'NABL Accredited',
          specialization: ['Ayurvedic Herbs', 'Phytochemical Analysis', 'Heavy Metal Testing'],
          equipment: ['HPLC', 'GC-MS', 'UV-Spectrophotometer']
        },
        permissions: ['quality-testing', 'report-generation', 'certificate-issuance']
      };
      
      login(userData);
      router.push("/laboratory/dashboard");
    } else {
      setLoginError('Invalid laboratory credentials. Please verify your Lab ID, NABL Certificate, License, Technician ID, and password.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Verifying laboratory credentials...</p>
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
          title="Laboratory Portal"
          description="Conduct quality testing and certification of herbal products. Issue test reports, validate product purity, and ensure safety standards."
          className=""
        />
        
        {/* Login Card Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-lg shadow-xl p-8 border border-white/20">
            <h1 className="text-2xl font-bold text-center text-white mb-8">Laboratory Access</h1>
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="labId" className="block text-sm font-medium text-gray-200 mb-2">
                    Laboratory ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="labId"
                    placeholder="Enter registered Lab ID"
                    value={formData.labId}
                    onChange={(e) => setFormData({ ...formData, labId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="naacertificate" className="block text-sm font-medium text-gray-200 mb-2">
                    NABL Certificate No. <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="naacertificate"
                    placeholder="NABL accreditation number"
                    value={formData.naacertificate}
                    onChange={(e) => setFormData({ ...formData, naacertificate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="labLicense" className="block text-sm font-medium text-gray-200 mb-2">
                    Lab License No. <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="labLicense"
                    placeholder="AYUSH/FDA lab license"
                    value={formData.labLicense}
                    onChange={(e) => setFormData({ ...formData, labLicense: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="technicianId" className="block text-sm font-medium text-gray-200 mb-2">
                    Technician ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    id="technicianId"
                    placeholder="Authorized technician ID"
                    value={formData.technicianId}
                    onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Verifying Credentials...' : 'Authenticate & Access'}
                </button>
                {loginError && (
                  <div className="text-red-400 text-sm text-center mt-2">
                    {loginError}
                  </div>
                )}
              </form>
              <div className="text-sm text-gray-300 text-center">
                <div className="bg-gray-800/50 p-3 rounded-md">
                  <p className="font-medium mb-2">Demo Lab Credentials:</p>
                  <p>Lab ID: LAB001</p>
                  <p>NABL Certificate: NABL-T-12345</p>
                  <p>Lab License: AYUSH-LAB-2024-001</p>
                  <p>Technician ID: TECH001</p>
                  <p>Password: test2024</p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/" className="text-blue-300 hover:text-blue-200 transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}