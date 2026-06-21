'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function FittingExperience() {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Hero Section */}
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden bg-black">
        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-black/60 z-10" />
        {/* We can use the GaitScan image as a subtle background for the hero or keep it pure dark. Let's use pure dark for contrast. */}
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto mt-16">
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
            Beyond Measure. <br className="hidden md:block"/>The Cobblyn Fitting Experience.
          </h1>
          <p className="text-lg md:text-xl text-neutral-300 mb-10 max-w-2xl mx-auto font-light">
            Off-the-rack shoes rarely account for true arch depth, gait nuances, and individual foot biomechanics. We don't just measure length; we analyze your entire footprint from the comfort of your home.
          </p>
          <Link href="/bespoke">
            <Button size="lg" className="bg-[#9d2706] text-white hover:bg-[#7a1e05] border-none uppercase tracking-widest text-sm px-8 py-6 rounded-none">
              Schedule Your Home Fitting
            </Button>
          </Link>
        </div>
      </section>

      {/* Intro Text */}
      <section className="py-24 px-6 max-w-3xl mx-auto text-center">
        <h2 className="text-3xl font-serif mb-6">A Marriage of Technology and Tradition</h2>
        <p className="text-neutral-600 leading-relaxed text-lg">
          Our master fitter visits your home equipped with the finest traditional tools and state-of-the-art scanning technology. This comprehensive three-step process ensures we capture every contour, pressure point, and arch detail needed to craft a personalized wooden last that is uncompromisingly yours.
        </p>
      </section>

      {/* Step 1: GaitScan */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <div className="w-full md:w-1/2 order-2 md:order-1">
            <div className="aspect-[4/3] relative overflow-hidden bg-neutral-200">
              <img 
                src="/fitting_gaitscan.png" 
                alt="Digital Foot Heatmap on GaitScan" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2 order-1 md:order-2">
            <span className="text-sm font-bold tracking-widest text-neutral-400 uppercase mb-4 block">Step 01</span>
            <h3 className="text-3xl md:text-4xl font-serif mb-6">The Digital Blueprint</h3>
            <p className="text-neutral-600 leading-relaxed text-lg mb-6">
              Utilizing advanced sensor technology, the GaitScan maps the pressure points and heatmap of your foot. By understanding exactly how you stand and distribute weight, we can build custom arch support and shock absorption precisely where your body needs it most.
            </p>
          </div>
        </div>
      </section>

      {/* Step 2: Bio-Foam */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto bg-white">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <div className="w-full md:w-1/2">
            <span className="text-sm font-bold tracking-widest text-neutral-400 uppercase mb-4 block">Step 02</span>
            <h3 className="text-3xl md:text-4xl font-serif mb-6">The Physical Mold</h3>
            <p className="text-neutral-600 leading-relaxed text-lg mb-6">
              While digital scans provide data, physical space requires volume. You will step into our pristine Bio-Foam impression box, creating a perfect 3D negative of your foot's exact shape. This captures the true arch height, heel width, and toe spread in a tangible medium.
            </p>
          </div>
          <div className="w-full md:w-1/2">
            <div className="aspect-[4/3] relative overflow-hidden bg-neutral-200">
              <img 
                src="/fitting_biofoam.png" 
                alt="Blue Bio-Foam foot impression box" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Brannock */}
      <section className="py-16 md:py-24 px-6 md:px-12 lg:px-24 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
          <div className="w-full md:w-1/2 order-2 md:order-1">
            <div className="aspect-[4/3] relative overflow-hidden bg-neutral-200">
              <img 
                src="/fitting_brannock.png" 
                alt="Vintage Brannock measuring device" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          <div className="w-full md:w-1/2 order-1 md:order-2">
            <span className="text-sm font-bold tracking-widest text-neutral-400 uppercase mb-4 block">Step 03</span>
            <h3 className="text-3xl md:text-4xl font-serif mb-6">The Master's Touch</h3>
            <p className="text-neutral-600 leading-relaxed text-lg mb-6">
              Technology informs, but craftsmanship executes. Our fitter takes classic manual measurements using the traditional Brannock device and soft tailor's tape. We physically verify heel-to-ball ratios and instep girth, ensuring our digital data aligns perfectly with traditional shoemaking last requirements.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-neutral-900 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-serif mb-8">Ready for a Perfect Fit?</h2>
          <p className="text-neutral-400 text-lg mb-10">
            Experience the luxury of truly bespoke footwear. Schedule a home visit with our master fitter and begin your journey.
          </p>
          <Link href="/bespoke">
            <Button size="lg" className="bg-[#9d2706] text-white hover:bg-[#7a1e05] border-none uppercase tracking-widest text-sm px-10 py-6 rounded-none">
              Book Your Consultation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
