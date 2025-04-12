"use client"
const HeroSection = lazy(() => import("@components/ui/hero-section"))
import Features from "@components/ui/features";
import ContentSection from "@components/ui/content-section";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import Pricing from "@components/ui/pricing";
const FAQsThree = lazy(() => import("@components/ui/faq"));
import FooterSection from "@components/ui/footer-section";
import { lazy, Suspense } from 'react';


export default function Home() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  //Scroll Detection Logic
  const checkScrollTop = () => {
    if (window.scrollY > 200) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
  return (
    <div>
      <Suspense fallback={<div>Loading Hero Section...</div>}>
        <HeroSection />
      </Suspense>


      <Features />
      <ContentSection />
      <Pricing />

      <Suspense fallback={<div>Loading FAQs...</div>}>
        <FAQsThree />
      </Suspense>

      <FooterSection />
      {/* Scroll Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-black font-bold text-white rounded-full shadow-lg hover:bg-orange-600 transition-colors duration-200
                              z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowUp className="h-6 w-6" />
          </motion.button>
        )

        }
      </AnimatePresence>
    </div>
  );
}
