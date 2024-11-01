// src/app/pages/index.js

"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import Footer from "../app/components/Common/Footer";
import HeroSection from "../app/components/Home/HeroSection";
import FeaturesSection from "../app/components/Home/FeaturesSection";
import HowItWorksSection from "../app/components/Home/HowItWorksSection";
import CallToAction from "../app/components/Home/CallToAction";
import DecorativeElements from "../app/components/Home/DecorativeElements";

const Home = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLoginClick = () => {
    if (status === "authenticated") {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleSignupClick = () => {
    if (status === "authenticated") {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  };

  const handleUserGuideClick = () => {
    router.push("/user-guide");
  };

  return (
    <div className="min-h-screen bg-teal-50 flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <HeroSection
        handleUserGuideClick={handleUserGuideClick}
        handleSignupClick={handleSignupClick}
        handleLoginClick={handleLoginClick}
        status={status}
      />

      {/* Decorative Elements */}
      <DecorativeElements />

      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        {/* Introduction Section */}
        <section className="text-center mb-16">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-teal-700 mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            viewport={{ once: true }}
          >
            Empowering Clinics Across the Globe
          </motion.h2>
          <motion.p
            className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            viewport={{ once: true }}
          >
            Join a community of doctors transforming patient care with efficient clinic management.
          </motion.p>
          {/* Decorative Divider */}
          <motion.div
            className="mt-8 w-24 h-1 bg-teal-500 mx-auto rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: "6rem" }}
            transition={{ duration: 1, delay: 1 }}
            viewport={{ once: true }}
          ></motion.div>
        </section>

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works Section */}
        <HowItWorksSection />

        {/* Call to Action */}
        <CallToAction handleSignupClick={handleSignupClick} status={status} />
      </main>

      {/* Footer */}
      {/* <Footer /> */}

      {/* Animation Styles */}
      <style jsx>{`
        /* Additional custom styles can be added here */
      `}</style>
    </div>
  );
};

export default Home;
