import React from 'react';

const Marquee = () => {
  const text = 'Handcrafted Excellence · Premium Leather · Bespoke Design · Indian Craftsmanship · Italian Materials · ';
  
  return (
    <div className="marquee" data-testid="marquee">
      <div className="marquee-inner">
        {[...Array(4)].map((_, i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
};

export default Marquee;