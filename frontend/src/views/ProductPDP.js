"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronRight, Heart, Share2, Truck, Shield, RotateCcw, Award, Star, X, 
  Palette, ShoppingBag, CheckCircle, Ruler, Sparkles, RefreshCw, Layers, Check, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import ProductReviews from '../components/ProductReviews';
import SizeGuide from '../components/SizeGuide';

const COLOR_HEX_MAP = {
  'black': '#1A1A1A',
  'brown': '#5C4033',
  'tan': '#C19A6B',
  'cognac': '#834A24',
  'burgundy': '#722F37',
  'oxblood': '#4A0000',
  'navy': '#1B2A4A',
  'olive': '#556B2F',
  'olive green': '#556B2F',
  'sand': '#C2B280',
  'grey': '#808080',
  'gray': '#808080',
  'dark brown': '#3B2316',
  'chestnut': '#954535',
  'white': '#FFFFFF',
  'nude': '#E3BC9A',
  'gold': '#9D2706',
  'red': '#8B0000',
};

const SIZE_CONVERSIONS = {
  '5': { uk: '5', eu: '39', us: '6' },
  '6': { uk: '6', eu: '40', us: '7' },
  '7': { uk: '7', eu: '41', us: '8' },
  '8': { uk: '8', eu: '42', us: '9' },
  '9': { uk: '9', eu: '43', us: '10' },
  '10': { uk: '10', eu: '44', us: '11' },
  '11': { uk: '11', eu: '45', us: '12' },
  '12': { uk: '12', eu: '46', us: '13' },
};

const getEditorialStory = (p) => {
  const style = ((p.style || p.category || '') + ' ' + (p.name || '')).toLowerCase();
  if (style.includes('oxford')) {
    return 'Hand-lasted with meticulous bench-work from premium full-grain calf leather, the Classic Oxford represents the definitive pinnacle of formal boardroom footwear. Constructed with authentic Goodyear welting, each pair offers foot-molding cork comfort, breathable leather linings, and can be endlessly resoled for a lifetime of distinguished wear.';
  }
  if (style.includes('loafer')) {
    return 'The quintessential slip-on, reimagined with Italian craftsmanship and buttery soft hides. Designed with traditional hand-sewn moccasin stitch detailing and cushioned footbeds, offering effortless luxury from morning executive meetings to private club dinners.';
  }
  if (style.includes('monk')) {
    return 'A commanding statement of sartorial refinement. Featuring hand-burnished leather with antique brass buckles and dual leather outsoles, delivering striking visual presence with enduring artisanal longevity.';
  }
  if (style.includes('derby')) {
    return 'An everyday classic tailored with an open lacing system for enhanced instep comfort. Bench-crafted from hand-selected calfskin with hand-dyed edge burnishing, balancing versatile practicality with impeccable luxury.';
  }
  if (style.includes('boot')) {
    return 'Rugged heritage harmonized with bespoke elegance. Built on heavyweight full-grain hides with storm-welted outsoles and moisture-resistant calf linings, engineered for all-season poise and enduring durability.';
  }
  if (style.includes('flat') || style.includes('ballerina')) {
    return 'Pure Italian grace and effortless poise. Sculpted from butter-soft Nappa leather with an anatomically cushioned footbed, offering cloud-like comfort and timeless silhouettes from dawn to dusk.';
  }
  return 'Bench-crafted by master cobblers with authentic traditional construction, selected full-grain hides, and uncompromising attention to detail. Built to mold to your stride, developing a rich personal character over years of wear.';
};

const getNormalizedSpecs = (p) => {
  const specs = {};
  if (p.upperMaterial || p.material) specs['Upper Leather'] = p.upperMaterial || p.material;
  if (p.liningMaterial) specs['Lining'] = p.liningMaterial;
  if (p.constructionType) specs['Construction'] = p.constructionType;
  if (p.soleType || p.sole) specs['Outsole'] = p.soleType || p.sole;
  if (p.category || p.style) specs['Silhouette'] = p.category || p.style;
  if (p.occasion) specs['Occasion'] = Array.isArray(p.occasion) ? p.occasion.join(', ') : String(p.occasion);
  if (p.articleCode || p.sku) specs['Article Code'] = p.articleCode || p.sku;
  
  if (p.specifications && typeof p.specifications === 'object') {
    if (Array.isArray(p.specifications)) {
      p.specifications.forEach(s => {
        if (s && s.key && s.value) specs[s.key] = s.value;
      });
    } else {
      Object.assign(specs, p.specifications);
    }
  }

  if (!specs['Upper Leather']) specs['Upper Leather'] = 'Full-Grain Calfskin Leather';
  if (!specs['Lining']) specs['Lining'] = 'Supple Natural Calf Leather';
  if (!specs['Construction']) specs['Construction'] = 'Goodyear Welt Construction';
  if (!specs['Outsole']) specs['Outsole'] = 'Hand-Finished Leather with Rubber Grip';
  if (!specs['Insole']) specs['Insole'] = 'Vegetable-Tanned Cork-Bed Footbed';
  if (!specs['Resolability']) specs['Resolability'] = '100% Resolable by any master cobbler';

  return specs;
};

const getNormalizedFeatures = (p) => {
  if (Array.isArray(p.features) && p.features.length > 0) return p.features;
  if (Array.isArray(p.keySellingFeatures) && p.keySellingFeatures.filter(Boolean).length > 0) {
    return p.keySellingFeatures.filter(Boolean);
  }
  return [
    'Hand-lasted Goodyear Welt construction for lifetime durability',
    '100% full-grain calf leather developing a rich personal patina',
    'Natural cork insole bed that molds custom to your foot arch',
    'Breathable glove-soft leather lining for all-day dry comfort',
    'Beveled waist and channel-stitched leather outsoles'
  ];
};

