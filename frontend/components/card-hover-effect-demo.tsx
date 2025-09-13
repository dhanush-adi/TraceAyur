import { HoverEffect } from "@/components/ui/card-hover-effect";

export default function CardHoverEffectDemo() {
  return (
    <div className="max-w-5xl mx-auto px-8">
      <HoverEffect items={features} />
    </div>
  );
}

export const features = [
  {
    title: "Geo-Tagged Traceability",
    description:
      "Record CollectionEvent, ProcessingStep and QualityTest with GPS coordinates and timestamps.",
    link: "#",
  },
  {
    title: "Immutable Provenance",
    description:
      "Tamper-proof ledger preserves species identity, custody and sustainability validations.",
    link: "#",
  },
  {
    title: "Rapid Recalls",
    description:
      "Trace affected batches instantly with on-chain links across nodes and events.",
    link: "#",
  },
  {
    title: "Consumer Transparency",
    description:
      "QR scans reveal maps, lab certificates and community profiles for each batch.",
    link: "#",
  },
  {
    title: "Interoperable APIs",
    description:
      "FHIR-style bundles and REST APIs connect with ERP and quality systems.",
    link: "#",
  },
  {
    title: "Sustainability Enforcement",
    description:
      "Smart contracts check geo-fences, seasons and species limits before acceptance.",
    link: "#",
  },
];
