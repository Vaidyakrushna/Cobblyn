"use client";
import React, { useState } from 'react';
import { Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    alert(`Subscribed with: ${email}`);
    setEmail('');
  };

  return (
    <footer data-testid="footer">
      <div className="footer-main">
        <div>
          <div className="footer-brand-logo">
            C<span className="text-accent">O</span>BBLYN
          </div>
          <p className="footer-tagline">Crafted Beyond the Ordinary</p>
          <div className="footer-socials">
            <a href="https://instagram.com" className="social-btn" data-testid="social-instagram">
              <Instagram size={18} />
            </a>
            <a href="https://facebook.com" className="social-btn" data-testid="social-facebook">
              <Facebook size={18} />
            </a>
            <a href="https://twitter.com" className="social-btn" data-testid="social-twitter">
              <Twitter size={18} />
            </a>
            <a href="https://linkedin.com" className="social-btn" data-testid="social-linkedin">
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        <div>
          <div className="footer-col-title">Shop</div>
          <ul className="footer-links">
            <li><a href="/men">Men's Collection</a></li>
            <li><a href="/women">Women's Collection</a></li>
            <li><a href="/luxe-collection">Luxe Collection</a></li>
            <li><a href="/accessories">Accessories</a></li>
            <li><a href="/customize">Customize</a></li>
            <li><a href="/bespoke">Bespoke Order</a></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Help</div>
          <ul className="footer-links">
            <li><a href="/size-guide">Size Guide</a></li>
            <li><a href="/shipping">Shipping Info</a></li>
            <li><a href="/returns">Returns & Exchange</a></li>
            <li><a href="/care">Shoe Care</a></li>
            <li><a href="/fitting-experience">Fitting Experience</a></li>
            <li><a href="/faq">FAQ</a></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Company</div>
          <ul className="footer-links">
            <li><a href="/story">Our Story</a></li>
            <li><a href="/studio">Our Studio</a></li>
            <li><a href="/careers">Careers</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <div className="footer-col-title">Newsletter</div>
          <p className="footer-newsletter-text">
            Subscribe to get special offers, free giveaways, and updates.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="footer-newsletter-form">
            <input 
              type="email" 
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="newsletter-email-input"
            />
            <button type="submit" data-testid="newsletter-submit-button">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">© 2026 Cobblyn Shoes. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
          <a href="/cookies">Cookie Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;