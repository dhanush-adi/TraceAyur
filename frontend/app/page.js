"use client";

import { useEffect } from "react";
import Link from "next/link";
import GlowingEffectDemo from "@/components/ui/glowing-effect-demo";
import WavyBackgroundDemo from "@/components/wavy-background-demo";
import WobbleCardDemo from "@/components/wobble-card-demo";
import InfiniteMovingCardsDemo from "@/components/infinite-moving-cards-demo";
import CardHoverEffectDemo from "@/components/card-hover-effect-demo";
import StickyScrollRevealDemo from "@/components/sticky-scroll-reveal-demo";

export default function Home() {
  useEffect(() => {
    // ensure client-side hook loads
  }, []);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-start py-12 px-4">
      <section className="w-full mb-6">
        <WavyBackgroundDemo />
        <div className="mt-12">
          <WobbleCardDemo />
          <InfiniteMovingCardsDemo />
        </div>
      </section>

      <section className="w-full max-w-6xl mx-auto mb-8">
        <div className="z-50">
          <CardHoverEffectDemo />
        </div>
      </section>

      <section className="w-full max-w-5xl mx-auto mt-12">
        <div className="mx-auto text-center mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <Link href="/manufacturer/login" className="group">
              <div className="relative bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border-2 border-blue-500/30 hover:border-blue-400/50 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
                    <span className="text-3xl" role="img" aria-label="Factory">🏭</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Manufacturer Portal</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">Product registration, batch management, quality control</p>
                </div>
              </div>
            </Link>
            
            <Link href="/laboratory/login" className="group">
              <div className="relative bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border-2 border-purple-500/30 hover:border-purple-400/50 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/20">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                    <span className="text-3xl" role="img" aria-label="Microscope">🔬</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Laboratory Portal</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">Quality testing, certification, compliance verification</p>
                </div>
              </div>
            </Link>
            
            <Link href="/vendor/login" className="group">
              <div className="relative bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border-2 border-orange-500/30 hover:border-orange-400/50 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/30">
                    <span className="text-3xl" role="img" aria-label="Shop">🏪</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Vendor Portal</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">Product scanning, inventory management, authenticity verification</p>
                </div>
              </div>
            </Link>
            
            <Link href="/warehouse/login" className="group">
              <div className="relative bg-gradient-to-br from-white/5 via-white/10 to-white/5 backdrop-blur-lg rounded-xl p-6 border-2 border-yellow-500/30 hover:border-yellow-400/50 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/30">
                    <span className="text-3xl" role="img" aria-label="Warehouse">🏬</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Warehouse Portal</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">Checkpoint scanning, inventory tracking, security monitoring</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
