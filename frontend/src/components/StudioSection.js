import React from 'react';
import { Scissors, Award, Clock, Users } from 'lucide-react';

const StudioSection = () => {
  const features = [
    {
      icon: <Scissors size={24} />,
      title: 'Master Craftsmanship',
      description: 'Each pair handcrafted by artisans with 20+ years of experience in premium footwear.'
    },
    {
      icon: <Award size={24} />,
      title: 'Premium Materials',
      description: 'Sourced Italian leather, Spanish suede, and the finest materials from around the globe.'
    },
    {
      icon: <Clock size={24} />,
      title: 'Time-Honored Process',
      description: '15-20 days of meticulous work ensuring every stitch, every detail is perfection.'
    },
    {
      icon: <Users size={24} />,
      title: 'Personal Attention',
      description: 'Direct collaboration with our design team for truly personalized footwear.'
    }
  ];

  return (
    <section id="studio" data-testid="studio-section">
      <div className="section-inner">
        <div className="section-label">OUR ATELIER</div>
        <h2 className="section-title">The Cobblyn Magic</h2>
      </div>

      <div className="studio-layout">
        <div className="studio-left">
          <img 
            src="/cobblyn_magic_creative.png" 
            alt="The Cobblyn Magic - Master Craftsmanship"
          />
          <div className="studio-left-overlay"></div>
          <div className="studio-badge">
            <div className="studio-badge-num">20+</div>
            <div className="studio-badge-label">Years of Excellence</div>
          </div>
        </div>

        <div className="studio-right">
          <div className="section-label">HERITAGE & INNOVATION</div>
          <h3 className="studio-subtitle">
            Where Traditional Artistry Meets Contemporary Design
          </h3>
          <p className="studio-text">
            Our studio in the heart of India brings together the finest leather craftsmen, 
            contemporary designers, and traditional cobblers to create footwear that transcends time.
          </p>

          <div className="studio-features">
            {features.map((feature, index) => (
              <div key={index} className="studio-feat" data-testid={`studio-feature-${index}`}>
                <div className="studio-feat-icon">
                  {feature.icon}
                </div>
                <div>
                  <div className="studio-feat-title">{feature.title}</div>
                  <div className="studio-feat-desc">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="studio-cta">
            <button className="btn-studio" data-testid="studio-visit-button">
              Visit Our Studio
            </button>
            <a href="/about" className="studio-link" data-testid="studio-story-link">
              Our Story <span>→</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudioSection;