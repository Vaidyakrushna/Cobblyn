"use client";
import React, { useRef, useState } from 'react';
import Link from 'next/link';

const ACCESSORIES_DATA = [
  {
    id: 'acc-1',
    name: 'Tan Dress Belt',
    price: '₹2,800',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=85&fit=crop',
    featured: false,
    link: '/accessories/product/acc-1'
  },
  {
    id: 'acc-2',
    name: 'Heritage Bifold Wallet',
    price: '₹3,500',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=85&fit=crop',
    featured: true,
    link: '/accessories/product/acc-2'
  },
  {
    id: 'acc-3',
    name: 'Merino Dress Socks',
    price: '₹850',
    image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=600&q=85&fit=crop',
    featured: false,
    link: '/accessories/product/acc-3'
  },
  {
    id: 'acc-4',
    name: 'Leather Key Fob',
    price: '₹1,200',
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&q=85&fit=crop',
    featured: false,
    link: '/accessories/product/acc-4'
  },
  {
    id: 'acc-5',
    name: 'Shoe Care Travel Kit',
    price: '₹2,200',
    image: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&q=85&fit=crop',
    featured: false,
    link: '/accessories/product/acc-5'
  }
];

const AccessoriesSection = () => {
  const carouselRef = useRef(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e) => {
    setIsDown(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <section className="acc-section" id="accessories" data-testid="accessories-section">
      <div className="acc-header sig-header">
        <div>
          <div className="section-label">NEW IN STORE</div>
          <h2 className="section-title">Fresh Drops & <em>Trending Styles</em></h2>
        </div>
        <Link href="/accessories" className="view-all">View All Accessories →</Link>
      </div>

      <div className="acc-carousel-wrap">
        <div className="acc-nav acc-nav-prev">
          <button className="acc-nav-btn" onClick={() => scroll('left')} aria-label="Previous accessories">‹</button>
        </div>
        
        <div 
          className="acc-carousel" 
          ref={carouselRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          style={{ cursor: isDown ? 'grabbing' : 'grab' }}
        >
          {ACCESSORIES_DATA.map((item) => (
            <div 
              key={item.id} 
              className={`acc-card ${item.featured ? 'featured' : ''}`}
              data-testid={`acc-card-${item.id}`}
            >
              <img src={item.image} alt={item.name} draggable="false" />
              <div className="acc-card-info">
                <div className="acc-card-name">{item.name}</div>
                <div className="acc-card-price">{item.price}</div>
                <Link href={item.link} className="btn-view">
                  View Product
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="acc-nav acc-nav-next">
          <button className="acc-nav-btn" onClick={() => scroll('right')} aria-label="Next accessories">›</button>
        </div>
      </div>
    </section>
  );
};

export default AccessoriesSection;
