"use client";

import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoogleGeminiEffect } from "@/components/ui/google-gemini-effect";
import { useScroll, useTransform } from "motion/react";

export default function WarehouseLogin() {
  const { user, login, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const ref = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user && user.role === 'warehouse') {
      router.push("/warehouse/dashboard");
    }
  }, [user, loading, router]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');

    // Simple login validation - in production, this would be a proper API call
    if (formData.username === 'warehouse' && formData.password === 'password') {
      const userData = {
        id: 'wh_001',
        username: formData.username,
        role: 'warehouse',
        name: 'TraceAyur Warehouse',
        address: 'TRAC123WAREHOUSE456',
        permissions: ['dashboard', 'checkpoint-scanning', 'inventory-tracking']
      };
      
      login(userData);
      router.push("/warehouse/dashboard");
    } else {
      setLoginError('Invalid credentials. Use username: "warehouse", password: "password"');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p>Loading...</p>
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
          title="Warehouse Portal"
          description="Scan and track products at critical checkpoints. Monitor inventory movements, verify product integrity, and maintain supply chain security."
          className=""
        />
        
        {/* Login Card Overlay */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-lg shadow-xl p-8 border border-white/20">
            <h1 className="text-2xl font-bold text-center text-white mb-8">Warehouse Login</h1>
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-200 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-800 text-white placeholder-gray-400"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                {loginError && (
                  <div className="text-red-400 text-sm text-center mt-2">
                    {loginError}
                  </div>
                )}
              </form>
              <div className="text-sm text-gray-300 text-center">
                Demo credentials: warehouse / password
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link href="/" className="text-orange-300 hover:text-orange-200 transition-colors">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
