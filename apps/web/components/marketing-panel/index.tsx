"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TestimonialsManager } from "./testimonials-manager";
import { FAQsManager } from "./faqs-manager";
import { PricingManager } from "./pricing-manager";
import { PortfolioStatsManager } from "./portfolio-stats-manager";

export function MarketingPanel() {
  const [activeTab, setActiveTab] = useState("testimonials");

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestión de Marketing
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Administra el contenido dinámico de la landing page
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="testimonials">Testimonios</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="pricing">Precios</TabsTrigger>
          <TabsTrigger value="stats">Estadísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="testimonials">
          <TestimonialsManager />
        </TabsContent>

        <TabsContent value="faqs">
          <FAQsManager />
        </TabsContent>

        <TabsContent value="pricing">
          <PricingManager />
        </TabsContent>

        <TabsContent value="stats">
          <PortfolioStatsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
