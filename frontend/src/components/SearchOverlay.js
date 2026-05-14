"use client";
﻿import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


const SearchOverlay = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useRouter();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const trendingSearches = ['Oxford Shoes', 'Wedding Jutis', 'Monk Strap', 'Loafers', 'Boots', 'Ballerina'];
  const popularCategories = [
    { name: "Men's Oxford", link: '/men/style/oxford' },
    { name: "Men's Loafer", link: '/men/style/loafer' },
    { name: "Women's Boots", link: '/women/style/boots' },
    { name: "Wedding Collection", link: '/men/occasion/wedding' },
    { name: 'Custom Shoes', link: '/customize' },
    { name: "Women's Jutis", link: '/women/style/jutis' },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      router.push(`/men?search=${encodeURIComponent(query)}`);
    }
  };

  const handleTrendingClick = (term) => {
    setQuery(term);
    onClose();
    router.push(`/men?search=${encodeURIComponent(term)}`);
  };

  if (!isOpen) return null;

  return (
    <div className="search-overlay" data-testid="search-overlay">
      <div className="search-overlay-backdrop" onClick={onClose}></div>
      <div className="search-overlay-content">
        <div className="search-overlay-header">
          <form onSubmit={handleSearch} className="search-overlay-form">
            <Search size={22} className="search-overlay-icon" />
            <input
              ref={inputRef}
              type="text"
              className="search-overlay-input"
              placeholder="Search for shoes, styles, occasions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="search-overlay-input"
            />
            {query && <button type="button" className="search-clear-btn" onClick={() => setQuery('')}><X size={18} /></button>}
          </form>
          <button className="search-close-btn" onClick={onClose} data-testid="search-close-btn">
            <X size={24} />
          </button>
        </div>

        <div className="search-overlay-body">
          <div className="search-col">
            <div className="search-section-title">
              <TrendingUp size={16} /> Trending Searches
            </div>
            <div className="trending-tags">
              {trendingSearches.map((term) => (
                <button key={term} className="trending-tag" onClick={() => handleTrendingClick(term)} data-testid={`trending-${term.toLowerCase().replace(/\s+/g, '-')}`}>
                  {term}
                </button>
              ))}
            </div>
          </div>

          <div className="search-col">
            <div className="search-section-title">
              <Clock size={16} /> Popular Categories
            </div>
            <ul className="popular-links">
              {popularCategories.map((cat) => (
                <li key={cat.name}>
                  <Link href={cat.link} onClick={onClose} className="popular-link" data-testid={`popular-${cat.name.toLowerCase().replace(/\s+/g, '-')}`}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchOverlay;

