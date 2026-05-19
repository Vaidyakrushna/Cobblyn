"use client";
import React from 'react';

const TopBar = () => {
  return (
    <div className="ann-bar" data-testid="top-announcement-bar">
      <p>
        <span data-testid="free-shipping-notice">Free Shipping on All Orders Across India</span>
        <span className="px-2">·</span>
        <span data-testid="starting-price-announcement">
          Premium Custom Shoes <span className="text-accent">Starting From ₹6,000</span>
        </span>
        <span className="px-2">·</span>
        <span data-testid="delivery-info">Delivery in 15-20 Business Days</span>
      </p>
    </div>
  );
};

export default TopBar;