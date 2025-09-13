"use client";

import React, { useState } from "react";
import { 
  Navbar, 
  NavBody, 
  NavbarLogo, 
  NavbarAuth,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu
} from "@/components/ui/navbar";

export default function ClientNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  const mobileNavItems = [
    { name: "🏭 Manufacturer", href: "/manufacturer/login", color: "text-white" },
    { name: "🔬 Laboratory", href: "/laboratory/login", color: "text-white" },
    { name: "🏪 Vendor", href: "/vendor/login", color: "text-white" },
    { name: "🏢 Warehouse", href: "/warehouse/login", color: "text-white" },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <Navbar>
        <NavBody>
          <div className="flex items-center">
            <NavbarLogo />
          </div>

          <div className="flex items-center">
            <NavbarAuth />
          </div>
        </NavBody>
      </Navbar>

      {/* Mobile Navbar */}
      <Navbar className="lg:hidden">
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle 
              isOpen={isOpen} 
              onClick={() => setIsOpen(!isOpen)} 
            />
          </MobileNavHeader>
          
          <MobileNavMenu 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)}
          >
            {mobileNavItems.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                className={`block w-full px-4 py-3 text-left font-bold hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-all duration-200`}
                style={{ color: '#ffffff' }}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </>
  );
}
