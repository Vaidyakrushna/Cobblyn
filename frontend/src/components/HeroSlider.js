"use client";
﻿import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import Image from 'next/image';
import { api } from '../api';

const FALLBACK_SLIDES = [
  {
    eyebrow: 'NEW COLLECTION',
    title: 'Crafted for the Discerning',
    subtitle: 'Bespoke footwear handcrafted to your exact specifications. Each pair a masterpiece of Italian leather and Indian craftsmanship.',
    price: '\u20b96,000',
    image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1400&q=85&fit=crop',
    primary_cta: 'Customize Now', primary_cta_link: '/customize',
    secondary_cta: 'View Collection', secondary_cta_link: '/men',
  },
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
      {slides.map((slide, index) => (
        <div
          key={slide.id || index}
          className={`slide ${index === currentSlide ? 'active' : ''}`}
          data-testid={`hero-slide-${index}`}
        >
          <div className="slide-content">
            {slide.eyebrow && <div className="slide-eyebrow">{slide.eyebrow}</div>}
            <h1 className="slide-title">{slide.title}</h1>
            {slide.subtitle && <p className="slide-sub">{slide.subtitle}</p>}
            <div className="slide-actions">
              <CTA text={slide.primary_cta || slide.primaryCTA} link={slide.primary_cta_link} variant="primary" testId="hero-primary-cta" />
              <CTA text={slide.secondary_cta || slide.secondaryCTA} link={slide.secondary_cta_link} variant="ghost" testId="hero-secondary-cta" />
            </div>
            {slide.price && <div className="slide-price-tag">Starting {slide.price}</div>}
          </div>
          <div className="slide-image">
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              priority={index === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              unoptimized={!slide.image?.includes('unsplash.com')}
            />
            <div className="slide-image-overlay"></div>
          </div>
        </div>
      ))}

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

