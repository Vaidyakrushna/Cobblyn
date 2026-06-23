"use client";
import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Search, 
  CreditCard, 
  Truck, 
  RotateCcw, 
  Ruler, 
  Palette, 
  Sparkles,
  ChevronDown, 
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const faqCategories = [
  { id: 'all', label: 'All Questions', icon: <HelpCircle size={18} /> },
  { id: 'ordering', label: 'Ordering & Payments', icon: <CreditCard size={18} /> },
  { id: 'custom', label: 'Custom & Bespoke', icon: <Palette size={18} /> },
  { id: 'shipping', label: 'Shipping & Delivery', icon: <Truck size={18} /> },
  { id: 'returns', label: 'Returns & Exchanges', icon: <RotateCcw size={18} /> },
  { id: 'sizing', label: 'Sizing & Care', icon: <Ruler size={18} /> }
];

const faqs = [
  {
    category: 'ordering',
    q: 'How can I track my order status?',
    a: 'You can check your order status at any time from your My Account dashboard. Once your order has been dispatched, we will also send you an email and SMS with the tracking link and courier details.'
  },
  {
    category: 'ordering',
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit/debit cards (Visa, MasterCard, RuPay, American Express), Net Banking, popular UPI options (GPay, PhonePe, Paytm), and Cash on Delivery (COD) for eligible PIN codes across India. Please note that COD is only available for Ready-to-Ship products and Accessories. Customized and Bespoke orders require prepaid payment.'
  },
  {
    category: 'ordering',
    q: 'Can I modify or cancel my order after placing it?',
    a: 'Since we process standard orders quickly to ensure fast delivery, changes or cancellations can only be requested within 12 hours of placing the order. For bespoke or customized orders, changes cannot be made once our artisans have begun crafting your pair.'
  },
  {
    category: 'ordering',
    q: 'Are Cobblyn shoes made of genuine leather?',
    a: 'Yes, all Cobblyn shoes are handcrafted using premium, full-grain genuine leather. We source the finest materials, including Italian calfskin and premium suede, ensuring our luxury footwear is highly durable, breathable, and develops a beautiful patina over time.'
  },
  {
    category: 'custom',
    q: 'How does the 3D Customizer work?',
    a: 'Simply select any customizable product, click the "Customize This Style" button, and design your own pair. You can select the leather grade (Full-Grain, Suede, Pebble), choose colors, pick sole types (Leather, Rubber, Commando), and add personalized monograms.'
  },
  {
    category: 'custom',
    q: 'What is the difference between Custom and Bespoke shoes?',
    a: 'Custom shoes are crafted using our standard lasts and sizes, allowing you to choose the aesthetics and materials. Bespoke shoes are made to your exact physical foot measurements, requiring a private fitting consultation to build a unique wooden last of your feet.'
  },
  {
    category: 'custom',
    q: 'How long do custom and bespoke orders take to craft?',
    a: 'Every custom and bespoke pair is handcrafted from scratch by our master artisans in Jaipur. This detailed process takes 15–20 business days of crafting time before the product is ready to be dispatched.'
  },
  {
    category: 'custom',
    q: 'Where are Cobblyn shoes manufactured?',
    a: 'Every pair of Cobblyn shoes is meticulously handcrafted by master cobblers in our Jaipur atelier, bringing together decades of traditional Indian shoemaking heritage and world-class luxury design.'
  },
  {
    category: 'custom',
    q: 'What types of soles do you offer?',
    a: 'Our 3D customizer allows you to choose between traditional Leather soles for classic formal elegance, standard Rubber soles for versatile all-weather grip, and Commando soles for a rugged, durable finish.'
  },
  {
    category: 'shipping',
    q: 'Do you offer free shipping?',
    a: 'Yes! Standard shipping is complimentary on all orders across India. We also offer Express Delivery (2-3 business days) for a flat fee of ₹199.'
  },
  {
    category: 'shipping',
    q: 'Do you ship internationally?',
    a: 'Currently, we only ship within India. We are working on international delivery capabilities to bring our Indian-crafted footwear to the world. Sign up for our newsletter to receive updates on international launch timelines.'
  },
  {
    category: 'returns',
    q: 'What is your return and exchange policy?',
    a: 'We offer a 15-day return and size exchange policy on standard, unworn shoes in their original packaging. For returns, you will need to share 4-5 photos to validate the item\'s condition. Once approved, we will arrange a free home pick-up exclusively from your original delivery address.'
  },
  {
    category: 'returns',
    q: 'Can I return customized or bespoke shoes?',
    a: 'Customized and bespoke shoes are individually built to your specific aesthetic tastes or feet measurements. Therefore, we do not accept returns or offer refunds on these products unless they arrive with a manufacturing defect.'
  },
  {
    category: 'sizing',
    q: 'How do I choose the correct size?',
    a: 'We use standard UK sizing for all our shoes. You can view our Size Guide for detailed measurements. We also recommend using the "Find My Fit" concierge widget on our product pages, which maps your athletic shoes (e.g. Nike, Adidas) to our dress shoe lasts.'
  },
  {
    category: 'sizing',
    q: 'What if the shoes don’t fit perfectly?',
    a: 'For standard orders, you can request an exchange for another size within 15 days. For bespoke orders, our fit guarantee covers complimentary adjustments and remaking if necessary to ensure a perfect glove-like fit.'
  },
  {
    category: 'sizing',
    q: 'How should I care for my Cobblyn leather shoes?',
    a: 'Keep them dry and avoid wearing them in heavy rain. Wipe dirt off with a soft horsehair brush, insert cedar shoe trees to maintain their shape, and apply premium leather conditioner every 2–3 months to keep the leather soft and prevent cracking.'
  },
  {
    category: 'sizing',
    q: 'How do I clean and polish leather shoes?',
    a: 'We recommend brushing off dirt with a horsehair brush after every wear. For deep cleaning and shining, use a high-quality wax polish and leather conditioner. Always use cedar shoe trees to absorb moisture and maintain the shape of your shoes.'
  },
  {
    category: 'sizing',
    q: 'Do you offer repair or resoling services?',
    a: 'Yes. We build our shoes to last a lifetime, using Goodyear welt construction on select models. We offer a full recrafting and resoling service for a nominal fee. You can contact hello@cobblynshoes.com to arrange a pickup.'
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaq, setOpenFaq] = useState(null);

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => {
      const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
      const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            faq.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className="faq-page" style={{ background: 'var(--off-white)', minHeight: '100vh', paddingBottom: '80px' }}>
      {/* CSS STYLES FOR THE PREMIUM AESTHETIC */}
      <style jsx global>{`
        .faq-hero {
          position: relative;
          background: var(--black);
          color: var(--white);
          padding: 80px 48px;
          text-align: center;
          overflow: hidden;
          margin-bottom: 40px;
        }
        .faq-hero-content {
          max-width: 680px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .faq-hero-title {
          font-family: 'Playfair Display', serif;
          font-size: 2.8rem;
          font-weight: 400;
          line-height: 1.2;
          margin: 12px 0 20px;
          letter-spacing: -0.01em;
        }
        .faq-hero-title em {
          font-style: italic;
          color: var(--accent);
        }
        .faq-hero-sub {
          color: var(--mid-grey);
          font-size: 0.95rem;
          line-height: 1.6;
        }
        .faq-search-wrap {
          max-width: 500px;
          margin: 24px auto 0;
          position: relative;
        }
        .faq-search-input {
          width: 100%;
          padding: 14px 20px 14px 48px;
          border-radius: 30px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.08);
          color: var(--white);
          font-size: 0.95rem;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
        }
        .faq-search-input:focus {
          border-color: var(--accent);
          outline: none;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 15px rgba(157, 39, 6, 0.25);
        }
        .faq-search-icon {
          position: absolute;
          left: 18px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--mid-grey);
        }
        
        .faq-category-nav {
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin: 0 auto 40px;
          padding: 0 24px;
          max-width: 1000px;
        }
        .faq-category-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 20px;
          border: 1px solid var(--light-grey);
          background: var(--white);
          color: var(--dark-grey);
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .faq-category-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(157, 39, 6, 0.02);
        }
        .faq-category-btn.active {
          background: var(--black);
          border-color: var(--black);
          color: var(--white);
        }
        
        .faq-list-container {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 24px;
        }
        
        .faq-accordion-item {
          background: var(--white);
          border: 1px solid var(--light-grey);
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          transition: border-color 0.2s ease;
        }
        .faq-accordion-item:hover {
          border-color: rgba(157, 39, 6, 0.4);
        }
        .faq-accordion-item.open {
          border-color: var(--accent);
        }
        
        .faq-question-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: none;
          border: none;
          text-align: left;
          font-size: 1rem;
          font-weight: 600;
          color: var(--black);
          cursor: pointer;
          gap: 16px;
        }
        .faq-question-btn span {
          line-height: 1.4;
        }
        .faq-chevron {
          color: var(--mid-grey);
          transition: transform 0.3s ease, color 0.3s ease;
          flex-shrink: 0;
        }
        .faq-accordion-item.open .faq-chevron {
          transform: rotate(180deg);
          color: var(--accent);
        }
        
        .faq-answer {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .faq-accordion-item.open .faq-answer {
          max-height: 300px;
        }
        .faq-answer-content {
          padding: 0 24px 20px;
          color: var(--dark-grey);
          font-size: 0.92rem;
          line-height: 1.6;
        }
        
        .faq-empty {
          text-align: center;
          padding: 48px 24px;
          color: var(--mid-grey);
        }
        .faq-empty-icon {
          margin-bottom: 12px;
          color: var(--light-grey);
        }

        .faq-cta-section {
          background: var(--black);
          color: var(--white);
          margin: 80px 24px 0;
          padding: 60px 48px;
          border-radius: 16px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .faq-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: var(--white);
          padding: 12px 28px;
          border-radius: 24px;
          font-weight: 600;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-decoration: none;
          transition: all 0.2s ease;
          border: none;
          cursor: pointer;
        }
        .faq-cta-btn:hover {
          background: var(--dark-grey);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(157, 39, 6, 0.25);
        }
      `}</style>

      {/* HERO SECTION */}
      <section className="faq-hero">
        <div className="faq-hero-content">
          <div className="section-label" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase' }}>FAQs</div>
          <h1 className="faq-hero-title">Commonly Asked<br /><em>Questions</em></h1>
          <p className="faq-hero-sub">
            Find answers to questions about ordering, custom styles, shipping, resizing, and caring for your Cobblyn shoes.
          </p>

          <div className="faq-search-wrap">
            <Search className="faq-search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search for questions (e.g. shipping, sizing...)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="faq-search-input"
              aria-label="Search FAQs"
            />
          </div>
        </div>
      </section>

      {/* CATEGORY NAV */}
      <nav className="faq-category-nav">
        {faqCategories.map(cat => (
          <button 
            key={cat.id}
            className={`faq-category-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat.id);
              setOpenFaq(null);
            }}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </nav>

      {/* ACCORDION LIST */}
      <section className="faq-list-container">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq, index) => (
            <div 
              key={index} 
              className={`faq-accordion-item ${openFaq === index ? 'open' : ''}`}
              data-testid={`faq-item-${faq.category}`}
            >
              <button 
                className="faq-question-btn" 
                onClick={() => toggleFaq(index)}
                aria-expanded={openFaq === index}
              >
                <span>{faq.q}</span>
                <ChevronDown size={18} className="faq-chevron" />
              </button>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  {faq.a}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="faq-empty">
            <HelpCircle size={48} className="faq-empty-icon" strokeWidth={1} />
            <h4>No Results Found</h4>
            <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>
              We couldn't find any questions matching "{searchQuery}". Try searching for other terms or view another category.
            </p>
          </div>
        )}
      </section>

      {/* CONCIERGE CTA */}
      <section className="faq-cta-section">
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <div className="section-label" style={{ color: 'var(--accent)', fontSize: '0.75rem', letterSpacing: '0.15em', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>STILL HAVE QUESTIONS?</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '2rem', fontWeight: 400, marginBottom: '16px', color: 'var(--white)' }}>
            Speak With Our Concierge
          </h2>
          <p style={{ color: 'var(--mid-grey)', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '32px' }}>
            Our support desk and master stylists are available Monday to Saturday, 10:00 AM to 6:00 PM IST to assist with sizing advice, custom order details, or logistics support.
          </p>
          <Link href="/contact" className="faq-cta-btn">
            <MessageSquare size={16} />
            <span>Connect Now</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
