import "./globals.css"
import React from "react";
import ClientNavbar from "@/components/navbar-client";
import { AuthProvider } from "@/hooks/use-auth";

export const metadata = {
  title: "TraceAyur - Botanical Traceability",
  description: "Blockchain-based traceability for Ayurvedic herbs",
  generator: 'TraceAyur'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white min-h-screen">
        <AuthProvider>
          <ClientNavbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
