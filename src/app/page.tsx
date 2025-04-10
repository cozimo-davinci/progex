"use client"
import HeroSection from "@/components/ui/hero-section"
import Features from "@components/ui/features";
import ContentSection from "@components/ui/content-section";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import CallToAction from "@components/ui/call-to-action";
import Pricing from "@components/ui/pricing";
import FAQsThree from "@components/ui/faq";
import FooterSection from "@components/ui/footer-section";

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
      <HeroSection />
      <Features />
      <ContentSection />
      <CallToAction />
      <Pricing />
      <FAQsThree />
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
