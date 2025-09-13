"use client";
import React, { useRef, useEffect, useState } from "react";
import { GoogleGeminiEffect } from "./google-gemini-effect";
import { useScroll, useTransform } from "framer-motion";

export function GoogleGeminiEffectDemo() {
  const ref = useRef(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: isMounted && typeof window !== 'undefined' ? ref : undefined,
    offset: ["start start", "end start"],
  });

  const pathLengths = [
    useTransform(scrollYProgress, [0, 0.8], [0.2, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0.15, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0.1, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0.05, 1.2]),
    useTransform(scrollYProgress, [0, 0.8], [0, 1.2]),
  ];

  return (
    <div
      className="h-[400vh] bg-black w-full dark:border dark:border-white/[0.1] rounded-md relative pt-40 overflow-clip"
      ref={ref}
    >
      <GoogleGeminiEffect
        pathLengths={pathLengths}
        title="Secure Supply Chain Traceability"
        description="Track products from manufacturer to customer. Verify authenticity, ensure transparency, and build trust with blockchain-powered supply chain solutions."
        className=""
      />
    </div>
  );
}
