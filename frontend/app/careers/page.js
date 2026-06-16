"use client";
import React, { useState } from 'react';
import { Sparkles, Briefcase, Award, Heart, Check, Send, Shield, Info, ArrowRight } from 'lucide-react';

const coreValues = [
  {
    icon: <Award size={28} />,
    title: 'Honouring the Craft',
    description: 'We blend centuries-old Goodyear welt construction with modern computational lasts. Our artisans maintain the highest standard of footwear excellence.'
  },
  {
    icon: <Sparkles size={28} />,
    title: 'Obsession with Detail',
    description: 'From 12 stitches per inch to gold-leaf monogram stamps, we believe the smallest nuances define the masterpiece. We never cut corners.'
  },
  {
    icon: <Briefcase size={28} />,
    title: 'Atelier Innovation',
    description: 'We are a digital-first studio. We run custom 3D configurators, a dynamic raw inventory CDN, and mathematical sizing engines.'
  },
  {
    icon: <Heart size={28} />,
    title: 'Human-Centric Culture',
    description: 'We offer competitive medical suites, equity pools, continuing education under Italian masters, and creative freedom in our design labs.'
  }
];

const openPositions = [
  {
    id: 'pos-1',
    title: 'Master Last Maker & Pattern Cutter',
    department: 'Atelier Craft',
    location: 'Mumbai Studio (Onsite)',
    type: 'Full-Time',
    description: 'Sculpt bespoke wooden shoe lasts and translate high-fashion concepts into precise leather pattern cuttings.',
    requirements: [
      '5+ years of experience in luxury bespoke shoemaking or leather goods.',
      'Deep understanding of calf leather grains, shell cordovans, and pattern grading.',
      'A passion for heritage footwear structures (Goodyear Welt, Blake Stitching).'
    ]
  },
  {
    id: 'pos-2',
    title: 'Atelier Coordinator & Concierge Lead',
    department: 'Client Relations',
    location: 'Delhi Studio & Hybrid',
    type: 'Full-Time',
    description: 'Direct high-touch virtual stylings, WhatsApp business consulting queues, and custom bespoke fitting schedules.',
    requirements: [
      '3+ years of experience in luxury customer experience, premium hospitality, or personal styling.',
      'Exceptional written and spoken communication with premium brand vocabulary.',
      'Proficiency in CRM databases and VIP appointment calendar booking.'
    ]
  },
  {
    id: 'pos-3',
    title: 'Senior Front-End Artisan (Next.js & WebGL)',
    department: 'Digital Experience',
    location: 'Bengaluru Hub / Remote',
    type: 'Full-Time',
    description: 'Architect our WebGL bespoke customizer canvas, dynamic pricing simulators, and real-time inventory systems.',
    requirements: [
      'Strong mastery of React, Next.js (App Router), Tailwind CSS, and TypeScript.',
      'Familiarity with Three.js, WebGL shaders, or hardware-accelerated CSS transitions.',
      'Obsessed with motion, micro-animations, and pixel-perfect design assets.'
    ]
  },
  {
    id: 'pos-4',
    title: 'Lead Footwear Designer & Stylist',
    department: 'Creative Studio',
    location: 'Mumbai Studio / Hybrid',
    type: 'Full-Time',
    description: 'Shape seasonal collection tiles, colorway portfolios, and bespoke accessories catalogs.',
    requirements: [
      'Degree in Fashion Design, Footwear Engineering, or equivalent industrial portfolio.',
      'Expertise in luxury shoe sketching, CAD design, and material mapping.',
      'Deep understanding of contemporary and traditional Indian ceremonial styles.'
    ]
  }
];

