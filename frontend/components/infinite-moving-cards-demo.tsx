"use client";

import React from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export default function DoubleInfiniteMovingCardsDemo() {
  return (
    <div className="h-[50rem] flex flex-col antialiased bg-white dark:bg-black dark:bg-grid-white/[0.05] items-center justify-center gap-10 relative overflow-hidden">
      {/* First Row - Right to Left */}
      <InfiniteMovingCards items={quotes} direction="left" speed="slow" />

      {/* Second Row - Left to Right */}
      <InfiniteMovingCards items={quotesBottom} direction="right" speed="slow" />
    </div>
  );
}

const quotes = [
  {
    quote:
      "India's Ayurvedic herb chains involve smallholders and wild collectors with many intermediaries. Opaque records risk mislabeling and over-harvesting.",
    name: "TraceAyur",
    title: "The Problem",
  },
  {
    quote:
      "Adulteration and substitution erode trust in herbal products. An immutable ledger preserves authenticity across each custody handoff.",
    name: "TraceAyur",
    title: "Adulteration",
  },
  {
    quote:
      "Traditional systems delay provenance checks. Blockchain with geo-tagged events cuts trace time from days to seconds.",
    name: "TraceAyur",
    title: "Faster Provenance",
  },
  {
    quote:
      "Unsustainable collection harms biodiversity. Smart contracts enforce geo-fences, seasons and species limits before events are accepted.",
    name: "TraceAyur",
    title: "Sustainability",
  },
];

const quotesBottom = [
  {
    quote:
      "Geo-tagged CollectionEvent, ProcessingStep and QualityTest bundles create a verifiable provenance trail for each batch.",
    name: "TraceAyur",
    title: "FHIR-style Metadata",
  },
  {
    quote:
      "QR codes on finished products let consumers scan to view location maps, lab certificates and fair-trade credentials.",
    name: "TraceAyur",
    title: "Consumer Portal",
  },
  {
    quote:
      "Start with Ashwagandha pilot; extend to broader botanicals via APIs and ERP connectors.",
    name: "TraceAyur",
    title: "Pilot to Scale",
  },
];
