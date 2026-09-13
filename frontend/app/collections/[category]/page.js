"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import ProductListPage from '../../../src/views/ProductListPage';

export default function CollectionsCategoryPage() {
  const params = useParams() || {};
  const category = (params.category || 'men').toLowerCase();

  let gender = 'men';
  let title = "Men's Footwear";
  let subtitle = "Artisanal bench-crafted footwear, shaped from full-grain European calfskin and finished with hand-burnished patina.";

  if (category === 'women') {
    gender = 'women';
    title = "Women's Collection";
    subtitle = "Hand-lasted silhouettes crafted for effortless grace and supreme comfort.";
  } else if (category === 'all' || category === 'shoes') {
    gender = 'all';
    title = "All Collections";
    subtitle = "Explore our complete gallery of benchmade leather goods and artisanal footwear.";
  }

  return (
    <ProductListPage
      gender={gender}
      title={title}
      subtitle={subtitle}
    />
  );
}