export default function CareersPage() {
  const [selectedRole, setSelectedRole] = useState('');
  const [applicationForm, setApplicationForm] = useState({
    name: '',
    email: '',
    phone: '',
    portfolio: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeAccordion, setActiveAccordion] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setApplicationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToastMessage('✨ Registering your application with our Atelier Council...');

    setTimeout(() => {
      setIsSubmitting(false);
      setToastMessage('✓ Application submitted successfully! We will contact you in 48 hours.');
      setApplicationForm({
        name: '',
        email: '',
        phone: '',
        portfolio: '',
        message: ''
      });
      setSelectedRole('');
      
      setTimeout(() => {
        setToastMessage('');
      }, 4000);
    }, 1800);
  };

  return (
    <main className="careers-page" style={{ position: 'relative' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: '#111', border: '2px solid #9d2706', borderRadius: '8px', padding: '12px 24px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <Sparkles size={16} color="#9d2706" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="care-hero">
        <div className="care-hero-content">
          <div className="section-label">WE ARE HIRING</div>
          <h1 className="care-hero-title">
            Join the
            <br />
            <em>Cobblyn Atelier</em>
          </h1>
          <p className="care-hero-sub">
            Crafting the future of luxury footwear requires more than talent — it takes devotion. 
            Help us build digital-first artisan masterpieces designed for generations.
          </p>
          <a href="#roles" className="btn-hero-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            Explore Openings
          </a>
        </div>
        <div className="care-hero-visual">
          <img
            src="https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=900&q=85&fit=crop"
            alt="Handcrafting premium leather shoes"
          />
          <div className="care-hero-img-overlay" />
        </div>
      </section>

      {/* OUR VALUES */}
      <section className="care-philosophy section">
        <div className="care-phil-inner" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '48px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="section-label">OUR VALUES</div>
            <h2 className="section-title">What Drives the Atelier</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--dark-grey)', fontSize: '0.9rem', lineHeight: '1.85' }}>
              We believe in high-standards, creative autonomy, and respectful collaboration. 
              Our team consists of generational shoemakers, digital designers, and full-stack software artists.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            {coreValues.map((value, idx) => (
              <div key={idx} style={{ padding: '24px', background: 'var(--off-white)', borderRadius: '12px', border: '1px solid rgba(157,39,6,0.15)', transition: 'all 0.3s ease' }}>
                <div style={{ color: '#9d2706', marginBottom: '16px' }}>{value.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: '#1c1917' }}>{value.title}</h3>
                <p style={{ fontSize: '0.8rem', color: '#78716c', lineHeight: 1.6 }}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN POSITIONS ACCORDION */}
      <section id="roles" className="care-guide section" style={{ background: 'var(--off-white)' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div className="section-label">CAREER OPPORTUNITIES</div>
          <h2 className="section-title">Open Positions</h2>
          <p style={{ maxWidth: '520px', margin: '0 auto', color: 'var(--mid-grey)', fontSize: '0.88rem', lineHeight: '1.85' }}>
            Find your calling in our artisan production line, digital development squad, or concierge team.
          </p>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {openPositions.map((pos, idx) => (
            <div key={pos.id} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', background: '#fff', border: '1px solid #e7e5e4' }}>
              <button 
                onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                style={{ width: '100%', padding: '18px 24px', background: activeAccordion === idx ? '#111' : '#fff', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease', textAlign: 'left' }}
              >
                <div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: activeAccordion === idx ? '#9d2706' : 'var(--mid-grey)' }}>
                    {pos.department} · {pos.location}
                  </span>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: activeAccordion === idx ? '#fff' : '#1c1917', marginTop: '4px' }}>
                    {pos.title}
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: activeAccordion === idx ? '#9d2706' : 'var(--mid-grey)' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>{pos.type}</span>
                  <span style={{ transform: activeAccordion === idx ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', display: 'inline-block' }}>▼</span>
                </div>
              </button>

              <div style={{ maxHeight: activeAccordion === idx ? '800px' : '0px', overflow: 'hidden', transition: 'max-height 0.4s ease', borderTop: activeAccordion === idx ? '1px solid #e7e5e4' : 'none' }}>
                <div style={{ padding: '24px' }}>
                  <p style={{ fontSize: '0.85rem', color: '#444', lineHeight: 1.6, marginBottom: '16px' }}>{pos.description}</p>
                  
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1c1917', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Requirements:</h4>
                  <ul style={{ paddingLeft: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pos.requirements.map((req, rIdx) => (
                      <li key={rIdx} style={{ fontSize: '0.8rem', color: '#666', listStyleType: 'square' }}>{req}</li>
                    ))}
                  </ul>

                  <a 
                    href="#apply" 
                    onClick={() => setSelectedRole(pos.title)} 
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#9d2706', color: '#fff', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textDecoration: 'none', cursor: 'pointer' }}
                  >
                    Apply For This Role <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section id="apply" className="care-dos-donts section">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div className="section-label">JOIN THE COUNCIL</div>
            <h2 className="section-title">Submit Application</h2>
            <p style={{ color: 'var(--mid-grey)', fontSize: '0.85rem', marginTop: '6px' }}>
              Submit your credentials below. Our design director and artisan leads review portfolios weekly.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="glass-dark-gilded" style={{ border: '1px solid rgba(157, 39, 6, 0.4)', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.62rem', color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Desired Role</label>
              <select 
                required 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
              >
                <option value="">-- Choose an Open Role --</option>
                {openPositions.map(pos => (
                  <option key={pos.id} value={pos.title}>{pos.title}</option>
                ))}
                <option value="General Application">General Atelier Application</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Your Name</label>
                <input 
                  type="text" 
                  required 
                  name="name"
                  value={applicationForm.name}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                  placeholder="E.g. Krushn"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  name="email"
                  value={applicationForm.email}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                  placeholder="krushn@cobblynstudio.com"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Phone Number</label>
                <input 
                  type="tel" 
                  required 
                  name="phone"
                  value={applicationForm.phone}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Portfolio or LinkedIn Link</label>
                <input 
                  type="url" 
                  required 
                  name="portfolio"
                  value={applicationForm.portfolio}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                  placeholder="https://behance.net/your-art"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.62rem', color: '#9d2706', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Why do you want to join Cobblyn?</label>
              <textarea 
                rows={4}
                required
                name="message"
                value={applicationForm.message}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem', resize: 'vertical' }}
                placeholder="Share your passion for craftsmanship, luxury style, or engineering with us..."
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ width: '100%', padding: '12px', background: '#9d2706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.3s ease' }}
            >
              {isSubmitting ? 'Transmitting Application...' : <><Send size={14} /> Submit Application</>}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
