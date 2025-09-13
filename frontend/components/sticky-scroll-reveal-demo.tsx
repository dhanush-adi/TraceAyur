"use client";
import React from "react";
import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";

const content = [
  {
    title: "Herbal Traceability in Seconds",
    description:
      "Our blockchain-powered system reduces provenance checks from days to seconds. Faster recalls, safer remedies and greater consumer confidence.",
    content: (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,#065f46,#0f766e)] text-white text-lg font-semibold">
        Trace Herbs in Seconds
      </div>
    ),
  },
  {
    title: "End-to-End Transparency",
    description:
      "Every step of the herbal supply chain is securely recorded — from geo-tagged collection to formulation. Immutable records guarantee authenticity and build trust.",
    content: (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        <img
          src="/placeholder.jpg"
          width={400}
          height={400}
          className="h-full w-full object-cover rounded-xl"
          alt="supply chain transparency demo"
        />
      </div>
    ),
  },
  {
    title: "Smarter Supply Chains",
    description:
      "By combining blockchain with geo-tagging and IoT, our system delivers real-time insights on origin, drying, storage and transport, making supply chains more resilient.",
    content: (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,#ea580c,#facc15)] text-black text-lg font-semibold">
        Blockchain + IoT + AI
      </div>
    ),
  },
  {
    title: "Consumer Safety First",
    description:
      "Faster recalls and accurate batch tracking help prevent adulterated herbs from reaching customers — protecting health and strengthening trust.",
    content: (
      <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(to_bottom_right,#06b6d4,#db2777)] text-white text-lg font-semibold">
        Safer Remedies. Stronger Trust.
      </div>
    ),
  },
];

export default function StickyScrollRevealDemo() {
  return (
    <div className="w-full">
      <StickyScroll content={content} />
    </div>
  );
}
