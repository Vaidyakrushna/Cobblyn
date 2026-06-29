"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown, ChevronUp, ArrowRight, Check, Sparkles, Save, Lock, Camera, Layers, Info, Heart, Share2, HelpCircle, Ruler, Star, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

/* ─── DATA ────────────────────────────────────────────────── */

const models = {
  men: [
    { name: 'Oxford',     desc: 'Classic closed-lacing elegance',  img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&q=80&fit=crop' },
    { name: 'Derby',      desc: 'Open-lacing versatility',          img: 'https://images.unsplash.com/photo-1616696038562-574c18066055?w=500&q=80&fit=crop' },
    { name: 'Loafer',     desc: 'Slip-on sophistication',           img: 'https://images.pexels.com/photos/29258015/pexels-photo-29258015.jpeg?auto=compress&cs=tinysrgb&w=500' },
    { name: 'Monk Strap', desc: 'Bold buckle statement',            img: 'https://images.unsplash.com/photo-1770198408387-7f45e5d6c056?w=500&q=80&fit=crop' },
    { name: 'Desert Boot/Chukka Boots', desc: 'Chukka & desert silhouette', img: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=500&q=80&fit=crop' },
    { name: 'Wing Tip',   desc: 'Decorative brogue detail',        img: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&q=80&fit=crop' },
    { name: 'Mule',       desc: 'Backless slip-on ease',           img: 'https://images.unsplash.com/photo-1603191659812-ee978eeeef76?w=500&q=80&fit=crop' },
    { name: 'Jutis',      desc: 'Traditional Indian craft',         img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80&fit=crop' },
    { name: 'Mojaris',    desc: 'Heritage pointed slip-on',        img: 'https://images.unsplash.com/photo-1610398061401-86320597d020?w=500&q=80&fit=crop' },
    { name: 'Boat',       desc: 'Maritime deck shoe',              img: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=500&q=80&fit=crop' }
  ],
  women: [
    { name: 'Ballerina',  desc: 'Graceful flat elegance',           img: 'https://images.unsplash.com/photo-1774802536876-88b0e1ca7453?w=500&q=80&fit=crop' },
    { name: 'Boots',      desc: 'Sculpted ankle silhouette',        img: 'https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=500&q=80&fit=crop' },
    { name: 'Loafers',    desc: 'Polished everyday ease',           img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=500&q=80&fit=crop' },
    { name: 'Jutis',      desc: 'Festive embroidered beauty',       img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&q=80&fit=crop' },
    { name: 'Peep Toes',  desc: 'Glamorous open-toe heels',         img: 'https://images.unsplash.com/photo-1720604083961-88336789791e?w=500&q=80&fit=crop' },
  ],
};

/*
 * Submodels keyed by model name.
 * Each submodel has: name, desc, tag (optional badge), img
 * Images are Unsplash/Pexels that best represent that silhouette.
 */
const submodels = {
  // ── MEN ──────────────────────────────────────────────────────
  Oxford: [
    {
      name: 'Plain Toe Oxford',
      desc: 'Clean, unadorned vamp — the purest expression of the Oxford. Ideal for black-tie and boardrooms.',
      tag: 'Most Classic',
      img: '/3d_oxford_plain_toe.png',
    },
    {
      name: 'Cap Toe Oxford',
      desc: 'A horizontal seam across the toe cap adds quiet structure and a military-inspired finish.',
      tag: 'Bestseller',
      img: '/3d_oxford_cap_toe.png',
    },
    {
      name: 'Wingtip Oxford',
      desc: 'W-shaped broguing flows over the toe — bold character meets formal tradition.',
      tag: 'Most Distinctive',
      img: '/3d_oxford_wingtip.png',
    },
    {
      name: 'Wholecut Oxford',
      desc: 'Crafted from a single piece of leather. The rarest Oxford silhouette — zero seams, absolute refinement.',
      tag: 'Most Luxurious',
      img: '/3d_oxford_wholecut.png',
    },
    {
      name: 'Semi-Brogue Oxford',
      desc: 'Subtle toe-cap broguing adds texture without overpowering the formal silhouette.',
      tag: '',
      img: '/3d_oxford_semi_brogue.png',
    },
    {
      name: 'Full-Brogue Oxford',
      desc: 'Perforations and medallions across the entire shoe — the richest brogued expression.',
      tag: 'Most Textured',
      img: '/3d_oxford_full_brogue.png',
    },
  ],

  Derby: [
    {
      name: 'Plain Toe Blucher',
      desc: 'The open-lacing derby stripped to essentials. Versatile from smart-casual to business.',
      tag: 'Most Versatile',
      img: '/3d_derby_plain_toe.png',
    },
    {
      name: 'Cap Toe Derby',
      desc: 'A stitched toe cap elevates the relaxed derby lacing into polished territory.',
      tag: 'Bestseller',
      img: '/3d_derby_cap_toe.png',
    },
    {
      name: 'Longwing Derby',
      desc: 'The W-shaped broguing extends all the way to the heel — a true American classic.',
      tag: 'Most American',
      img: '/3d_derby_longwing.png',
    },
    {
      name: 'Wingtip Derby',
      desc: 'Full brogue detailing on open-laced construction — casual elegance personified.',
      tag: '',
      img: '/3d_derby_wingtip.png',
    },
    {
      name: 'Norwegian Derby',
      desc: 'Rugged storm welt with split-toe or moc-toe stitching. Built for the elements.',
      tag: 'Most Rugged',
      img: '/3d_derby_norwegian.png',
    },
  ],

  Loafer: [
    {
      name: 'Penny Loafer',
      desc: 'The definitive loafer — a saddle strap across the vamp with the iconic penny slot.',
      tag: 'Most Classic',
      img: '/3d_loafer_penny.png',
    },
    {
      name: 'Horsebit Loafer',
      desc: 'Gold-tone horsebit hardware on the instep — the quintessential Italian loafer.',
      tag: 'Most Iconic',
      img: '/3d_loafer_horsebit.png',
    },
    {
      name: 'Tassel Loafer',
      desc: 'Leather tassels swing with every step. Ivy League heritage, forever in style.',
      tag: 'Bestseller',
      img: '/3d_loafer_tassel.png',
    },
    {
      name: 'Driving Loafer',
      desc: 'Rubber pebble sole wraps up the heel. Designed for the driver, loved by all.',
      tag: 'Most Casual',
      img: '/3d_loafer_driving.png',
    },
    {
      name: 'String Loafer',
      desc: 'Woven leather string bow on the vamp — relaxed, summery, and effortlessly chic.',
      tag: 'Most Relaxed',
      img: '/3d_loafer_string.png',
    },
    {
      name: 'Dress Slipper',
      desc: 'Flat-soled evening slipper with velvet or patent. A formal loafer for black-tie.',
      tag: 'Most Formal',
      img: '/3d_loafer_slipper.png',
    },
  ],

  'Monk Strap': [
    {
      name: 'Single Monk',
      desc: 'One buckle, one strap — powerful restraint. The boldest dress shoe in any wardrobe.',
      tag: 'Most Popular',
      img: '/3d_monk_single.png',
    },
    {
      name: 'Double Monk',
      desc: 'Two straps, two buckles — maximum visual impact. A true statement in formal wear.',
      tag: 'Most Distinctive',
      img: '/3d_monk_double.png',
    },
    {
      name: 'Brogue Monk',
      desc: 'Perforated detailing on the monk strap silhouette — smart-casual at its finest.',
      tag: '',
      img: '/3d_monk_brogue.png',
    },
  ],

  Boots: [
    {
      name: 'Chelsea Boot',
      desc: 'Elastic side gussets, no laces. The most versatile boot — office to evening.',
      tag: 'Bestseller',
      img: '/3d_boot_chelsea.png',
    },
    {
      name: 'Chukka Boot',
      desc: 'Open-laced two or three-eyelet ankle boot. Casual refinement at its best.',
      tag: 'Most Casual',
      img: '/3d_boot_chukka.png',
    },
    {
      name: 'Jodhpur Boot',
      desc: 'Ankle strap with buckle — equestrian heritage translated into everyday elegance.',
      tag: 'Most Heritage',
      img: '/3d_boot_jodhpur.png',
    },
    {
      name: 'Cap Toe Boot',
      desc: 'Formal boot with a stitched toe cap — dress shoe construction at ankle height.',
      tag: 'Most Formal',
      img: '/3d_boot_cap_toe.png',
    },
    {
      name: 'Wingtip Boot',
      desc: 'Full broguing on a boot silhouette — the most expressive boot in the collection.',
      tag: 'Most Distinctive',
      img: '/3d_boot_wingtip.png',
    },
    {
      name: 'Balmoral Boot',
      desc: 'Closed lacing with seamed vamp — the most formal boot, built like an Oxford.',
      tag: 'Most Refined',
      img: '/3d_boot_balmoral.png',
    },
    {
      name: 'Zipper Boot',
      desc: 'Side-zip closure for effortless wear without sacrificing polish.',
      tag: '',
      img: '/3d_boot_zipper.png',
    },
  ],

  Jutis: [
    {
      name: 'Classic Juti',
      desc: 'Traditional pointed-toe juti with hand embroidery — a timeless ceremonial staple.',
      tag: 'Most Traditional',
      img: '/3d_juti_classic.png',
    },
    {
      name: 'Nagra',
      desc: 'Rounded toe with curled tip — Rajasthani heritage in every stitch.',
      tag: 'Regional Heritage',
      img: '/3d_juti_nagra.png',
    },
    {
      name: 'Kolhapuri Juti',
      desc: 'Open-weave leather with floral embossing — Maharashtra craftsmanship at its finest.',
      tag: '',
      img: '/3d_juti_kolhapuri.png',
    },
    {
      name: 'Mojari',
      desc: 'Fully embroidered upper with mirror-work — festive, opulent, and entirely handcrafted.',
      tag: 'Most Festive',
      img: '/3d_juti_mojari.png',
    },
  ],

  // ── WOMEN ──────────────────────────────────────────────────────
  Ballerina: [
    {
      name: 'Classic Flat',
      desc: 'The essential ballet flat — soft round toe, comfortable last, endlessly versatile.',
      tag: 'Bestseller',
      img: '/3d_women_flat_classic.png',
    },
    {
      name: 'D\'Orsay Flat',
      desc: 'Open sides reveal the arch — a feminine silhouette for events and evenings.',
      tag: 'Most Elegant',
      img: '/3d_women_flat_dorsay.png',
    },
    {
      name: 'Pointed Toe Flat',
      desc: 'A sharp elongated toe gives the classic flat a fashion-forward edge.',
      tag: 'Most Modern',
      img: '/3d_women_flat_pointed.png',
    },
    {
      name: 'Bow Ballet',
      desc: 'A satin or leather bow at the vamp — playful luxury for dressy occasions.',
      tag: '',
      img: '/3d_women_flat_bow.png',
    },
  ],

  WomenBoots: [
    {
      name: 'Ankle Boot',
      desc: 'A clean ankle silhouette that pairs with everything. The most versatile boot.',
      tag: 'Bestseller',
      img: '/3d_women_boot_ankle.png',
    },
    {
      name: 'Chelsea Ankle Boot',
      desc: 'Elastic side panels for slip-on ease — polished without the fuss.',
      tag: 'Most Comfortable',
      img: '/3d_women_boot_chelsea.png',
    },
    {
      name: 'Block Heel Boot',
      desc: 'Sturdy block heel for all-day support without sacrificing height or style.',
      tag: 'Most Practical',
      img: '/3d_women_boot_block.png',
    },
    {
      name: 'Kitten Heel Boot',
      desc: 'A slender 4–5 cm heel — understated, feminine, and office-appropriate.',
      tag: 'Most Refined',
      img: '/3d_women_boot_kitten.png',
    },
  ],

  Loafers: [
    {
      name: 'Penny Loafer',
      desc: 'The classic saddle-strap loafer in women\'s sizing — timeless from campus to boardroom.',
      tag: 'Most Classic',
      img: '/3d_women_loafer_penny.png',
    },
    {
      name: 'Platform Loafer',
      desc: 'Chunky platform sole adds height with maximum comfort. A bold fashion statement.',
      tag: 'Most Trendy',
      img: '/3d_women_loafer_platform.png',
    },
    {
      name: 'Horsebit Loafer',
      desc: 'Gold-tone hardware on a women\'s silhouette — Italian luxury redefined.',
      tag: 'Bestseller',
      img: '/3d_women_loafer_horsebit.png',
    },
    {
      name: 'Tassel Loafer',
      desc: 'Playful leather tassels with a feminine last — smart-casual in the most chic sense.',
      tag: '',
      img: '/3d_women_loafer_tassel.png',
    },
  ],

  'Peep Toes': [
    {
      name: 'Kitten Heel Peep Toe',
      desc: 'Delicate 4–5 cm heel with an open toe — a refined choice for formal occasions.',
      tag: 'Most Elegant',
      img: '/3d_women_peep_kitten.png',
    },
    {
      name: 'Block Heel Peep Toe',
      desc: 'Peep-toe styling on a stable block heel — glamorous yet walkable.',
      tag: 'Bestseller',
      img: '/3d_women_peep_block.png',
    },
    {
      name: 'Slingback Peep Toe',
      desc: 'An adjustable heel strap keeps the shoe secure while the open toe adds airiness.',
      tag: 'Most Comfortable',
      img: '/3d_women_peep_slingback.png',
    },
  ],

  'Desert Boot/Chukka Boots': [
    {
      name: 'Suede Desert Boot',
      desc: 'Classic crepe sole with soft suede upper — casual, comfortable heritage.',
      tag: 'Most Classic',
      img: '/3d_desert_boot.png',
    },
    {
      name: 'Leather Chukka',
      desc: 'Premium leather finish with a smart thin dress sole for smart-casual events.',
      tag: 'Dress Casual',
      img: '/3d_leather_chukka.png',
    },
  ],

  'Wing Tip': [
    {
      name: 'Brogue Wingtip',
      desc: 'Full wingtip broguing with decorative toe medallion — high personality.',
      tag: 'Bestseller',
      img: '/3d_wingtip_brogue.png',
    },
    {
      name: 'Longwing Brogue',
      desc: 'Classic American styling where the wingtip seam extends fully to the heel.',
      tag: 'Heritage',
      img: '/3d_wingtip_longwing.png',
    },
  ],

  'Mule': [
    {
      name: 'Leather Mule Slipper',
      desc: 'Backless slip-on leather slide with low stacked heel — effortless luxury.',
      tag: 'New Arrival',
      img: '/3d_mule_slipper.png',
    },
    {
      name: 'Suede Venetian Mule',
      desc: 'Ultra-soft backless venetian suede slide for high comfort.',
      tag: 'Casual Luxury',
      img: '/3d_mule_venetian.png',
    },
  ],

  'Mojaris': [
    {
      name: 'Pointed Sherwani Mojari',
      desc: 'Traditional pointed mojari with curled front tip for weddings and ceremonies.',
      tag: 'Ceremonial',
      img: '/3d_mojari_sherwani.png',
    },
    {
      name: 'Velvet Embroidered Mojari',
      desc: 'Rich velvet upper with detailed zardozi hand embroidery.',
      tag: 'Royal Collection',
      img: '/3d_mojari_velvet.png',
    },
  ],

  'Boat': [
    {
      name: 'Classic Boat Shoe',
      desc: 'Premium oiled leather with white siped rubber soles and 360-degree lacing.',
      tag: 'Nautical Classic',
      img: '/3d_boat_classic.png',
    },
    {
      name: 'Suede Deck Shoe',
      desc: 'Soft suede slip-on deck shoe for warm weather and sailing excursions.',
      tag: 'Summer Casual',
      img: '/3d_boat_suede.png',
    },
  ],
};

/* ─── LEATHER / COLOR / SOLE data (unchanged) ──────────────── */

const leathers = [
  { name: 'Full-Grain Italian', desc: 'Finest quality, natural grain visible',    swatch: '#3E2723' },
  { name: 'Nappa Leather',      desc: 'Soft and supple, buttery finish',           swatch: '#1A1A1A' },
  { name: 'Suede',              desc: 'Velvety napped finish',                     swatch: '#8B7355' },
  { name: 'Patent Leather',     desc: 'High-gloss mirror finish',                 swatch: '#0A0A0A' },
  { name: 'Cordovan',           desc: 'Shell cordovan, ultra-premium',             swatch: '#800020' },
  { name: 'Embroidered Silk',   desc: 'Traditional handwoven silk',               swatch: '#C9A84C' },
];

const colors = [
  { name: 'Black',      hex: '#0A0A0A' }, { name: 'Dark Brown', hex: '#3E2723' },
  { name: 'Tan',        hex: '#D2B48C' }, { name: 'Burgundy',   hex: '#800020' },
  { name: 'Navy',       hex: '#1A1A40' }, { name: 'Olive',      hex: '#556B2F' },
  { name: 'Cognac',     hex: '#9A4E1C' }, { name: 'Oxblood',    hex: '#4A0000' },
];

const soles = [
  { name: 'Leather Sole', desc: 'Traditional elegance, dress occasions' },
  { name: 'Rubber Sole',  desc: 'Durable grip, all-weather' },
  { name: 'Dainite Sole', desc: 'Studded rubber, smart-casual' },
  { name: 'Crepe Sole',   desc: 'Natural comfort, casual wear' },
];

/* ─── 2D SILHOUETTE IMAGE MAPPER ────────────────────────── */
const get2DShoeImage = (model, submodel) => {
  if (!model) return '/shoe-oxford.png';
  const modelNorm = model.toLowerCase();
  const subNorm = (submodel || '').toLowerCase();

  if (modelNorm.includes('oxford')) {
    if (subNorm.includes('captoe') || subNorm.includes('cap-toe')) return '/shoe-oxford-captoe.png';
    if (subNorm.includes('wingtip')) return '/shoe-oxford-wingtip.png';
    if (subNorm.includes('wholecut')) return '/shoe-oxford-wholecut.png';
    return '/shoe-oxford.png';
  }
  if (modelNorm.includes('derby')) {
    if (subNorm.includes('captoe') || subNorm.includes('cap-toe')) return '/shoe-derby-captoe.png';
    if (subNorm.includes('wingtip')) return '/shoe-derby-wingtip.png';
    return '/shoe-derby.png';
  }
  if (modelNorm.includes('loafer')) {
    if (subNorm.includes('penny')) return '/shoe-loafer-penny.png';
    if (subNorm.includes('tassel')) return '/shoe-loafer-tassel.png';
    if (subNorm.includes('horsebit')) return '/shoe-loafer-horsebit.png';
    return '/shoe-loafer.png';
  }
  if (modelNorm.includes('monk')) {
    if (subNorm.includes('single')) return '/shoe-monk-single.png';
    return '/shoe-monkstrap.png';
  }
  if (modelNorm.includes('boot') || modelNorm.includes('chukka') || modelNorm.includes('desert')) {
    if (subNorm.includes('chelsea')) return '/shoe-boot-chelsea.png';
    if (subNorm.includes('chukka') || subNorm.includes('desert')) return '/shoe-boot-chukka.png';
    return '/shoe-boot.png';
  }
  if (modelNorm.includes('juti') || modelNorm.includes('nagra') || modelNorm.includes('mojari')) {
    return '/shoe-juti.png';
  }
  if (modelNorm.includes('flat') || modelNorm.includes('ballerina')) {
    if (subNorm.includes('pointed')) return '/shoe-flat-pointed.png';
    return '/shoe-flat.png';
  }
  if (modelNorm.includes('peep') || modelNorm.includes('heel')) {
    return '/shoe-heel.png';
  }
  if (modelNorm.includes('wing')) {
    return '/shoe-oxford-wingtip.png';
  }
  if (modelNorm.includes('mule') || modelNorm.includes('boat')) {
    return '/shoe-loafer.png';
  }
  return '/shoe-oxford.png';
};
/* ─── STEP LABELS ─────────────────────────────────────────── */
const steps = ['Gender', 'Model', 'Submodel', 'Leather', 'Color', 'Sole', 'Size', 'Summary'];

/* ─── COMPONENT ──────────────────────────────────────────── */
const CustomizePage = () => {
  const router = useRouter();
  const { user, isAuthenticated, login, register } = useAuth();
  
  // Customizer dynamic swatches and CDN textures states
  const [activeLeathers, setActiveLeathers] = useState(leathers);
  const [activeColors, setActiveColors] = useState(colors);
  const [activeSoles, setActiveSoles] = useState(soles);
  const [activeModels, setActiveModels] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('byond_customizer_catalog');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load catalog:', e);
      }
    }
    return models;
  });
  const [activeSubmodels, setActiveSubmodels] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('byond_customizer_submodels');
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load submodels:', e);
      }
    }
    return submodels;
  });
  
  // Fetch real database products & materials for inventory & mapping check
  const [dbProducts, setDbProducts] = useState([]);
  const [dbMaterials, setDbMaterials] = useState([]);

  useEffect(() => {
    const fetchDbData = async () => {
      try {
        const prodData = await api.getProducts({ limit: 100 });
        setDbProducts(prodData.products || []);
        
        const matData = await api.getMaterials();
        setDbMaterials(matData.materials || []);
      } catch (err) {
        console.error('Error fetching dynamic DB customizer data:', err);
      }
    };
    fetchDbData();

    // Sync catalog and submodels from localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedSub = localStorage.getItem('byond_customizer_submodels');
        if (savedSub) {
          setActiveSubmodels(JSON.parse(savedSub));
        }
        const savedCat = localStorage.getItem('byond_customizer_catalog');
        if (savedCat) {
          setActiveModels(JSON.parse(savedCat));
        }
      } catch (e) {
        console.error('Failed to parse catalog/submodels from localStorage:', e);
      }
    }
  }, []);

  const getFilteredLeathers = () => {
    return activeLeathers.filter(l => {
      // Dynamic assets are verified by available
      if (l.price_modifier !== undefined && l.desc?.includes('Dynamic')) return true;
      // Hardcoded check against backend inventory
      if (dbMaterials.length === 0) return true; // fallback
      const matched = dbMaterials.find(m => m.name.toLowerCase() === l.name.toLowerCase());
      return matched ? matched.available : true;
    });
  };

  const getFilteredSoles = () => {
    return activeSoles.filter(s => {
      if (s.price_modifier !== undefined && s.desc?.includes('Dynamic')) return true;
      if (dbMaterials.length === 0) return true; // fallback
      const matched = dbMaterials.find(m => m.name.toLowerCase() === s.name.toLowerCase());
      return matched ? matched.available : true;
    });
  };
  
  const [step, setStep]     = useState(0);
  const [config, setConfig] = useState({ gender: '', model: '', submodel: '', leather: '', color: '', sole: '', size: '8', monogram: '' });
  const [instagramModal, setInstagramModal] = useState(false);
  
  // Bespoke customizer visual states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Feature B: Sizing Fit Profiler States
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
  
  // Trigger micro-fade transition on configurator config alterations (Stage 1)
  const [isTransitioning, setIsTransitioning] = useState(false);
  useEffect(() => {
    if (step >= 3) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 220);
      return () => clearTimeout(timer);
    }
  }, [config.leather, config.color, config.sole, config.submodel]);

  // Feature C: Live Pricing Simulator State
  const [priceBreakdown, setPriceBreakdown] = useState({
    base_price: 8500,
    final_price: 8500,
    applied_rules: []
  });

  useEffect(() => {
    const calculateCustomizerPrice = async () => {
      try {
        const res = await api.request('/rules/calculate-price', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base_price: 8500,
            attributes: {
              material: config.leather || '',
              sole_type: config.sole || '',
              style: config.submodel || '',
              construction: 'Goodyear Welt'
            }
          })
        });
        if (res) {
          setPriceBreakdown(res);
        }
      } catch (err) {
        console.error('Error calculating dynamic price:', err);
      }
    };
    if (config.leather || config.sole) {
      calculateCustomizerPrice();
    }
  }, [config.leather, config.sole, config.submodel]);

  const getProductMappingId = () => {
    const style = (config.model || '').toLowerCase();
    const sub = (config.submodel || '').toLowerCase();
    
    // Find a database product that matches the style or submodel name
    const matched = dbProducts.find(p => 
      p.name.toLowerCase().includes(sub) || 
      p.style.toLowerCase().includes(style)
    );
    
    return matched?.id || matched?._id || dbProducts[0]?.id || dbProducts[0]?._id || '1';
  };

  const handlePlaceCustomOrder = async () => {
    if (!isAuthenticated) {
      // Unauthenticated: cache active custom configuration and launch login interstitial
      if (typeof window !== 'undefined') {
        localStorage.setItem('byond_draft_design', JSON.stringify(config));
      }
      setAuthMode('login');
      setAuthForm({ name: '', email: '', password: '' });
      setAuthError('');
      setShowAuthModal(true);
      return;
    }
    
    try {
      setToastMsg('✨ Adding bespoke shoe to your cart...');
      const prodId = getProductMappingId();
      await api.addToCart({
        product_id: prodId,
        size: String(config.size || '8'), // Dynamic customer size selection
        color: config.color || 'Black',
        quantity: 1,
        is_customized: true,
        custom_attributes: {
          material: config.leather || '',
          sole_type: config.sole || '',
          style: config.submodel || '',
          monogram: config.monogram || ''
        }
      });
      setToastMsg('🛒 Bespoke shoe added to cart! Redirecting to checkout bag...');
      setTimeout(() => {
        setToastMsg('');
        window.location.href = '/cart';
      }, 1500);
    } catch (err) {
      console.error('Error placing custom order:', err);
      setToastMsg('Failed to add custom order to cart.');
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  // Fetch dynamic customizable CDN assets on mount
  useEffect(() => {
    const fetchDynamicAssets = async () => {
      try {
        const res = await api.request('/assets');
        const dynamicAssets = res.assets || [];
        
        const dynamicLeathers = [];
        const dynamicColors = [];
        const dynamicSoles = [];
        
        dynamicAssets.forEach(asset => {
          if (!asset.available) return;
          
          if (asset.region === 'leather' || asset.region === 'vamp' || asset.region === 'heel' || asset.region === 'laces') {
            dynamicLeathers.push({
              name: asset.name,
              desc: `Dynamic CDN: ${asset.price_modifier > 0 ? '+ ₹' + asset.price_modifier : 'Included'}`,
              swatch: asset.image_url || asset.color_hex || '#C9A84C',
              price_modifier: asset.price_modifier
            });
          } else if (asset.region === 'sole') {
            dynamicSoles.push({
              name: asset.name,
              desc: `Dynamic CDN sole: ${asset.price_modifier > 0 ? '+ ₹' + asset.price_modifier : 'Included'}`,
              price_modifier: asset.price_modifier
            });
          }
          
          if (asset.color_hex) {
            dynamicColors.push({
              name: asset.name,
              hex: asset.color_hex,
              price_modifier: asset.price_modifier
            });
          }
        });
        
        if (dynamicLeathers.length > 0) {
          setActiveLeathers(prev => [...prev, ...dynamicLeathers]);
        }
        if (dynamicColors.length > 0) {
          setActiveColors(prev => [...prev, ...dynamicColors]);
        }
        if (dynamicSoles.length > 0) {
          setActiveSoles(prev => [...prev, ...dynamicSoles]);
        }
      } catch (err) {
        console.error('Failed to load dynamic customizer assets:', err);
      }
    };
    
    fetchDynamicAssets();
  }, []);

  // Mount effects and saved design recovery
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const gender = params.get('gender');
      const model = params.get('model');
      const submodel = params.get('submodel');
      const leather = params.get('leather');
      const color = params.get('color');
      const sole = params.get('sole');
      const monogram = params.get('monogram');

      // Recover gender context from pathname if query param is missing
      const pathSegments = window.location.pathname.split('/');
      const urlGender = pathSegments[pathSegments.length - 1]; // 'men' or 'women' or 'gender'
      const resolvedGender = gender || (['men', 'women'].includes(urlGender) ? urlGender : '');

      const size = params.get('size');
      if (resolvedGender && model && submodel) {
        setConfig({
          gender: resolvedGender,
          model,
          submodel,
          leather: leather || '',
          color: color || '',
          sole: sole || '',
          size: size || '8',
          monogram: monogram || ''
        });
        setStep(7); // Jump directly to Summary (now step 7)
      } else if (resolvedGender) {
        setConfig(prev => ({ ...prev, gender: resolvedGender }));
        setStep(1);
      }
    }
  }, []);

  const handleMonogramChange = (val) => {
    const clean = val.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, '');
    setConfig(prev => ({ ...prev, monogram: clean }));
  };

  const saveBespokeDesign = (userData = user) => {
    const targetUser = userData || user;
    if (!targetUser) {
      // Unauthenticated: cache active custom configuration and launch login interstitial
      if (typeof window !== 'undefined') {
        localStorage.setItem('byond_draft_design', JSON.stringify(config));
      }
      setAuthMode('login');
      setAuthForm({ name: '', email: '', password: '' });
      setAuthError('');
      setShowAuthModal(true);
      return;
    }

    const key = `byond_saved_designs_${targetUser.email || 'global'}`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    
    // De-duplicate styles
    const isDuplicate = existing.some(d => 
      d.model === config.model &&
      d.submodel === config.submodel &&
      d.leather === config.leather &&
      d.color === config.color &&
      d.sole === config.sole &&
      d.size === config.size &&
      d.monogram === config.monogram
    );
    
    if (isDuplicate) {
      setToastMsg('This bespoke design is already saved in your Atelier Journal!');
      setTimeout(() => setToastMsg(''), 3000);
      return;
    }
    
    const imageUrl = get2DShoeImage(config.model, config.submodel);
    
    const newDesign = {
      id: 'BYOND-SAVED-' + Math.floor(100000 + Math.random() * 900000),
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      gender: config.gender,
      model: config.model,
      submodel: config.submodel,
      leather: config.leather,
      color: config.color,
      sole: config.sole,
      size: config.size || '8',
      monogram: config.monogram || '',
      image: imageUrl
    };
    
    localStorage.setItem(key, JSON.stringify([newDesign, ...existing]));
    setToastMsg('✨ Bespoke design saved to your Atelier Journal!');
    setTimeout(() => {
      setToastMsg('');
      if (typeof window !== 'undefined') {
        localStorage.setItem('byond_active_tab', 'saved_designs');
        window.location.href = '/account';
      }
    }, 1500);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (authMode === 'login') {
        const loggedUser = await login(authForm.email, authForm.password);
        setShowAuthModal(false);
        // Recover draft after successful login
        saveBespokeDesign(loggedUser);
      } else {
        await register(authForm.name, authForm.email, authForm.password);
        setToastMsg('✨ Account created! Check your email to verify. Auto-saving design...');
        // Save to active registration email context
        saveBespokeDesign({ email: authForm.email });
        setTimeout(() => {
          setShowAuthModal(false);
          setToastMsg('');
        }, 3000);
      }
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const copyInstagramLinkSticker = () => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    const qs = new URLSearchParams({
      gender: config.gender,
      model: config.model,
      submodel: config.submodel,
      leather: config.leather,
      color: config.color,
      sole: config.sole,
      size: config.size || '8',
      monogram: config.monogram || ''
    }).toString();
    const fullUrl = `${baseUrl}?${qs}`;

    navigator.clipboard.writeText(fullUrl)
      .then(() => alert('Bespoke customizer link copied! Paste this as a Link Sticker on your Instagram Story.'))
      .catch(() => alert('Failed to copy link.'));
  };

  const downloadInstagramStoryCard = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    // 1. Draw Background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Draw Gilded Double Borders
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, 1000, 1840);
    ctx.strokeRect(55, 55, 970, 1810);

    // 3. Header Text
    ctx.fillStyle = '#C9A84C';
    ctx.font = '300 28px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('B E S P O K E   C R A F T', 540, 160);

    // 4. Brand Logo
    ctx.fillStyle = '#ffffff';
    ctx.font = '400 90px "Playfair Display", serif';
    ctx.fillText('BYOND', 540, 290);
    
    // Draw small gold dot below logo
    ctx.fillStyle = '#C9A84C';
    ctx.beginPath();
    ctx.arc(540, 340, 5, 0, Math.PI * 2);
    ctx.fill();

    const imageUrl = get2DShoeImage(config.model, config.submodel);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Draw image in center with rounded borders
      ctx.save();
      const imgX = 140;
      const imgY = 420;
      const imgW = 800;
      const imgH = 600;
      const r = 24;
      ctx.beginPath();
      ctx.moveTo(imgX + r, imgY);
      ctx.lineTo(imgX + imgW - r, imgY);
      ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + r);
      ctx.lineTo(imgX + imgW, imgY + imgH - r);
      ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - r, imgY + imgH);
      ctx.lineTo(imgX + r, imgY + imgH);
      ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - r);
      ctx.lineTo(imgX, imgY + r);
      ctx.quadraticCurveTo(imgX, imgY, imgX + r, imgY);
      ctx.closePath();
      ctx.clip();
      
      ctx.drawImage(img, imgX, imgY, imgW, imgH);
      ctx.restore();

      // Draw thin gold frame around image
      ctx.strokeStyle = '#C9A84C';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(imgX + r, imgY);
      ctx.lineTo(imgX + imgW - r, imgY);
      ctx.quadraticCurveTo(imgX + imgW, imgY, imgX + imgW, imgY + r);
      ctx.lineTo(imgX + imgW, imgY + imgH - r);
      ctx.quadraticCurveTo(imgX + imgW, imgY + imgH, imgX + imgW - r, imgY + imgH);
      ctx.lineTo(imgX + r, imgY + imgH);
      ctx.quadraticCurveTo(imgX, imgY + imgH, imgX, imgY + imgH - r);
      ctx.lineTo(imgX, imgY + r);
      ctx.quadraticCurveTo(imgX, imgY, imgX + r, imgY);
      ctx.closePath();
      ctx.stroke();

      // 6. Draw Monogram Seal (below image)
      if (config.monogram) {
        ctx.fillStyle = '#C9A84C';
        ctx.font = '300 24px Montserrat, sans-serif';
        ctx.fillText('PERSONAL SOLE MONOGRAM', 540, 1090);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 56px "Playfair Display", serif';
        ctx.fillText(`[ ${config.monogram.split('').join(' . ')} ]`, 540, 1170);
      }

      // 7. Draw Specifications details
      ctx.strokeStyle = 'rgba(201, 168, 76, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(150, 1250);
      ctx.lineTo(930, 1250);
      ctx.stroke();

      // Specs details grid
      const specs = [
        { label: 'SILHOUETTE', val: config.submodel.toUpperCase() },
        { label: 'LEATHER GRADE', val: config.leather.toUpperCase() },
        { label: 'COLORWAY', val: config.color.toUpperCase() },
        { label: 'SIZE (UK)', val: String(config.size || '8').toUpperCase() }
      ];

      ctx.textAlign = 'left';
      specs.forEach((spec, sIdx) => {
        const rowY = 1320 + sIdx * 90;
        
        ctx.fillStyle = '#C9A84C';
        ctx.font = '600 22px Montserrat, sans-serif';
        ctx.fillText(spec.label, 150, rowY);

        ctx.fillStyle = '#ffffff';
        ctx.font = '300 26px Montserrat, sans-serif';
        ctx.fillText(spec.val, 450, rowY);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(150, rowY + 30);
        ctx.lineTo(930, rowY + 30);
        ctx.stroke();
      });

      // 8. Footer brand motto
      ctx.textAlign = 'center';
      ctx.fillStyle = '#C9A84C';
      ctx.font = '300 22px Montserrat, sans-serif';
      ctx.fillText('DESIGNED BY YOU. HANDCRAFTED BY BYOND.', 540, 1750);

      // Trigger download
      const link = document.createElement('a');
      link.download = `byond_custom_${config.submodel.toLowerCase().replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = imageUrl;
  };

  // Resolve the correct submodel list based on gender + model
  const getSubmodels = () => {
    if (!config.model) return [];
    let list = [];
    // Women's Boots use 'WomenBoots' key to avoid collision with Men's Boots
    if (config.model === 'Boots' && config.gender === 'women') {
      list = activeSubmodels['WomenBoots'] || [];
    } else {
      list = activeSubmodels[config.model] || [];
    }
    return list.filter(sm => sm.available !== false);
  };

  const pick = (key, val, nextStep) => {
    setConfig(prev => ({ ...prev, [key]: val }));
    setStep(nextStep);
  };

  const TOTAL = steps.length - 1; // last step is summary = index 7

  // Resize listener for responsive layout
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const isMobile = windowWidth < 1024;

  const hotspots = [
    { id: 'leather', top: '38%', left: '52%', label: '✨ Customize Leather Grade', step: 3 },
    { id: 'sole', top: '74%', left: '35%', label: '👞 Customize Sole Type', step: 5 },
    { id: 'size', top: '58%', left: '66%', label: '📏 Fit & Sizing', step: 6 },
    { id: 'summary', top: '68%', left: '74%', label: '✍️ Personalize Monogram & Save', step: 7 }
  ];

  return (
    <div className="customize-page" data-testid="customize-page" style={{ position: 'relative' }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{ position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', background: '#111', border: '2px solid #C9A84C', borderRadius: '8px', padding: '12px 24px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <Sparkles size={16} color="#C9A84C" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Breadcrumbs (only show on step 0) */}
      {step === 0 && (
        <div className="breadcrumbs">
          <Link href="/">Home</Link>
          <ChevronRight size={14} />
          <span>Customize</span>
          {config.model && <><ChevronRight size={14} /><span>{config.model}</span></>}
          {config.submodel && <><ChevronRight size={14} /><span>{config.submodel}</span></>}
        </div>
      )}

      {/* Hero */}
      {step === 0 ? (
        <div className="customize-hero" style={{ padding: '20px 0 10px' }}>
          <div className="section-label" style={{ fontSize: '0.65rem', letterSpacing: '0.15em' }}>MADE TO ORDER</div>
          <h1 className="customize-heading" style={{ fontSize: '2.2rem', marginBottom: '4px' }}>Bespoke Design Studio</h1>
          <p className="customize-sub" style={{ fontSize: '0.8rem' }}>Co-create your dream footwear. Handcrafted exactly to your specifications.</p>
        </div>
      ) : (
        <div className="customize-hero" style={{ padding: '10px 0 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span className="section-label" style={{ margin: 0, fontSize: '0.6rem', letterSpacing: '0.1em' }}>BESPOKE ATELIER</span>
          <span style={{ color: '#C9A84C' }}>|</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {config.gender}'s {config.model || 'Design'} {config.submodel && ` - ${config.submodel}`}
          </span>
        </div>
      )}

      {/* Progress (Always show top stepper) */}
      <div className="customize-progress" style={{ marginBottom: '16px' }}>
        {steps.map((s, i) => (
          <div
            key={i}
            className={`progress-step ${i <= Math.min(step, TOTAL) ? 'active' : ''} ${i === Math.min(step, TOTAL) ? 'current' : ''}`}
            data-testid={`step-${i}`}
            onClick={() => i < 3 && setStep(i)}
            style={{ cursor: i < 3 ? 'pointer' : 'default' }}
          >
            <div className="progress-num">
              {i < Math.min(step, TOTAL) ? <Check size={12} strokeWidth={3} /> : String(i + 1).padStart(2, '0')}
            </div>
            <div className="progress-label">{s}</div>
          </div>
        ))}
        <div className="progress-line">
          <div className="progress-fill" style={{ width: `${(Math.min(step, TOTAL) / TOTAL) * 100}%` }} />
        </div>
      </div>

      {/* ── Guided Discovery Steps (step < 3) ─────────────────────────────────── */}
      {step < 3 && (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          {/* Step 0: Gender */}
          {step === 0 && (
            <div className="customize-step" data-testid="step-gender">
              <h2 className="step-question">Who are the shoes for?</h2>
              <div className="gender-cards">
                <button className={`gender-card ${config.gender === 'men' ? 'active' : ''}`} onClick={() => pick('gender', 'men', 1)} data-testid="gender-men">
                  <img src="/2d-man.png" alt="Men" />
                  <div className="gender-overlay"><h3>MEN</h3><p>Classic &amp; contemporary styles</p></div>
                </button>
                <button className={`gender-card ${config.gender === 'women' ? 'active' : ''}`} onClick={() => pick('gender', 'women', 1)} data-testid="gender-women">
                  <img src="/2d-woman.png" alt="Women" />
                  <div className="gender-overlay"><h3>WOMEN</h3><p>Elegant &amp; refined designs</p></div>
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Model */}
          {step === 1 && (
            <div className="customize-step" data-testid="step-model">
              <h2 className="step-question">Choose your shoe category</h2>
              <p className="step-sub">Select a category to explore the specific styles within it.</p>
              
              {/* Segmented Men/Women Toggle */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                <div style={{ 
                  display: 'inline-flex', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  {['men', 'women'].map((gender, idx) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setConfig(prev => {
                        const nextGender = gender;
                        const firstModel = activeModels[nextGender]?.[0]?.name || '';
                        return { ...prev, gender: nextGender, model: firstModel, submodel: '' };
                      })}
                      style={{
                        padding: '10px 28px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        fontFamily: 'Montserrat, sans-serif',
                        letterSpacing: '0.06em',
                        background: config.gender === gender ? '#C9A84C' : '#fff',
                        color: config.gender === gender ? '#fff' : '#2E3A4E',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        borderLeft: idx > 0 ? '1px solid #d1d5db' : 'none'
                      }}
                    >
                      {gender}
                    </button>
                  ))}
                </div>
              </div>

              <div className="model-grid">
                {(activeModels[config.gender] || activeModels.men).filter(m => m.available !== false).map((m) => (
                  <button
                    key={m.name}
                    className={`model-card ${config.model === m.name ? 'active' : ''}`}
                    onClick={() => { setConfig(prev => ({ ...prev, model: m.name, submodel: '' })); setStep(2); }}
                    data-testid={`model-${m.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <img src={get2DShoeImage(m.name)} alt={m.name} style={{ objectFit: 'contain', padding: '16px', background: '#fff' }} />
                    <div className="model-info">
                      <h3>{m.name}</h3>
                      <p>{m.desc}</p>
                      <span className="model-count">{(config.gender === 'women' && m.name === 'Boots' ? activeSubmodels['WomenBoots'] : activeSubmodels[m.name] || []).length} styles →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Submodel */}
          {step === 2 && (
            <div className="customize-step" data-testid="step-submodel">
              <div className="submodel-header">
                <div>
                  <div className="section-label" style={{ marginBottom: '8px' }}>
                    {config.gender === 'men' ? "MEN'S" : "WOMEN'S"} {config.model.toUpperCase()}
                  </div>
                  <h2 className="step-question" style={{ marginBottom: '12px' }}>
                    Select your style
                  </h2>
                  <p className="step-sub">
                    Each style below shares the same {config.model} construction but with a distinct silhouette.
                  </p>
                </div>
                <div className="submodel-count-badge">
                  {getSubmodels().length} <span>styles available</span>
                </div>
              </div>

              <div className="submodel-grid">
                {getSubmodels().map((sm) => (
                  <button
                    key={sm.name}
                    className={`submodel-card ${config.submodel === sm.name ? 'active' : ''}`}
                    onClick={() => {
                      // Autocomplete leather/color/sole defaults if blank to provide immediate canvas preview
                      setConfig(prev => ({
                        ...prev,
                        submodel: sm.name,
                        leather: prev.leather || activeLeathers[0]?.name || '',
                        color: prev.color || activeColors[0]?.name || '',
                        sole: prev.sole || activeSoles[0]?.name || ''
                      }));
                      setStep(3);
                    }}
                    data-testid={`submodel-${sm.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {sm.tag && <div className="submodel-tag">{sm.tag}</div>}
                    {config.submodel === sm.name && (
                      <div className="submodel-check"><Check size={14} strokeWidth={3} /></div>
                    )}
                    <div className="submodel-img-wrap" style={{ background: '#fff' }}>
                      <img src={get2DShoeImage(config.model, sm.name)} alt={sm.name} style={{ objectFit: 'contain', padding: '16px' }} />
                      <div className="submodel-img-overlay" />
                    </div>
                    <div className="submodel-info">
                      <h3 className="submodel-name">{sm.name}</h3>
                      <p className="submodel-desc">{sm.desc}</p>
                      <div className="submodel-cta">Select this style →</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Bespoke Designer Split Workspace (step >= 3) ─────────────────────────────────── */}
      {step >= 3 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr', 
          gap: '28px', 
          maxWidth: '1300px', 
          margin: '0 auto', 
          alignItems: 'start'
        }}>
          
          {/* Left Pane: Persistent Canvas Preview */}
          <div style={{ 
            position: isMobile ? 'relative' : 'sticky', 
            top: isMobile ? '0' : '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            justifyContent: 'flex-start'
          }}>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              aspectRatio: '4/3', 
              borderRadius: '16px', 
              overflow: 'hidden', 
              border: '1px solid #C9A84C', 
              background: '#fcfcfc', 
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
            }}>
              
              <img 
                src={get2DShoeImage(config.model, config.submodel)} 
                alt="Bespoke Shoe Preview" 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  objectFit: 'contain', 
                  padding: '24px',
                  background: '#fff',
                  transition: 'opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)', 
                  opacity: isTransitioning ? 0.3 : 1,
                  transform: isTransitioning ? 'scale(0.98)' : 'scale(1)'
                }}
              />

              {/* Glowing Interactive Hotspots */}
              {hotspots.map((h) => (
                <div key={h.id} onMouseEnter={() => setHoveredHotspot(h.id)} onMouseLeave={() => setHoveredHotspot(null)}>
                  <button 
                    onClick={() => setStep(h.step)} 
                    style={{
                      position: 'absolute',
                      top: h.top,
                      left: h.left,
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#C9A84C',
                      border: '2.5px solid #fff',
                      boxShadow: '0 0 10px rgba(201,168,76,0.9)',
                      cursor: 'pointer',
                      transform: hoveredHotspot === h.id ? 'scale(1.25)' : 'scale(1)',
                      transition: 'transform 0.25s ease',
                      zIndex: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#fff' }}></span>
                  </button>
                  {hoveredHotspot === h.id && (
                    <div style={{ position: 'absolute', top: `calc(${h.top} - 32px)`, left: h.left, transform: 'translateX(-50%)', background: '#111', border: '1.5px solid #C9A84C', color: '#C9A84C', fontSize: '0.62rem', fontWeight: 700, padding: '5px 10px', borderRadius: '6px', whiteSpace: 'nowrap', zIndex: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.3)', letterSpacing: '0.02em' }}>
                      {h.label}
                    </div>
                  )}
                </div>
              ))}

              {/* Bottom dynamic swatches overlay bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '16px 20px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
                <div>
                  <div style={{ fontSize: '0.6rem', color: '#C9A84C', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Bespoke Draft</div>
                  <strong style={{ fontSize: '0.85rem', letterSpacing: '0.02em' }}>{config.submodel}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: activeColors.find(c => c.name === config.color)?.hex || '#000', border: '1px solid #fff' }} />
                  <span style={{ fontSize: '0.72rem', fontWeight: 500 }}>{config.leather} · {config.color}</span>
                </div>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div style={{ padding: '10px 14px', background: '#FAF9F6', borderRadius: '10px', borderLeft: '3px solid #C9A84C', fontSize: '0.7rem', color: '#78716c', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={14} color="#C9A84C" style={{ flexShrink: 0 }} />
              <span>Feel free to click swatches directly or tap any of the glowing dots on the shoe preview!</span>
            </div>
          </div>

          {/* Right Pane: collapsible selection modules (Accordion) */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '14px'
          }}>
            
            {/* Accordion 1: Leather Selection */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <button 
                onClick={() => setStep(step === 3 ? 8 : 3)}
                style={{ width: '100%', padding: '12px 16px', background: step === 3 ? '#111' : '#FAF9F6', border: '1px solid #e7e5e4', borderLeft: step === 3 ? '4px solid #C9A84C' : '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step === 3 ? '#fff' : '#1c1917' }}>Leather Grade</span>
                  {config.leather && (
                    <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: step === 3 ? '#C9A84C' : '#78716c', marginTop: '2px' }}>{config.leather}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: step === 3 ? '#C9A84C' : '#78716c' }}>
                  {step === 3 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>
              
              <div style={{ maxHeight: step === 3 ? '1000px' : '0px', overflow: 'hidden', transition: 'max-height 0.4s ease', background: '#fff', border: '1px solid #e7e5e4', borderTop: 'none' }}>
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {getFilteredLeathers().map((l) => (
                      <button
                        key={l.name}
                        className={`leather-card ${config.leather === l.name ? 'active' : ''}`}
                        onClick={() => pick('leather', l.name, 4)}
                        style={{ display: 'flex', alignItems: 'center', padding: '14px', width: '100%', margin: 0, textAlign: 'left' }}
                      >
                        <div 
                          className="leather-swatch" 
                          style={{ 
                            background: l.swatch.startsWith('#') ? l.swatch : `url(${l.swatch}) center/cover`, 
                            flexShrink: 0 
                          }} 
                        />
                        <div style={{ flex: 1, marginLeft: '12px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{l.name}</h4>
                          <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: '#78716c' }}>{l.desc}</p>
                        </div>
                        {config.leather === l.name && <div className="leather-check" style={{ position: 'relative', top: 'auto', right: 'auto' }}><Check size={12} strokeWidth={3} /></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion 2: Color Selection */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <button 
                onClick={() => setStep(step === 4 ? 8 : 4)}
                style={{ width: '100%', padding: '12px 16px', background: step === 4 ? '#111' : '#FAF9F6', border: '1px solid #e7e5e4', borderLeft: step === 4 ? '4px solid #C9A84C' : '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step === 4 ? '#fff' : '#1c1917' }}>Colorway Selection</span>
                  {config.color && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: activeColors.find(c => c.name === config.color)?.hex || '#000' }} />
                      <span style={{ fontSize: '0.68rem', fontWeight: 600, color: step === 4 ? '#C9A84C' : '#78716c' }}>{config.color}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: step === 4 ? '#C9A84C' : '#78716c' }}>
                  {step === 4 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <div style={{ maxHeight: step === 4 ? '1000px' : '0px', overflow: 'hidden', transition: 'max-height 0.4s ease', background: '#fff', border: '1px solid #e7e5e4', borderTop: 'none' }}>
                <div style={{ padding: '24px 20px' }}>
                  <div className="color-picker-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    {activeColors.map((c) => (
                      <button
                        key={c.name}
                        className={`color-pick-card ${config.color === c.name ? 'active' : ''}`}
                        onClick={() => pick('color', c.name, 5)}
                        style={{ padding: '12px 6px', margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                      >
                        <div className="color-pick-swatch" style={{ backgroundColor: c.hex, width: '28px', height: '28px', margin: 0, display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
                          {config.color === c.name && <Check size={12} strokeWidth={3} color="#fff" />}
                        </div>
                        <span style={{ fontSize: '0.62rem', marginTop: '6px', textAlign: 'center' }}>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion 3: Sole Selection */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <button 
                onClick={() => setStep(step === 5 ? 8 : 5)}
                style={{ width: '100%', padding: '12px 16px', background: step === 5 ? '#111' : '#FAF9F6', border: '1px solid #e7e5e4', borderLeft: step === 5 ? '4px solid #C9A84C' : '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step === 5 ? '#fff' : '#1c1917' }}>Outsoles</span>
                  {config.sole && (
                    <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: step === 5 ? '#C9A84C' : '#78716c', marginTop: '2px' }}>{config.sole}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: step === 5 ? '#C9A84C' : '#78716c' }}>
                  {step === 5 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <div style={{ maxHeight: step === 5 ? '1000px' : '0px', overflow: 'hidden', transition: 'max-height 0.4s ease', background: '#fff', border: '1px solid #e7e5e4', borderTop: 'none' }}>
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {getFilteredSoles().map((s) => (
                      <button
                        key={s.name}
                        className={`sole-card ${config.sole === s.name ? 'active' : ''}`}
                        onClick={() => pick('sole', s.name, 6)}
                        style={{ display: 'block', width: '100%', padding: '14px', margin: 0, textAlign: 'left', position: 'relative' }}
                      >
                        {config.sole === s.name && <div className="sole-check" style={{ position: 'absolute', top: '16px', right: '16px' }}><Check size={12} strokeWidth={3} /></div>}
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>{s.name}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: '#78716c' }}>{s.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Accordion 4: Bespoke Fitting & Sizing */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <button 
                onClick={() => setStep(step === 6 ? 8 : 6)}
                style={{ width: '100%', padding: '12px 16px', background: step === 6 ? '#111' : '#FAF9F6', border: '1px solid #e7e5e4', borderLeft: step === 6 ? '4px solid #C9A84C' : '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step === 6 ? '#fff' : '#1c1917' }}>Fitting &amp; Sizing</span>
                  {config.size && (
                    <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: step === 6 ? '#C9A84C' : '#78716c', marginTop: '2px' }}>UK Size {config.size}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: step === 6 ? '#C9A84C' : '#78716c' }}>
                  {step === 6 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <div style={{ maxHeight: step === 6 ? '1000px' : '0px', overflow: 'hidden', transition: 'max-height 0.4s ease', background: '#fff', border: '1px solid #e7e5e4', borderTop: 'none' }}>
                <div style={{ padding: '24px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Your Size (UK)</span>
                    <button 
                      type="button" 
                      onClick={() => setShowFitProfiler(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#C9A84C', fontSize: '0.72rem', textDecoration: 'underline', fontWeight: '600' }}
                    >
                      🔍 Find My Size
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {['6', '7', '8', '9', '10', '11', '12'].map((sz) => (
                      <button
                        key={sz}
                        onClick={() => pick('size', String(sz), 7)}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: config.size === String(sz) ? '2px solid #C9A84C' : '1px solid #E5E7EB',
                          backgroundColor: config.size === String(sz) ? '#FAF9F6' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.85rem',
                          fontWeight: config.size === String(sz) ? '700' : '500',
                          color: config.size === String(sz) ? '#C9A84C' : '#1c1917',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>

                  <p style={{ margin: '14px 0 0 0', fontSize: '0.68rem', color: '#78716c', lineHeight: 1.4 }}>
                    Each BYOND shoe is individually lasted to your size selection. Standard fits accommodate D (medium) widths comfortably.
                  </p>
                </div>
              </div>
            </div>

            {/* Accordion 5: Summary & Personalization */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              <button 
                onClick={() => setStep(step === 7 ? 8 : 7)}
                style={{ width: '100%', padding: '12px 16px', background: step === 7 ? '#111' : '#FAF9F6', border: '1px solid #e7e5e4', borderLeft: step === 7 ? '4px solid #C9A84C' : '1px solid #e7e5e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}
              >
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: step === 7 ? '#fff' : '#1c1917' }}>Design Summary</span>
                  <span style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: step === 7 ? '#C9A84C' : '#78716c', marginTop: '2px' }}>
                    {config.monogram ? `Monogram [${config.monogram}]` : 'Monogram & Checkout'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: step === 7 ? '#C9A84C' : '#78716c' }}>
                  {step === 7 ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <div style={{ maxHeight: step === 7 ? '1200px' : '0px', overflow: 'hidden', transition: 'max-height 0.4s ease', background: '#fff', border: '1px solid #e7e5e4', borderTop: 'none' }}>
                <div style={{ padding: '24px 20px' }}>
                  
                  {/* Summary spec details rows */}
                  <div className="summary-rows" style={{ margin: 0, padding: 0, border: 'none' }}>
                    <div className="summary-row">
                      <span className="summary-label">Silhouette</span>
                      <strong className="summary-value" style={{ color: '#1c1917' }}>{config.submodel}</strong>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Leather</span>
                      <strong className="summary-value" style={{ color: '#1c1917' }}>{config.leather}</strong>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Color</span>
                      <span className="summary-value summary-color-val" style={{ color: '#1c1917', fontWeight: 700 }}>
                        <span className="summary-color-dot" style={{ backgroundColor: activeColors.find(c => c.name === config.color)?.hex || '#000' }} />
                        {config.color}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Outsole</span>
                      <strong className="summary-value" style={{ color: '#1c1917' }}>{config.sole}</strong>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Fitting Size</span>
                      <strong className="summary-value" style={{ color: '#1c1917' }}>UK {config.size || 'Not Selected'}</strong>
                    </div>
                    {config.monogram && (
                      <div className="summary-row">
                        <span className="summary-label">Outsole Monogram</span>
                        <strong className="summary-value" style={{ color: '#C9A84C', letterSpacing: '0.05em' }}>[{config.monogram}]</strong>
                      </div>
                    )}
                    <div style={{ marginTop: '16px', borderTop: '1px dashed #e7e5e4', paddingTop: '16px' }}>
                      <div className="summary-row" style={{ marginBottom: '8px' }}>
                        <span className="summary-label" style={{ fontSize: '0.72rem', color: '#78716c' }}>Base Silhouette ({config.submodel})</span>
                        <strong className="summary-value" style={{ color: '#1c1917', fontSize: '0.75rem' }}>₹{priceBreakdown.base_price?.toLocaleString('en-IN')}</strong>
                      </div>
                      
                      {priceBreakdown.applied_rules && priceBreakdown.applied_rules.map((rule, idx) => (
                        <div className="summary-row" key={idx} style={{ marginBottom: '8px' }}>
                          <span className="summary-label" style={{ fontSize: '0.72rem', color: '#C9A84C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            ✨ {rule.rule}
                          </span>
                          <strong className="summary-value" style={{ color: '#C9A84C', fontSize: '0.75rem' }}>{rule.adjustment.startsWith('+') ? rule.adjustment : `+₹${Number(rule.adjustment).toLocaleString('en-IN')}`}</strong>
                        </div>
                      ))}

                      <div className="summary-row price-row" style={{ marginTop: '12px', borderTop: '1px solid #e7e5e4', paddingTop: '12px' }}>
                        <span className="summary-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Estimated Total Price</span>
                        <span className="summary-price" style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1rem' }}>
                          ₹{priceBreakdown.final_price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monogram Input */}
                  <div style={{ marginTop: '20px', borderTop: '1px solid #e7e5e4', paddingTop: '16px', marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      ✍️ Outsole Gold Foil Monogram (Max 3 Initials)
                    </label>
                    <input 
                      type="text" 
                      maxLength={3}
                      placeholder="e.g. BYD"
                      value={config.monogram || ''}
                      onChange={(e) => handleMonogramChange(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600, color: '#1c1917', letterSpacing: '0.1em' }}
                    />
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.65rem', color: '#a1a1aa' }}>
                      Your custom initials will be hot-stamped in gold foil onto the handcrafted leather outsole.
                    </p>
                  </div>

                  {/* Split row for Social Story Card & Place Order */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
                    <button onClick={handlePlaceCustomOrder} className="btn-place-order" data-testid="place-custom-order" style={{ width: '100%', margin: 0, padding: '14px', background: '#C9A84C', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
                      Place Custom Order <ArrowRight size={16} />
                    </button>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button 
                        onClick={() => setInstagramModal(true)} 
                        style={{ width: '100%', padding: '12px', background: '#111', color: '#C9A84C', border: '1px solid #C9A84C', borderRadius: '8px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                      >
                        <Camera size={14} /> Share Story
                      </button>
                      <button 
                        onClick={() => saveBespokeDesign()} 
                        style={{ width: '100%', padding: '12px', background: '#111', color: '#C9A84C', border: '1px solid #C9A84C', borderRadius: '8px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                      >
                        <Save size={14} /> Save Design
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ margin: '12px 0 0 0', fontSize: '0.65rem', color: '#a1a1aa', textAlign: 'center' }}>
                    Our design team will contact you within 24 hours to finalize details.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Instagram Story Card Modal */}
      {instagramModal && (
        <div className="instagram-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="instagram-modal glass-dark-gilded" style={{ border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '16px', padding: '24px', maxWidth: '400px', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <button onClick={() => setInstagramModal(false)} style={{ position: 'absolute', top: '12px', right: '16px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            
            <h3 style={{ margin: '0 0 16px 0', fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', color: '#C9A84C', letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>Your Instagram Story Card</h3>
            
            {/* Aspect Ratio 9:16 Portrait Preview Card */}
            <div id="story-card-preview" style={{ width: '220px', height: '390px', background: '#1c1c1e', border: '1px solid #C9A84C', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.45rem', color: '#C9A84C', letterSpacing: '0.2em', textTransform: 'uppercase' }}>B E S P O K E   C R A F T</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', fontFamily: 'Playfair Display, serif', marginTop: '6px' }}>BYOND</div>
              </div>

              {/* Mockup image */}
              <div style={{ width: '100%', height: '130px', borderRadius: '8px', border: '1px solid #C9A84C', overflow: 'hidden', margin: '8px 0' }}>
                <img 
                  src={get2DShoeImage(config.model, config.submodel)} 
                  alt="Shoe" 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', background: '#fff' }} 
                />
              </div>

              {/* Specs */}
              <div style={{ fontSize: '0.52rem', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {config.monogram && (
                  <div style={{ textAlign: 'center', marginBottom: '4px', borderBottom: '1px dashed rgba(201,168,76,0.2)', paddingBottom: '3px' }}>
                    <span style={{ color: '#C9A84C', fontSize: '0.45rem', display: 'block', letterSpacing: '0.1em' }}>MONOGRAM</span>
                    <strong style={{ color: '#fff', fontSize: '0.75rem', letterSpacing: '0.1em' }}>[{config.monogram.split('').join('.')}]</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#C9A84C' }}>STYLE</span>
                  <span style={{ fontWeight: 600 }}>{config.submodel?.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#C9A84C' }}>LEATHER</span>
                  <span style={{ fontWeight: 600 }}>{config.leather?.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#C9A84C' }}>SOLE</span>
                  <span style={{ fontWeight: 600 }}>{config.sole?.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#C9A84C' }}>SIZE (UK)</span>
                  <span style={{ fontWeight: 600 }}>{String(config.size || '8').toUpperCase()}</span>
                </div>
              </div>

              <div style={{ fontSize: '0.42rem', color: '#C9A84C', textAlign: 'center', letterSpacing: '0.05em' }}>
                DESIGNED BY YOU. BYOND.
              </div>
            </div>

            <p style={{ margin: '14px 0 16px 0', fontSize: '0.68rem', color: '#a1a1aa', textAlign: 'center', lineHeight: 1.4 }}>
              Download this story card to post on your Instagram Story. Copy the link sticker so friends can view your design!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button 
                onClick={downloadInstagramStoryCard} 
                style={{ width: '100%', padding: '10px', background: '#C9A84C', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                📥 Download Story Card Image
              </button>
              <button 
                onClick={copyInstagramLinkSticker} 
                style={{ width: '100%', padding: '10px', background: '#1c1c1e', color: '#C9A84C', border: '1px solid #C9A84C', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                🔗 Copy Link Sticker URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sizing Fit Profiler Modal */}
      {showFitProfiler && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-dark-gilded" style={{ maxWidth: '440px', width: '100%', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '16px', padding: '24px 32px', position: 'relative' }}>
            <button onClick={() => { setShowFitProfiler(false); setFitResult(null); }} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: '#a1a1aa' }}>
              <X size={20} />
            </button>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <Ruler size={32} color="#C9A84C" style={{ margin: '0 auto 8px' }} />
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.4rem', color: '#fff', margin: 0, fontStyle: 'italic' }}>Bespoke Sizing Concierge</h3>
              <p style={{ fontSize: '11px', color: '#a1a1aa', margin: '4px 0 0 0' }}>Map your current footwear sizes to our handcrafted Italian lasts.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#C9A84C', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Reference Brand You Wear</label>
                <select value={fitBrand} onChange={(e) => { setFitBrand(e.target.value); setFitResult(null); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', fontSize: '13px', background: '#1c1c1e', color: '#fff' }}>
                  <option value="Nike">Nike (Running)</option>
                  <option value="Adidas">Adidas (Athletic)</option>
                  <option value="Clarks">Clarks (Heritage Dress)</option>
                  <option value="Allen Edmonds">Allen Edmonds (Premium Dress)</option>
                  <option value="Birkenstock">Birkenstock (Sandals)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#C9A84C', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Reference Size (UK/US)</label>
                  <select value={fitSize} onChange={(e) => { setFitSize(e.target.value); setFitResult(null); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', fontSize: '13px', background: '#1c1c1e', color: '#fff' }}>
                    {['6', '7', '8', '9', '10', '11', '12'].map(s => (
                      <option key={s} value={s}>UK {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: '700', color: '#C9A84C', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>Foot Width Profile</label>
                  <select value={fitWidth} onChange={(e) => { setFitWidth(e.target.value); setFitResult(null); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', fontSize: '13px', background: '#1c1c1e', color: '#fff' }}>
                    <option value="Narrow">Narrow Width</option>
                    <option value="Standard">Standard (Medium)</option>
                    <option value="Wide">Wide Width</option>
                  </select>
                </div>
              </div>

              {!fitResult ? (
                <button onClick={calculateRecommendedSize} style={{ width: '100%', padding: '12px', background: '#C9A84C', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '8px' }}>
                  Calculate Recommended Fit
                </button>
              ) : (
                <div style={{ marginTop: '10px', padding: '14px', background: 'rgba(201, 168, 76, 0.08)', border: '1px solid rgba(201, 168, 76, 0.3)', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#C9A84C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Our Recommendation</div>
                  <div style={{ fontSize: '15px', color: '#fff', fontWeight: '800' }}>
                    UK {Math.floor(fitResult)} <span style={{ fontWeight: '400', fontSize: '13px', color: '#a1a1aa' }}>({fitWidth === 'Wide' ? 'Wide last adjustment' : fitWidth === 'Narrow' ? 'Narrow last adjustment' : 'Standard Fit'})</span>
                  </div>
                  <p style={{ fontSize: '10px', color: '#a1a1aa', margin: '6px 0 12px 0', lineHeight: 1.4 }}>
                    {fitBrand === 'Nike' || fitBrand === 'Adidas' 
                      ? 'Athletic running shoes run tighter. Handcrafted leather dress shoes map 1 size down for standard last molds.' 
                      : 'Perfect 1:1 match. Handcrafted to original heritage sizing profiles.'}
                  </p>
                  <button 
                    onClick={() => {
                      setConfig(prev => ({ ...prev, size: String(Math.floor(fitResult)) }));
                      setShowFitProfiler(false);
                      setFitResult(null);
                      setStep(7);
                    }}
                    style={{ width: '100%', padding: '10px', background: '#C9A84C', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                  >
                    Apply Recommended Size UK {Math.floor(fitResult)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guest Authentication Interstitial Modal */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-dark-gilded" style={{ border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '16px', padding: '32px', maxWidth: '440px', width: '100%', position: 'relative' }}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#a1a1aa', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <Sparkles size={36} color="#C9A84C" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ margin: 0, fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', color: '#fff', fontStyle: 'italic' }}>Save Your Masterpiece</h3>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#a1a1aa' }}>Create an account or log in to save this bespoke configuration to your virtual Atelier Journal.</p>
            </div>

            {authError && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgb(239, 68, 68)', borderRadius: '6px', color: 'rgb(239, 68, 68)', fontSize: '0.72rem', marginBottom: '16px', fontWeight: 500 }}>
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'signup' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={authForm.name} 
                    onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                    placeholder="E.g. Krushn"
                  />
                </div>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Email Address</label>
                <input 
                  type="email" 
                  required 
                  value={authForm.email} 
                  onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                  placeholder="E.g. krushn@byondstudio.com"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: 600 }}>Password</label>
                <input 
                  type="password" 
                  required 
                  value={authForm.password} 
                  onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{ width: '100%', padding: '10px', background: '#1c1c1e', border: '1px solid #333', borderRadius: '6px', color: '#fff', fontSize: '0.8rem' }}
                  placeholder="••••••••"
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#C9A84C', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', marginTop: '10px' }}>
                {authMode === 'login' ? 'Log In & Save' : 'Create Account & Save'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.72rem', color: '#a1a1aa' }}>
              {authMode === 'login' ? (
                <span>Don't have an account? <button onClick={() => { setAuthMode('signup'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#C9A84C', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>Sign Up</button></span>
              ) : (
                <span>Already have an account? <button onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ background: 'none', border: 'none', color: '#C9A84C', fontWeight: 700, textDecoration: 'underline', cursor: 'pointer' }}>Log In</button></span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guided Steps Back Navigation */}
      {step > 0 && step < 3 && (
        <div className="customize-nav-btns">
          <button className="btn-back" onClick={() => setStep(step - 1)} data-testid="customize-back">
            ← Back
          </button>
          {step < 2 && (
            <button className="btn-skip" onClick={() => setStep(step + 1)}>
              Skip this step
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomizePage;
