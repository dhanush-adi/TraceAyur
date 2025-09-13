"use client";

import React from "react";
import { WobbleCard } from "@/components/ui/wobble-card";

export default function WobbleCardDemo() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
      {/* Card 1: Ayurvedic Herb Safety */}
      <WobbleCard
        containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 min-h-[500px] lg:min-h-[300px]"
        className=""
      >
        <div className="max-w-full">
          <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            Blockchain for Ayurvedic Herbs Safety
          </h2>
          <p className="mt-4 text-left text-base/6 text-neutral-200">
            TraceAyur provides end-to-end traceability of Ayurvedic herbs by recording their origin, processing, and quality checks directly on blockchain. With lab reports and certifications securely stored in IPFS, the time to verify provenance and safety reduces from days to seconds. This protects consumers from adulterated herbs, safeguards biodiversity, and ensures businesses maintain high standards of quality and compliance.
          </p>
        </div>
      </WobbleCard>

      {/* Card 2: Transparency */}
      <WobbleCard containerClassName="col-span-1 min-h-[300px] bg-indigo-900">
        <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
          Transparency & Trust
        </h2>
        <p className="mt-4 max-w-[26rem] text-left text-base/6 text-neutral-200">
          Every step of the herbal supply chain is securely recorded on the blockchain,
          ensuring immutability and building trust in authenticity and ethical sourcing.
        </p>
      </WobbleCard>

      {/* Card 3: Efficiency */}
      <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
        <div className="max-w-full">
          <h2 className="max-w-full md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            Smarter Herbal Supply Chains
          </h2>
          <p className="mt-4 max-w-full text-left text-base/6 text-neutral-200">
            By integrating IoT sensors, geo-tagging, and blockchain with IPFS storage, TraceAyur enables smarter and more resilient herbal supply chains. Real-time data on herb quality, transport conditions, and custody records allow businesses to act quickly in case of quality concerns or recalls. The system reduces fraud, ensures herbs retain their medicinal value during transit, and empowers businesses with insights to improve efficiency and sustainability.
          </p>
        </div>
      </WobbleCard>
    </div>
  );
}
