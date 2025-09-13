"use client";
import Link from "next/link"
import TimelineDemo from "@/components/timeline-demo"
import { useState } from "react";

export default function ScanInfo() {
  const [verifyOnBlockchain, setVerifyOnBlockchain] = useState(false);
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto">
        <header className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Product Traceability</h1>
              <p className="text-gray-300">Complete journey of your scanned product from origin to shelf.</p>
            </div>
            <div className="text-right">
              <div className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm font-medium mb-2 border border-green-700">
                ✅ Verified Authentic
              </div>
              <p className="text-sm text-gray-400">Product ID: #ECH-2024-001</p>
            </div>
          </div>
        </header>

        {/* Product Summary Card */}
        <div className="px-8 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-lg shadow-xl p-6 border border-gray-700">
            <div className="flex items-center gap-6">
              <img 
                src="/QR.jpg" 
                alt="QR Code" 
                className="w-24 h-24 rounded-lg object-contain border border-gray-600 bg-white p-2"
              />
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white mb-2">Organic Apple - Honeycrisp</h2>
                <p className="text-gray-300 mb-2">Premium organic apples sourced from certified sustainable farms</p>
                <div className="flex gap-4 text-sm text-gray-400">
                  <span>🌱 Organic Certified</span>
                  <span>📦 Batch: HC-2024-015</span>
                  <span>📅 Harvest: Jan 15, 2024</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400 mb-1">A+</div>
                <p className="text-sm text-gray-400">Quality Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Component */}
        <TimelineDemo />

        {/* Action Buttons */}
        <div className="px-8 pb-8">
          <div className="bg-gray-900/50 backdrop-blur-lg rounded-lg shadow-xl p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
            <div className="flex gap-4 flex-wrap">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors border border-blue-500 shadow-lg">
                Download Certificate
              </button>
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors border border-green-500 shadow-lg" onClick={() => setVerifyOnBlockchain(true)}>
                Verify on Blockchain
              </button>
              <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors border border-purple-500 shadow-lg">
                Report Issue
              </button>
              <Link href="/customer/scan-info">
                <button className="bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors border border-gray-600 shadow-lg">
                  Scan Another Product
                </button>
              </Link>
            </div>
            {verifyOnBlockchain && <div className="p-10">
              <h4>Contract address: <span className="text-gray-400">STHK32FSHBAWT513Y7806RME1BCH44QJKRN2XRQB</span>,  Block Explorer: <a href="https://explorer.hiro.so/txid/0xa0aeed5da7c6ef8c1a43bf80d7e5cf51eb870a7022c81d22eed32483e31120a3?chain=testnet" className="text-purple-400 hover:underline">View on Explorer</a></h4>
            </div>}
          </div>
        </div>

        <div className="px-8 pb-8">
          <Link href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
