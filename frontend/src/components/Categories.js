import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const Categories = () => {
  const categories = [
    {
      id: 'men',
      title: "Men's Collection",
      tag: 'FOR HIM',
      subtitle: 'Timeless styles crafted for the modern gentleman',
      image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=900&q=85&fit=crop&crop=center',
      links: ['Oxford', 'Loafer', 'Monk Strap', 'Derby', 'Boots']
    },
    {
      id: 'women',
      title: "Women's Collection",
      tag: 'FOR HER',
      subtitle: 'Elegant designs celebrating feminine grace',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=900&q=85&fit=crop',
      links: ['Ballerina', 'Loafers', 'Boots', 'Jutis', 'Peep Toes']
    }
  ];

  return (
    <section id="categories" data-testid="categories-section">
      <div className="section-inner">
        <div className="section-label">EXPLORE</div>
        <h2 className="section-title">Collections</h2>
      </div>

      <div className="cat-grid">
        {categories.map((category) => (
          <div 
            key={category.id} 
            className="cat-panel"
            data-testid={`category-${category.id}`}
          >
            <a href={`/${category.id}`} style={{ display: 'block', overflow: 'hidden' }}>
              <img src={category.image} alt={category.title} style={{ cursor: 'pointer', transition: 'transform 0.5s ease' }} />
            </a>
            <div className="cat-content">
              <div className="cat-tag">{category.tag}</div>
              <h3 className="cat-title">{category.title}</h3>
              <p className="cat-sub">{category.subtitle}</p>
              <div className="cat-links">
                {category.links.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={`/${category.id}?style=${encodeURIComponent(link)}`} 
                    className="cat-link"
                    data-testid={`category-link-${link.toLowerCase()}`}
                  >
                    {link}
                  </a>
                ))}
              </div>
            </div>
            <a href={`/${category.id}`} className="cat-shop-btn" data-testid={`shop-${category.id}`}>
              <ArrowUpRight size={20} />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Categories;