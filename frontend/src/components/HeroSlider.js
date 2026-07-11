"use client";
﻿import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import Image from 'next/image';
import { api } from '../api';

const FALLBACK_SLIDES = [
  {
    eyebrow: 'New Collection 2026',
    title: 'Crafted for the Discerning Few',
    subtitle: 'Elegance in every step — bespoke beauty redefined. Each pair tells a story of mastery passed down through generations.',
    image: '/wf-hero.png',
    primary_cta: 'Explore Collection', primary_cta_link: '/men',
    secondary_cta: 'Bespoke Order', secondary_cta_link: '#bespoke',
  },
  {
    eyebrow: 'Luxe Collection',
    title: 'Where Tradition Meets Artistry',
    subtitle: 'Over 200 hours of craftsmanship in each bespoke pair. Handcrafted with Italian leather, finished with timeless elegance.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=85&fit=crop',
    primary_cta: 'View Luxe Collection', primary_cta_link: '#luxe-collection',
    secondary_cta: 'Our Story', secondary_cta_link: '/about',
  }
];

const isExternal = (link) => /^https?:\/\//.test(link || '');

const CTA = ({ text, link, variant, testId }) => {
  if (!text) return null;
  const cls = variant === 'primary' ? 'btn-hero-primary' : 'btn-hero-ghost';
  if (!link || link === '#') {
    return <button className={cls} data-testid={testId}>{text}</button>;
  }
  if (isExternal(link)) {
    return <a href={link} target="_blank" rel="noopener noreferrer" className={cls} data-testid={testId}>{text}</a>;
  }
  return <Link href={link} className={cls} data-testid={testId}>{text}</Link>;
};

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState(FALLBACK_SLIDES);

  useEffect(() => {
    let cancelled = false;
    api.listBanners('?active_only=true&section=slider').then(data => {
      if (!cancelled && data?.items?.length) setSlides(data.items);
    }).catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, []);

  const total = slides.length;
  const goToSlide = (index) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % total);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + total) % total);

  useEffect(() => {
    if (total <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(interval);
  }, [total]);

  // Reset slide if list shrinks
  useEffect(() => {
    if (currentSlide >= total) setCurrentSlide(0);
  }, [total, currentSlide]);

  return (
    <section className="hero" data-testid="hero-slider">
      <AnimatePresence mode="wait">
        {slides.map((slide, index) => {
          if (index !== currentSlide) return null;
          return (
            <motion.div
              key={slide.id || index}
              className={`slide active`}
              data-testid={`hero-slide-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              <div className="slide-content">
                {slide.eyebrow && (
                  <motion.div 
                    className="slide-eyebrow"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  >
                    {slide.eyebrow}
                  </motion.div>
                )}
                <motion.h1 
                  className="slide-title"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  {slide.title}
                </motion.h1>
                {slide.subtitle && (
                  <motion.p 
                    className="slide-sub"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.8 }}
                  >
                    {slide.subtitle}
                  </motion.p>
                )}
                <motion.div 
                  className="slide-actions"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9, duration: 0.8 }}
                >
                  <CTA text={slide.primary_cta || slide.primaryCTA} link={slide.primary_cta_link} variant="primary" testId="hero-primary-cta" />
                  <CTA text={slide.secondary_cta || slide.secondaryCTA} link={slide.secondary_cta_link} variant="ghost" testId="hero-secondary-cta" />
                </motion.div>
                {slide.price && (
                  <motion.div 
                    className="slide-price-tag"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                  >
                    Starting {slide.price}
                  </motion.div>
                )}
              </div>
              <div className="slide-image">
                <motion.div
                  initial={{ scale: 1.05 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 6, ease: "easeOut" }}
                  style={{ width: '100%', height: '100%', position: 'absolute' }}
                >
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    style={{ objectFit: 'cover' }}
                    unoptimized={!slide.image?.includes('unsplash.com')}
                  />
                </motion.div>
                <div className="slide-image-overlay"></div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {total > 1 && (
        <div className="hero-nav" data-testid="hero-dots">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`hero-dot ${index === currentSlide ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              data-testid={`hero-dot-${index}`}
            />
          ))}
        </div>
      )}

      {total > 1 && (
        <div className="hero-arrows">
          <button className="hero-arrow" onClick={prevSlide} data-testid="hero-arrow-prev">
            <ChevronLeft size={20} />
          </button>
          <button className="hero-arrow" onClick={nextSlide} data-testid="hero-arrow-next">
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </section>
  );
};

export default HeroSlider;