const mockReviews = [
  { id: 1, name: 'Vikramaditya S.', rating: 5, date: '2 weeks ago', text: 'Exceptional bench-made quality. The leather aroma and Goodyear welted structure rival European ateliers costing thrice as much.' },
  { id: 2, name: 'Dr. Kabir Roy', rating: 5, date: '1 month ago', text: 'Ordered as my bespoke wedding pair. The comfort right out of the presentation box is extraordinary.' },
  { id: 3, name: 'Ananya Deshmukh', rating: 5, date: '1 month ago', text: 'Finest Indian luxury brand for leather craftsmanship. The attention to last proportions is world-class.' },
  { id: 4, name: 'Rohan Mehra', rating: 5, date: '2 months ago', text: 'The break-in took just two wears, after which the cork footbed molded like a glove. Highly recommended.' },
];

const ProductPDP = ({ gender = 'men' }) => {
  const { id } = useParams();
  const navigate = useRouter();
  const { isAuthenticated } = useAuth();

  const [rawProduct, setRawProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const [loginPanel, setLoginPanel] = useState(false);
  const [sharePopup, setSharePopup] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartInterstitial, setCartInterstitial] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('specifications');
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [sizeSystem, setSizeSystem] = useState('UK'); // 'UK' | 'EU' | 'US'
  const [ensembleItems, setEnsembleItems] = useState({ shoe: true, cardholder: true, belt: true });
  const mainBuyBtnRef = useRef(null);

  // Sizing Fit Profiler States
  const [showFitProfiler, setShowFitProfiler] = useState(false);
  const [fitBrand, setFitBrand] = useState('Nike');
  const [fitSize, setFitSize] = useState('9');
  const [fitWidth, setFitWidth] = useState('Standard');
  const [fitResult, setFitResult] = useState(null);

  const calculateRecommendedSize = () => {
    const numSize = Number(fitSize);
    let recommended = numSize;
    if (fitBrand === 'Nike' || fitBrand === 'Adidas') {
      recommended = numSize - 1;
    } else {
      recommended = numSize;
    }
    if (fitWidth === 'Wide') {
      recommended = Math.min(12, recommended + 0.5);
    } else if (fitWidth === 'Narrow') {
      recommended = Math.max(6, recommended - 0.5);
    }
    setFitResult(recommended);
  };

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await api.getProduct(id);
        setRawProduct(data);

        // Normalize color default
        if (Array.isArray(data.colors) && data.colors.length > 0) {
          const first = data.colors[0];
          setSelectedColor(typeof first === 'string' ? first : first.name || '');
        }

        // Fetch related products
        try {
          const relData = await api.getProducts({ gender: data.gender || gender, limit: 5 });
          setRelatedProducts((relData.products || []).filter(p => String(p.id) !== String(data.id)).slice(0, 4));
        } catch (_) {}

        // Check wishlist
        if (isAuthenticated && data.id) {
          try {
            const wl = await api.checkWishlist(data.id);
            setIsWishlisted(Boolean(wl.in_wishlist));
          } catch (_) {}
        }
      } catch (err) {
        console.error('Failed to fetch product:', err);
      }
      setLoading(false);
    };
    if (id) fetchProduct();
    setSelectedImage(0);
    setQuantity(1);
  }, [id, gender, isAuthenticated]);

  // Scroll listener for sticky buy bar
  useEffect(() => {
    const handleScroll = () => {
      if (mainBuyBtnRef.current) {
        const rect = mainBuyBtnRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading || !rawProduct) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-white px-4">
        <div className="w-12 h-12 border-2 border-dark/10 border-t-[#9D2706] rounded-full animate-spin mb-4" />
        <p className="text-xs font-medium tracking-widest uppercase text-dark/50">Consulting Atelier Vault…</p>
      </div>
    );
  }

  // Data Normalization
  const product = rawProduct;
  const rawImages = (Array.isArray(product.images) && product.images.length > 0)
    ? product.images
    : (product.image ? [product.image] : ['https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=900&q=85&fit=crop']);

  // Normalize colors array
  const normalizedColors = (product.colors || ['Black']).map(c => {
    if (typeof c === 'string') {
      const lower = c.toLowerCase().trim();
      return { name: c, hex: COLOR_HEX_MAP[lower] || '#1A1A1A' };
    }
    return { name: c.name || 'Standard', hex: c.hex || COLOR_HEX_MAP[(c.name || '').toLowerCase()] || '#1A1A1A' };
  });

  const rawSizes = (Array.isArray(product.sizes) && product.sizes.length > 0)
    ? product.sizes
    : ['6', '7', '8', '9', '10', '11'];

  const editorialDescription = product.description && product.description.trim().length > 0
    ? product.description
    : getEditorialStory(product);

  const specifications = getNormalizedSpecs(product);
  const featuresList = getNormalizedFeatures(product);
  const avgRating = (mockReviews.reduce((sum, r) => sum + r.rating, 0) / mockReviews.length).toFixed(1);
  const displayPrice = Number(product.price || 0);
  const displayOriginalPrice = product.originalPrice ? Number(product.originalPrice) : (displayPrice ? Math.round(displayPrice * 1.25) : 0);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handlePincodeCheck = () => {
    if (!pincode || pincode.trim().length < 6) {
      setPincodeStatus({ success: false, message: 'Please enter a valid 6-digit Indian pincode' });
      return;
    }
    const days = (Number(pincode.slice(-1)) % 3) + 2;
    setPincodeStatus({ 
      success: true, 
      message: `Express Delivery available: Estimated arrival in ${days} to ${days + 2} business days. Complimentary white-glove shipping.` 
    });
  };

  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert('Please select your UK shoe size.');
      return;
    }

    const sizeStock = product.size_stock || {};
    const stockCount = sizeStock[String(selectedSize)] !== undefined ? Number(sizeStock[String(selectedSize)]) : 10;
    if (stockCount === 0) {
      alert(`Size UK ${selectedSize} is currently reserved. Please select another size or request a bespoke commission.`);
      return;
    }

    if (!isAuthenticated) {
      setLoginPanel(true);
      return;
    }

    try {
      await api.addToCart({
        product_id: product.id,
        size: selectedSize,
        color: selectedColor || normalizedColors[0]?.name || 'Standard',
        quantity
      });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      try {
        const cart = await api.getCart();
        const subtotal = (cart?.items || []).reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0);
        setCartTotal(subtotal);
      } catch (_) {}
      setCartInterstitial(true);
    } catch (err) {
      alert('Failed to add to bag: ' + err.message);
    }
  };

  const handleWishlistClick = async () => {
    if (!isAuthenticated) {
      setLoginPanel(true);
      return;
    }
    try {
      if (isWishlisted) {
        await api.removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await api.addToWishlist(product.id);
        setIsWishlisted(true);
      }
      window.dispatchEvent(new Event('cobblyn-wishlist-update'));
    } catch (err) {
      console.error('Wishlist error:', err);
    }
  };

  const handleBuyNow = async () => {
    if (!selectedSize) {
      alert('Please select your shoe size before proceeding to checkout.');
      return;
    }
    if (!isAuthenticated) {
      setLoginPanel(true);
      return;
    }
    try {
      await api.addToCart({
        product_id: product.id,
        size: selectedSize,
        color: selectedColor || normalizedColors[0]?.name || 'Standard',
        quantity: 1
      });
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      navigate.push('/checkout');
    } catch (err) {
      alert('Could not proceed to checkout: ' + err.message);
    }
  };

  const handleAddEnsembleToCart = async () => {
    if (!selectedSize && ensembleItems.shoe) {
      alert('Please select your shoe size before adding the ensemble.');
      return;
    }
    if (!isAuthenticated) {
      setLoginPanel(true);
      return;
    }
    try {
      if (ensembleItems.shoe) {
        await api.addToCart({
          product_id: product.id,
          size: selectedSize,
          color: selectedColor || normalizedColors[0]?.name || 'Standard',
          quantity: 1
        });
      }
      window.dispatchEvent(new Event('cobblyn-cart-update'));
      alert('Ensemble successfully added to your shopping bag!');
    } catch (err) {
      alert('Failed to add ensemble: ' + err.message);
    }
  };

  const getCustomizeUrl = () => {
    const model = product.style || product.category || specifications['Silhouette'] || 'Oxford';
    const submodel = product.name || '';
    const leather = specifications['Upper Leather'] || 'Full-Grain Leather';
    const color = selectedColor || '';
    const sole = specifications['Outsole'] || 'Leather';
    const qs = new URLSearchParams({
      gender: (product.gender || gender || 'men').toLowerCase(),
      model,
      submodel,
      leather,
      color,
      sole
    }).toString();
    return `/customize/${(product.gender || gender || 'men').toLowerCase()}?${qs}`;
  };

  const currentGender = (product.gender || gender || 'men').toLowerCase();
  const collectionPath = currentGender === 'women' ? '/women' : currentGender === 'luxe-collection' ? '/luxe-collection' : '/men';

  return (
    <div className="bg-white min-h-screen text-[#0A0A0A] font-sans antialiased selection:bg-[#9D2706]/10 selection:text-[#9D2706]">
      {/* Luxury Breadcrumbs Bar */}
      <div className="border-b border-[#0A0A0A]/5 bg-[#FAF9F6] py-3 px-6 md:px-12 text-[11px] font-medium tracking-wider uppercase text-[#0A0A0A]/60">
        <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-[#9D2706] transition-colors">CobCult</Link>
          <ChevronRight size={11} className="text-[#0A0A0A]/30" />
          <Link href={collectionPath} className="hover:text-[#9D2706] transition-colors">{product.gender || 'Men'}'s Atelier</Link>
          <ChevronRight size={11} className="text-[#0A0A0A]/30" />
          <span className="text-[#0A0A0A] font-semibold">{product.name}</span>
          <span className="ml-auto hidden md:inline-flex items-center gap-1.5 text-[10px] tracking-widest text-[#9D2706] font-semibold">
            <Sparkles size={12} /> BENCH-MADE GOODYEAR WELT
          </span>
        </div>
      </div>

      {/* Main Two-Column Hero Stage */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">
          
          {/* LEFT: Editorial Image Gallery */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col-reverse md:flex-row gap-4 sticky top-24">
            {/* Vertical Thumbnails */}
            <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto scrollbar-none shrink-0 py-1 md:py-0">
              {rawImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-16 h-16 md:w-20 md:h-20 rounded-sm overflow-hidden border-2 transition-all p-1 bg-[#FAF9F6] relative group ${
                    selectedImage === idx ? 'border-[#9D2706] shadow-sm ring-1 ring-[#9D2706]' : 'border-transparent hover:border-[#0A0A0A]/20'
                  }`}
                  aria-label={`View angle ${idx + 1}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105" />
                </button>
              ))}
            </div>

            {/* Hero Interactive Stage */}
            <div className="flex-1 relative bg-[#FAF9F6] border border-[#0A0A0A]/5 rounded-sm overflow-hidden group">
              {/* Corner Artisanal Badge */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
                <span className="bg-[#0A0A0A] text-white text-[9px] font-bold tracking-[0.2em] uppercase px-3 py-1.5 shadow-md">
                  {product.badge || 'ATELIER BENCH-MADE'}
                </span>
                {product.customized && (
                  <span className="bg-[#9D2706] text-white text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 shadow-sm flex items-center gap-1">
                    <Sparkles size={10} /> Bespoke Order Ready
                  </span>
                )}
              </div>

              {/* Top Right Quick Actions */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={handleWishlistClick}
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
                    isWishlisted ? 'bg-[#9D2706] text-white' : 'bg-white/85 text-[#0A0A0A] hover:bg-white hover:text-[#9D2706]'
                  }`}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                >
                  <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Product link copied to clipboard!');
                    }
                  }}
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-white/85 backdrop-blur-md text-[#0A0A0A] hover:bg-white hover:text-[#9D2706] transition-all shadow-sm"
                  title="Share Shoe"
                >
                  <Share2 size={16} />
                </button>
              </div>

              {/* Main Image with Zoom Lens */}
              <div 
                className="w-full aspect-[4/5] md:aspect-square relative cursor-zoom-in overflow-hidden flex items-center justify-center p-6"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
              >
                <img
                  src={rawImages[selectedImage] || rawImages[0]}
                  alt={product.name}
                  className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-300 ${
                    isZoomed ? 'scale-150 pointer-events-none' : 'scale-100'
                  }`}
                  style={isZoomed ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                />
              </div>

              {/* Image Counter */}
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm border border-black/5 text-[10px] font-semibold tracking-widest px-2.5 py-1 text-[#0A0A0A]/60">
                {selectedImage + 1} / {rawImages.length}
              </div>
            </div>
          </div>

          {/* RIGHT: Modernized Luxury Information Column */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-6">
            
            {/* Title & Collection Header */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#9D2706] mb-2 flex items-center gap-2">
                <span>COBCULT ATELIER</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#9D2706]" />
                <span>BENCHWORK SERIES</span>
              </p>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-normal font-serif text-[#0E0D0C] leading-tight mb-2 tracking-tight">
                {product.name}
              </h1>
              <p className="text-xs text-[#7A736B] tracking-wider uppercase mb-3">
                {specifications['Upper Leather'] || 'Italian Full-Grain Crust Calfskin'} {selectedColor ? `· ${selectedColor}` : ''}
              </p>

              <div className="flex items-center gap-4 text-xs text-[#0E0D0C]/60 pb-4 border-b border-[#0E0D0C]/10">
                <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#0E0D0C]/10 px-2.5 py-1 rounded-sm">
                  <span className="font-bold text-[#0E0D0C]">{avgRating}</span>
                  <div className="flex text-[#9D2706]">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={11} fill={i <= Math.round(Number(avgRating)) ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span className="text-[10px] text-[#7A736B] font-semibold pl-1">({mockReviews.length} Verified Patrons)</span>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-[#7A736B]">
                  Article: <strong className="text-[#0E0D0C] font-semibold">{product.articleCode || product.sku || 'BYD-OXF-102'}</strong>
                </span>
              </div>
            </div>

            {/* Price & Offer Display */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-3xl md:text-4xl font-serif font-semibold text-[#0E0D0C] tracking-tight">
                  ₹{displayPrice.toLocaleString('en-IN')}
                </span>
                {displayOriginalPrice > displayPrice && (
                  <>
                    <span className="text-base text-[#9CA3AF] line-through font-normal">
                      ₹{displayOriginalPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs font-semibold tracking-wider uppercase text-[#9D2706] bg-[#9D2706]/8 px-2.5 py-0.5 border border-[#9D2706]/20 rounded-sm">
                      -{Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)}% Atelier Direct
                    </span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-[#7A736B] tracking-wide flex items-center gap-1.5">
                <CheckCircle size={13} className="text-[#9D2706]" />
                <span>Inclusive of all taxes &amp; complimentary insured Pan-India express delivery</span>
              </p>
            </div>

            {/* Master Cordwainer's Note */}
            <div className="bg-[#FAF9F6] border-l-2 border-[#9D2706] p-4 text-xs md:text-sm text-[#3A3632] leading-relaxed font-light italic">
              "{editorialDescription}"
            </div>

            {/* Key Craftsmanship Points */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A736B]">Craftsmanship Highlights</p>
              <div className="flex flex-wrap gap-2">
                {featuresList.slice(0, 4).map((f, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#4A4540] bg-[#FAF9F6] border border-[#E8E4DD] px-3 py-1.5 rounded-sm">
                    <span className="text-[#9D2706] font-bold">✦</span>
                    <span>{f}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Color Swatches */}
            {normalizedColors.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#0E0D0C]/70">
                    Leather Finish: <span className="text-[#0E0D0C] font-semibold">{selectedColor}</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  {normalizedColors.map((color) => {
                    const isActive = selectedColor.toLowerCase() === color.name.toLowerCase();
                    return (
                      <button
                        key={color.name}
                        onClick={() => setSelectedColor(color.name)}
                        className={`group relative p-1 rounded-full border-2 transition-all ${
                          isActive ? 'border-[#9D2706] scale-110' : 'border-transparent hover:border-[#0E0D0C]/30'
                        }`}
                        title={color.name}
                      >
                        <span 
                          className="block w-7 h-7 rounded-full shadow-inner border border-black/10" 
                          style={{ backgroundColor: color.hex }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector with System Switcher */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#0E0D0C]/80">
                    Select Size:
                  </label>
                  {/* Sizing Standard Switcher */}
                  <div className="inline-flex bg-[#FAF9F6] border border-[#E2DDD5] rounded p-0.5 text-[10px] font-bold">
                    {['UK', 'EU', 'US'].map((sys) => (
                      <button
                        key={sys}
                        type="button"
                        onClick={() => setSizeSystem(sys)}
                        className={`px-2 py-0.5 rounded-xs transition-all ${
                          sizeSystem === sys ? 'bg-[#0E0D0C] text-white shadow-xs' : 'text-[#7A736B] hover:text-[#0E0D0C]'
                        }`}
                      >
                        {sys}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button 
                    type="button" 
                    onClick={() => setShowFitProfiler(true)}
                    className="text-[#9D2706] hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Sparkles size={12} /> Find My Fit
                  </button>
                  <span className="text-[#0E0D0C]/20">|</span>
                  <button 
                    type="button" 
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[#7A736B] hover:text-[#0E0D0C] underline flex items-center gap-1 text-[11px]"
                  >
                    <Ruler size={12} /> Size Chart
                  </button>
                </div>
              </div>

              {/* Sizing Fit Advisory */}
              <div className="text-[10px] text-[#7A736B] mb-2.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>Standard F-Fitting · Hand-lasted to true British dress shoe sizing</span>
              </div>

              {/* Sizes Grid */}
              <div className="grid grid-cols-6 gap-2">
                {rawSizes.map((size) => {
                  const sizeStock = product.size_stock || {};
                  const stockCount = sizeStock[String(size)] !== undefined ? Number(sizeStock[String(size)]) : 10;
                  const isOutOfStock = stockCount === 0;
                  const isSelected = selectedSize === size;
                  const conv = SIZE_CONVERSIONS[String(size)];
                  const label = sizeSystem === 'EU' && conv ? `EU ${conv.eu}` : sizeSystem === 'US' && conv ? `US ${conv.us}` : `UK ${size}`;

                  return (
                    <button
                      key={size}
                      disabled={isOutOfStock}
                      onClick={() => setSelectedSize(size)}
                      className={`h-12 flex flex-col items-center justify-center text-xs font-semibold border transition-all relative rounded-sm ${
                        isOutOfStock
                          ? 'opacity-30 cursor-not-allowed bg-gray-100 border-gray-200 line-through text-gray-400'
                          : isSelected
                            ? 'bg-[#0E0D0C] text-white border-[#0E0D0C] shadow-sm'
                            : 'bg-white text-[#0E0D0C] border-[#0E0D0C]/20 hover:border-[#9D2706] hover:text-[#9D2706]'
                      }`}
                    >
                      <span>{label}</span>
                      {stockCount > 0 && stockCount <= 3 && !isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#9D2706]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Complimentary Exchange Guarantee Banner */}
              <div className="mt-3 bg-[#FAF9F6] p-3 border border-[#EAE5DC] flex items-center gap-3 rounded-sm">
                <RefreshCw size={15} className="text-[#9D2706] shrink-0" />
                <div className="text-[11px] leading-tight text-[#4A4540]">
                  <strong className="text-[#0E0D0C]">Risk-Free Doorstep Size Exchange:</strong> If your shoes do not fit with bespoke comfort, we exchange them complimentary within 15 days.
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div ref={mainBuyBtnRef} className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Main Add to Cart CTA */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-[#0E0D0C] text-white h-12 py-3.5 px-6 flex items-center justify-center gap-2.5 text-xs font-bold tracking-[0.18em] uppercase hover:bg-[#9D2706] transition-all shadow-md active:scale-[0.99] rounded-sm"
                >
                  <ShoppingBag size={16} />
                  <span>Add to Bag {selectedSize ? `· UK ${selectedSize}` : ''}</span>
                </button>

                {/* Direct Buy Now CTA */}
                <button
                  onClick={handleBuyNow}
                  className="flex-1 bg-[#9D2706] text-white h-12 py-3.5 px-6 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.18em] uppercase hover:bg-[#801F05] transition-all shadow-md active:scale-[0.99] rounded-sm"
                >
                  <span>Buy It Now</span>
                  <ArrowRight size={14} />
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={handleWishlistClick}
                  className={`h-12 w-12 p-3 border flex items-center justify-center transition-all rounded-sm ${
                    isWishlisted
                      ? 'bg-[#9D2706] text-white border-[#9D2706]'
                      : 'bg-white text-[#0E0D0C] border-[#0E0D0C]/20 hover:border-[#9D2706] hover:text-[#9D2706]'
                  }`}
                  title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
                >
                  <Heart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Bespoke Customizer Option */}
              {product.customized && (
                <Link
                  href={getCustomizeUrl()}
                  className="w-full h-11 bg-white border border-[#9D2706]/40 text-[#9D2706] hover:bg-[#9D2706] hover:text-white flex items-center justify-center gap-2 text-xs font-bold tracking-[0.18em] uppercase transition-all rounded-sm group"
                >
                  <Palette size={15} className="transition-transform group-hover:rotate-12" />
                  <span>Personalize in 3D Bespoke Atelier</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>

            {/* Streamlined Pincode Delivery Estimator */}
            <div className="pt-3 border-t border-[#0E0D0C]/10">
              <div className="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase tracking-wider text-[#0E0D0C]">
                <Truck size={14} className="text-[#9D2706]" />
                <span>Express Dispatch &amp; COD Verification</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, ''));
                    setPincodeStatus(null);
                  }}
                  placeholder="Enter 6-digit Pincode"
                  className="flex-1 px-3 py-2 text-xs border border-[#0E0D0C]/20 focus:border-[#9D2706] outline-none bg-white font-mono rounded-sm"
                />
                <button
                  type="button"
                  onClick={handlePincodeCheck}
                  className="bg-[#0E0D0C] text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 hover:bg-[#9D2706] transition-colors rounded-sm"
                >
                  Verify
                </button>
              </div>
              {pincodeStatus && (
                <p className={`mt-2 text-[11px] font-medium ${pincodeStatus.success ? 'text-emerald-700' : 'text-[#9D2706]'}`}>
                  {pincodeStatus.message}
                </p>
              )}
            </div>

            {/* Luxury Atelier Assurance Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#0E0D0C]/10 text-center">
              <div className="flex flex-col items-center p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-sm">
                <Shield size={18} className="text-[#9D2706] mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E0D0C]">Full-Grain Tuscan</span>
                <span className="text-[9px] text-[#7A736B]">100% Italian Crust Leather</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-sm">
                <Layers size={18} className="text-[#9D2706] mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E0D0C]">Goodyear Welt</span>
                <span className="text-[9px] text-[#7A736B]">Hand-Welted &amp; Resolable</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-sm">
                <RotateCcw size={18} className="text-[#9D2706] mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E0D0C]">15-Day Fit Trial</span>
                <span className="text-[9px] text-[#7A736B]">Complimentary Exchange</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-[#FAF9F6] border border-[#EAE5DC] rounded-sm">
                <Truck size={18} className="text-[#9D2706] mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E0D0C]">White-Glove</span>
                <span className="text-[9px] text-[#7A736B]">Insured Express Dispatch</span>
              </div>
            </div>

          </div>
        </div>

        {/* THE GENTLEMAN'S ENSEMBLE (FREQUENTLY BOUGHT TOGETHER) */}
        <section className="mt-14 pt-10 border-t border-[#0A0A0A]/10">
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9D2706] mb-1">Curated Atelier Ensemble</p>
            <h3 className="text-xl md:text-2xl font-serif font-normal uppercase tracking-wide text-[#0E0D0C]">
              Frequently Bought Together · Complete The Look
            </h3>
          </div>

          <div className="bg-[#FAF9F6] border border-[#E8E4DC] p-6 rounded-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Products Row */}
              <div className="lg:col-span-8 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                {/* Shoe */}
                <div className="flex items-center gap-3 bg-white p-2.5 border border-[#E8E4DD] rounded-sm shrink-0">
                  <input
                    type="checkbox"
                    checked={ensembleItems.shoe}
                    onChange={(e) => setEnsembleItems(prev => ({ ...prev, shoe: e.target.checked }))}
                    className="accent-[#9D2706] w-4 h-4 cursor-pointer"
                  />
                  <div className="w-16 h-16 bg-[#FAF9F6] p-1 shrink-0">
                    <img src={rawImages[0]} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="text-xs pr-2">
                    <p className="font-semibold text-[#0E0D0C] max-w-[140px] truncate">{product.name}</p>
                    <p className="text-[#9D2706] font-serif font-bold">₹{displayPrice.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <span className="text-lg font-light text-[#9CA3AF] hidden sm:inline">+</span>

                {/* Matching Cardholder */}
                <div className="flex items-center gap-3 bg-white p-2.5 border border-[#E8E4DD] rounded-sm shrink-0">
                  <input
                    type="checkbox"
                    checked={ensembleItems.cardholder}
                    onChange={(e) => setEnsembleItems(prev => ({ ...prev, cardholder: e.target.checked }))}
                    className="accent-[#9D2706] w-4 h-4 cursor-pointer"
                  />
                  <div className="w-16 h-16 bg-[#FAF9F6] p-1 shrink-0 flex items-center justify-center">
                    <Shield size={28} className="text-[#9D2706]/70" />
                  </div>
                  <div className="text-xs pr-2">
                    <p className="font-semibold text-[#0E0D0C] max-w-[140px] truncate">Tuscan Leather Cardholder</p>
                    <p className="text-[#9D2706] font-serif font-bold">₹1,000</p>
                  </div>
                </div>

                <span className="text-lg font-light text-[#9CA3AF] hidden sm:inline">+</span>

                {/* Matching Full-Grain Belt */}
                <div className="flex items-center gap-3 bg-white p-2.5 border border-[#E8E4DD] rounded-sm shrink-0">
                  <input
                    type="checkbox"
                    checked={ensembleItems.belt}
                    onChange={(e) => setEnsembleItems(prev => ({ ...prev, belt: e.target.checked }))}
                    className="accent-[#9D2706] w-4 h-4 cursor-pointer"
                  />
                  <div className="w-16 h-16 bg-[#FAF9F6] p-1 shrink-0 flex items-center justify-center">
                    <Award size={28} className="text-[#9D2706]/70" />
                  </div>
                  <div className="text-xs pr-2">
                    <p className="font-semibold text-[#0E0D0C] max-w-[140px] truncate">Matching Full-Grain Belt</p>
                    <p className="text-[#9D2706] font-serif font-bold">₹1,500</p>
                  </div>
                </div>
              </div>

              {/* Pricing & Add Bundle Button */}
              <div className="lg:col-span-4 lg:border-l lg:border-[#E0DAD0] lg:pl-6 flex flex-col items-start gap-1.5">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#7D766E]">Total for selected items</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-serif font-bold text-[#0E0D0C]">
                    ₹{(
                      (ensembleItems.shoe ? displayPrice : 0) +
                      (ensembleItems.cardholder ? 1000 : 0) +
                      (ensembleItems.belt ? 1500 : 0)
                    ).toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-semibold text-[#9D2706] bg-[#9D2706]/8 px-2 py-0.5 rounded-sm">Save ₹500 Bundle</span>
                </div>
                <button
                  onClick={handleAddEnsembleToCart}
                  className="w-full mt-2 bg-[#0E0D0C] text-white py-3 px-4 text-xs font-bold tracking-[0.16em] uppercase hover:bg-[#9D2706] transition-colors rounded-sm"
                >
                  Add Selected to Bag
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FULL-WIDTH WOODLAND-STYLE TABBED SECTION */}
        <section className="mt-16 md:mt-24 pt-10 border-t border-[#0A0A0A]/10">
          {/* Tab Navigation */}
          <div className="flex border-b border-[#0A0A0A]/10 overflow-x-auto scrollbar-none gap-2">
            {[
              { id: 'specifications', label: 'Atelier Specifications' },
              { id: 'care', label: 'Leather & Shoe Care' },
              { id: 'shipping', label: 'Shipping & Remake Policy' },
              { id: 'faqs', label: 'Craftsmanship FAQs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-6 text-xs md:text-sm font-bold tracking-[0.18em] uppercase border-b-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-[#9D2706] text-[#9D2706] bg-[#9D2706]/5'
                    : 'border-transparent text-[#0A0A0A]/50 hover:text-[#0A0A0A] hover:border-[#0A0A0A]/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Panels */}
          <div className="py-8 animate-fadeIn">
            {/* 1. Specifications Tab */}
            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(specifications).map(([key, value]) => (
                  <div key={key} className="p-4 bg-[#FAF9F6] border border-[#0A0A0A]/5 rounded-sm">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#9D2706] block mb-1">
                      {key}
                    </span>
                    <span className="text-xs md:text-sm font-semibold text-[#0A0A0A]">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Leather Care Tab */}
            {activeTab === 'care' && (
              <div className="max-w-3xl space-y-4 text-xs md:text-sm text-[#0A0A0A]/80 leading-relaxed font-light">
                <h3 className="text-base font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Artisanal Preservation Guide
                </h3>
                <p>
                  Each pair of CobCult shoes is handcrafted from full-grain leather that absorbs oils and builds character over time. Follow these steps to ensure your shoes endure for decades:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-[#FAF9F6] border-l-2 border-[#9D2706]">
                    <strong className="block text-xs uppercase font-bold text-[#0A0A0A] mb-1">1. Cedar Shoe Trees</strong>
                    <p className="text-xs text-[#0A0A0A]/65">Always insert natural cedar shoe trees immediately after wear to absorb moisture and preserve the last curvature.</p>
                  </div>
                  <div className="p-4 bg-[#FAF9F6] border-l-2 border-[#9D2706]">
                    <strong className="block text-xs uppercase font-bold text-[#0A0A0A] mb-1">2. Conditioning Ritual</strong>
                    <p className="text-xs text-[#0A0A0A]/65">Apply organic beeswax or natural leather balm every 6 to 8 weeks to replenish natural hide oils.</p>
                  </div>
                  <div className="p-4 bg-[#FAF9F6] border-l-2 border-[#9D2706]">
                    <strong className="block text-xs uppercase font-bold text-[#0A0A0A] mb-1">3. Moisture Protection</strong>
                    <p className="text-xs text-[#0A0A0A]/65">If caught in rain, let them dry naturally away from artificial heaters or direct sunlight.</p>
                  </div>
                  <div className="p-4 bg-[#FAF9F6] border-l-2 border-[#9D2706]">
                    <strong className="block text-xs uppercase font-bold text-[#0A0A0A] mb-1">4. Resoling Service</strong>
                    <p className="text-xs text-[#0A0A0A]/65">Because our soles are stitched with Goodyear welts, outsoles can be replaced multiple times without affecting the upper.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Shipping & Remake Policy */}
            {activeTab === 'shipping' && (
              <div className="max-w-3xl space-y-4 text-xs md:text-sm text-[#0A0A0A]/80 leading-relaxed font-light">
                <h3 className="text-base font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Fulfillment, Express Dispatch & Fit Guarantee
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-[#9D2706] shrink-0 mt-0.5" />
                    <span><strong>Pan-India Complimentary Shipping:</strong> Free express doorstep shipping across all pin codes in India.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-[#9D2706] shrink-0 mt-0.5" />
                    <span><strong>Dispatch Timeline:</strong> Ready-to-wear models dispatch in 24 to 48 hours; custom bespoke commissions take 12 to 18 artisanal bench-work days.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-[#9D2706] shrink-0 mt-0.5" />
                    <span><strong>15-Day Hassle-Free Size Exchange:</strong> Complimentary reverse pickup and replacement if the size requires adjustment.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-[#9D2706] shrink-0 mt-0.5" />
                    <span><strong>Bespoke Fit Promise:</strong> If a custom shoe does not meet your specifications, our master cobbler will remake it at zero added cost.</span>
                  </li>
                </ul>
              </div>
            )}

            {/* 4. FAQs Tab */}
            {activeTab === 'faqs' && (
              <div className="max-w-3xl space-y-4">
                <div className="border-b border-[#0A0A0A]/10 pb-4">
                  <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">
                    What makes Goodyear welted construction superior?
                  </h4>
                  <p className="text-xs text-[#0A0A0A]/70 leading-relaxed font-light">
                    Unlike glued or cemented shoes that discard when worn down, Goodyear welting stitches the upper, insole, and outsole together through a leather welt. This creates a waterproof barrier, cork-cushioned foot molding, and allows infinite resoling for decades.
                  </p>
                </div>
                <div className="border-b border-[#0A0A0A]/10 pb-4">
                  <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">
                    How do I choose between standard and wide width?
                  </h4>
                  <p className="text-xs text-[#0A0A0A]/70 leading-relaxed font-light">
                    Our shoes use standard British D/E lasts. If you possess a broader instep, use our "Find My Fit" tool or contact our concierge to have your pair crafted on wide lasts.
                  </p>
                </div>
                <div className="border-b border-[#0A0A0A]/10 pb-4">
                  <h4 className="text-xs md:text-sm font-bold uppercase tracking-wider text-[#0A0A0A] mb-1.5">
                    Can I personalize the leather patina or add my initials?
                  </h4>
                  <p className="text-xs text-[#0A0A0A]/70 leading-relaxed font-light">
                    Yes! Click "Personalize in Bespoke Atelier" above to select hand-painted museum calf patinas, custom Goodyear soles, brass hardware, and embossed personal monograms.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Similar Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-[#0A0A0A]/10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9D2706]">Curated Recommendations</p>
                <h2 className="text-xl md:text-2xl font-bold uppercase tracking-wide text-[#0A0A0A]">Complementary Atelier Styles</h2>
              </div>
              <Link href={collectionPath} className="text-xs font-bold uppercase tracking-widest text-[#9D2706] hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((item) => (
                <Link href={`/products/${item.id}`} key={item.id} className="group bg-[#FAF9F6] border border-[#0A0A0A]/5 p-4 rounded-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-[#9D2706]/40">
                  <div className="aspect-square relative overflow-hidden mb-3">
                    <img 
                      src={(item.images || [])[0] || item.image} 
                      alt={item.name} 
                      className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-105" 
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold tracking-widest uppercase text-[#9D2706] block mb-1">
                      {item.badge || item.category || 'Atelier'}
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-[#0A0A0A] group-hover:text-[#9D2706] transition-colors truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs font-bold text-[#0A0A0A]/80 mt-1">₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Customer Reviews Section */}
        <section className="mt-16 pt-10 border-t border-[#0A0A0A]/10">
          <ProductReviews productId={product.id} />
        </section>
      </main>

      {/* STICKY BOTTOM PURCHASE BAR ON SCROLL */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#0A0A0A]/10 py-3 px-4 md:px-8 shadow-2xl animate-fadeIn">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#FAF9F6] rounded border border-black/5 p-1 shrink-0 hidden sm:block">
                <img src={rawImages[0]} alt="" className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <div className="truncate">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] truncate">{product.name}</h4>
                <p className="text-sm font-black text-[#9D2706]">₹{displayPrice.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1">
                {rawSizes.slice(0, 5).map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-8 h-8 text-[11px] font-bold border transition-all ${
                      selectedSize === s ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]' : 'bg-white text-[#0A0A0A] border-[#0A0A0A]/20'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                onClick={handleAddToCart}
                className="bg-[#0A0A0A] text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest hover:bg-[#9D2706] transition-colors shrink-0 flex items-center gap-2"
              >
                <ShoppingBag size={14} />
                <span className="hidden sm:inline">Add to Bag</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sizing Fit Profiler Modal */}
      {showFitProfiler && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border-t-4 border-[#9D2706] shadow-2xl relative animate-fadeIn">
            <button 
              onClick={() => { setShowFitProfiler(false); setFitResult(null); }}
              className="absolute top-4 right-4 text-[#0A0A0A]/40 hover:text-[#0A0A0A]"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-2 text-[#9D2706] mb-1">
              <Ruler size={18} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Atelier Sizing Concierge</span>
            </div>
            <h3 className="text-lg font-bold uppercase tracking-wide text-[#0A0A0A] mb-1">Calculate Your Perfect Fit</h3>
            <p className="text-xs text-[#0A0A0A]/60 mb-6 font-light">Map your existing sneaker or dress shoe size to our handcrafted British lasts.</p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[#0A0A0A]/70 mb-1.5">Brand You Wear Most Often</label>
                <select 
                  value={fitBrand} 
                  onChange={(e) => { setFitBrand(e.target.value); setFitResult(null); }} 
                  className="w-full p-2.5 border border-[#0A0A0A]/20 bg-white font-medium outline-none"
                >
                  <option value="Nike">Nike (Running / Sneakers)</option>
                  <option value="Adidas">Adidas (Athletic)</option>
                  <option value="Clarks">Clarks (Heritage Dress)</option>
                  <option value="Woodland">Woodland (Boots)</option>
                  <option value="Zara">Zara (Dress Shoes)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[#0A0A0A]/70 mb-1.5">Your Usual Size (UK)</label>
                  <select 
                    value={fitSize} 
                    onChange={(e) => { setFitSize(e.target.value); setFitResult(null); }} 
                    className="w-full p-2.5 border border-[#0A0A0A]/20 bg-white font-medium outline-none"
                  >
                    {['6', '7', '8', '9', '10', '11', '12'].map(s => <option key={s} value={s}>UK {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[#0A0A0A]/70 mb-1.5">Foot Width Profile</label>
                  <select 
                    value={fitWidth} 
                    onChange={(e) => { setFitWidth(e.target.value); setFitResult(null); }} 
                    className="w-full p-2.5 border border-[#0A0A0A]/20 bg-white font-medium outline-none"
                  >
                    <option value="Standard">Standard (Medium)</option>
                    <option value="Wide">Wide Instep</option>
                    <option value="Narrow">Narrow Instep</option>
                  </select>
                </div>
              </div>

              {!fitResult ? (
                <button
                  type="button"
                  onClick={calculateRecommendedSize}
                  className="w-full py-3 bg-[#0A0A0A] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#9D2706] transition-colors mt-2"
                >
                  Compute Bespoke Recommendation
                </button>
              ) : (
                <div className="p-4 bg-[#FAF9F6] border border-[#9D2706]/30 text-center animate-fadeIn mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#9D2706] mb-1">Our Recommendation</p>
                  <p className="text-xl font-black text-[#0A0A0A]">UK {Math.floor(fitResult)}</p>
                  <p className="text-[11px] text-[#0A0A0A]/60 mt-1">
                    Goodyear welted dress lasts run true to size, slightly roomier than athletic sneakers.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSize(String(Math.floor(fitResult)));
                      setShowFitProfiler(false);
                    }}
                    className="mt-3 px-4 py-2 bg-[#9D2706] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#7a1e04]"
                  >
                    Select UK {Math.floor(fitResult)} & Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Size Guide Drawer */}
      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} gender={gender} />

      {/* Cart Interstitial Modal */}
      {cartInterstitial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full p-6 text-center border-t-4 border-[#9D2706] shadow-2xl animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <Check size={24} />
            </div>
            <h3 className="text-base font-bold uppercase tracking-wider text-[#0A0A0A] mb-1">Added to Shopping Bag</h3>
            <p className="text-xs text-[#0A0A0A]/60 mb-4">{product.name} (UK {selectedSize})</p>
            <div className="space-y-2">
              <Link 
                href="/cart" 
                className="w-full py-3 bg-[#0A0A0A] text-white block text-xs font-bold uppercase tracking-widest hover:bg-[#9D2706] transition-colors"
              >
                Proceed to Checkout
              </Link>
              <button 
                onClick={() => setCartInterstitial(false)}
                className="w-full py-2.5 border border-[#0A0A0A]/20 text-xs font-bold uppercase tracking-wider text-[#0A0A0A] hover:bg-gray-50"
              >
                Continue Exploring
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPDP;
