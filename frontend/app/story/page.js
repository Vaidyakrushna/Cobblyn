"use client";
import React from 'react';
import { ArrowRight } from 'lucide-react';

const milestones = [
  {
    year: '2014',
    title: 'The Spark',
    description: 'Founder Aryan Mehta, frustrated by the lack of truly handcrafted luxury shoes in India, travels to Florence and learns the Goodyear welt technique from a third-generation cobbler.',
    side: 'left',
  },
  {
    year: '2016',
    title: 'First Pair',
    description: 'Back in India, Aryan hand-crafts his first pair in a small workshop in Jaipur. Word spreads among friends — orders begin trickling in through referrals alone.',
    side: 'right',
  },
  {
    year: '2018',
    title: 'The Studio Opens',
    description: 'Cobblyn officially opens its atelier with a team of five master craftsmen. The name — Cobblyn — reflects the founding belief that true luxury lies beyond the ordinary.',
    side: 'left',
  },
  {
    year: '2020',
    title: 'Digital Debut',
    description: 'During the pandemic, Cobblyn launches its online platform — allowing customers across India to order bespoke shoes through a first-of-its-kind digital fitting experience.',
    side: 'right',
  },
  {
    year: '2022',
    title: 'Luxe Collection',
    description: 'The Luxe Collection launches — featuring limited-edition shoes with exotic leathers, hand-painted uppers, and numbered certificates of authenticity.',
    side: 'left',
  },
  {
    year: '2024',
    title: 'A New Chapter',
    description: 'Cobblyn expands with a customisation studio, a women\'s collection, and a new atelier space — continuing the journey of crafting footwear that tells a story.',
    side: 'right',
  },
];

export default function StoryPage() {
  return (
    <main className="story-page">
      {/* HERO */}
      <section className="story-hero">
        <div className="story-hero-content">
          <div className="section-label">OUR STORY</div>
          <h1 className="story-hero-title">
            Born Beyond
            <br />
            <em>the Ordinary</em>
          </h1>
          <p className="story-hero-sub">
            Cobblyn was not built in a boardroom — it was built in a workshop, stitch by stitch, 
            fuelled by a belief that India deserves handcrafted luxury that rivals the world's finest.
          </p>
        </div>
        <div className="story-hero-img">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&q=85&fit=crop"
            alt="Cobblyn founder"
          />
          <div className="story-hero-img-overlay" />
        </div>
      </section>

      {/* FOUNDING STORY */}
      <section className="story-founding section">
        <div className="story-founding-inner">
          <div className="story-founding-text">
            <div className="section-label">THE BEGINNING</div>
            <h2 className="section-title">A Traveller, a Cobbler, and a Dream</h2>
            <p className="story-text">
              It started in the cobblestone alleys of Florence, Italy. Aryan Mehta — then a 
              young designer with a restless mind — wandered into a tiny workshop where an 
              old cobbler was stitching a shoe by hand. He watched for three hours, transfixed 
              by the patience, the precision, and the pure artistry of what he was witnessing.
            </p>
            <p className="story-text">
              "I realised," Aryan later said, "that a shoe made this way isn't just an object. 
              It's a record of someone's attention, their skill, their care. And I thought — 
              why doesn't India have this? Why are we importing luxury when we have the most 
              gifted artisans in the world?"
            </p>
            <p className="story-text">
              He spent the next two years learning the craft — travelling between Florence, 
              Córdoba, and rural Rajasthan — before returning to build Cobblyn from scratch.
            </p>
          </div>
          <div className="story-founding-visual">
            <div className="story-founding-img">
              <img
                src="https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=700&q=85&fit=crop"
                alt="Artisan at work"
              />
            </div>
            <div className="story-founding-quote">
              <p>"A shoe made with this care isn't just an object — it's a record of someone's 
              attention, their skill, their love."</p>
              <span>— Aryan Mehta, Founder</span>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="story-timeline-section" style={{ background: 'var(--black)' }}>
        <div className="section">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div className="section-label">MILESTONES</div>
            <h2 className="section-title" style={{ color: 'var(--white)' }}>
              The Cobblyn Journey
            </h2>
          </div>
          <div className="story-timeline">
            <div className="story-timeline-line" />
            {milestones.map((m, i) => (
              <div key={i} className={`story-milestone story-milestone-${m.side}`}>
                <div className="story-milestone-dot" />
                <div className="story-milestone-card">
                  <div className="story-milestone-year">{m.year}</div>
                  <h3 className="story-milestone-title">{m.title}</h3>
                  <p className="story-milestone-desc">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CULTURE */}
      <section className="story-culture section">
        <div className="story-culture-grid">
          <div className="story-culture-img">
            <img
              src="https://images.unsplash.com/photo-1542621334-a254cf47733d?w=700&q=85&fit=crop"
              alt="Cobblyn team culture"
            />
          </div>
          <div className="story-culture-content">
            <div className="section-label">OUR CULTURE</div>
            <h2 className="section-title">Craft Is Our Identity</h2>
            <p className="story-text">
              At Cobblyn, culture isn't a corporate value statement — it's lived in the workshop 
              every day. It's the master craftsman who stops the line because a stitch is a 
              millimetre off. It's the designer who discards three leather samples before 
              finding the one with perfect character. It's the apprentice who spends a year 
              learning to skive before touching a finished upper.
            </p>
            <p className="story-text">
              We celebrate slowness. We reward attention. We believe the most revolutionary 
              thing a luxury brand can do today is simply care — deeply, relentlessly, 
              and without compromise.
            </p>
            <a href="/studio" className="view-all" style={{ marginTop: '32px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              See Inside Our Studio <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="story-cta">
        <div className="story-cta-inner">
          <div className="section-label">CONTINUE THE STORY</div>
          <h2 className="story-cta-title">Your Next Chapter Starts Here</h2>
          <p className="story-cta-sub">
            Every pair of Cobblyn shoes carries a piece of our story. 
            Commission yours and become part of what we're building together.
          </p>
          <div className="story-cta-actions">
            <a href="/bespoke" className="btn-hero-primary" style={{ textDecoration: 'none' }}>
              Commission Bespoke
            </a>
            <a href="/men" className="btn-hero-ghost" style={{ textDecoration: 'none' }}>
              Explore Collection
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
