"use client";

import React, { useState, useEffect } from "react";
import { 
  Navbar, 
  NavBody, 
  NavbarLogo,
  MobileNav,
  MobileNavHeader
} from "@/components/ui/navbar";

export default function ClientNavbar() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Desktop Navbar */}
      <Navbar>
        <NavBody>
          <div className="flex items-center justify-center w-full">
            <NavbarLogo />
          </div>
        </NavBody>
      </Navbar>

      {/* Mobile Navbar */}
      <Navbar className="lg:hidden">
        <MobileNav>
          <MobileNavHeader>
            <div className="flex items-center justify-center w-full">
              <NavbarLogo />
            </div>
          </MobileNavHeader>
        </MobileNav>
      </Navbar>
    </>
  );
}
