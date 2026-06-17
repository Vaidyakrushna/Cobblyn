"use client";
import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Trash2, CheckCircle2, AlertTriangle, 
  Upload, Layers, IndianRupee, Link as LinkIcon, RefreshCw,
  Eye, Check, EyeOff, Settings, Calculator, FileText, Layout,
  Sliders, Edit2, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import api from '../../api';

const defaultSubmodels = {
  Oxford: [
    { name: 'Plain Toe Oxford', desc: 'Clean, unadorned vamp — the purest expression of the Oxford. Ideal for black-tie and boardrooms.', tag: 'Most Classic', img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80&fit=crop' },
    { name: 'Cap Toe Oxford', desc: 'A horizontal seam across the toe cap adds quiet structure and a military-inspired finish.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80&fit=crop' },
    { name: 'Wingtip Oxford', desc: 'W-shaped broguing flows over the toe — bold character meets formal tradition.', tag: 'Most Distinctive', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop' },
    { name: 'Wholecut Oxford', desc: 'Crafted from a single piece of leather. The rarest Oxford silhouette — zero seams, absolute refinement.', tag: 'Most Luxurious', img: 'https://images.unsplash.com/photo-1573100925118-870b8efc799d?w=600&q=80&fit=crop' },
    { name: 'Semi-Brogue Oxford', desc: 'Subtle toe-cap broguing adds texture without overpowering the formal silhouette.', tag: '', img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&q=80&fit=crop' },
    { name: 'Full-Brogue Oxford', desc: 'Perforations and medallions across the entire shoe — the richest brogued expression.', tag: 'Most Textured', img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=600&q=80&fit=crop' }
  ],
  Derby: [
    { name: 'Plain Toe Blucher', desc: 'The open-lacing derby stripped to essentials. Versatile from smart-casual to business.', tag: 'Most Versatile', img: 'https://images.unsplash.com/photo-1616696038562-574c18066055?w=600&q=80&fit=crop' },
    { name: 'Cap Toe Derby', desc: 'A stitched toe cap elevates the relaxed derby lacing into polished territory.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop' },
    { name: 'Longwing Derby', desc: 'The W-shaped broguing extends all the way to the heel — a true American classic.', tag: 'Most American', img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=600&q=80&fit=crop' },
    { name: 'Wingtip Derby', desc: 'Full brogue detailing on open-laced construction — casual elegance personified.', tag: '', img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=600&q=80&fit=crop' },
    { name: 'Norwegian Derby', desc: 'Rugged storm welt with split-toe or moc-toe stitching. Built for the elements.', tag: 'Most Rugged', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80&fit=crop' }
  ],
  Loafer: [
    { name: 'Penny Loafer', desc: 'The definitive loafer — a saddle strap across the vamp with the iconic penny slot.', tag: 'Most Classic', img: 'https://images.pexels.com/photos/29258015/pexels-photo-29258015.jpeg?auto=compress&cs=tinysrgb&w=600' },
    { name: 'Horsebit Loafer', desc: 'Gold-tone horsebit hardware on the instep — the quintessential Italian loafer.', tag: 'Most Iconic', img: 'https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?w=600&q=80&fit=crop' },
    { name: 'Tassel Loafer', desc: 'Leather tassels swing with every step. Ivy League heritage, forever in style.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80&fit=crop' },
    { name: 'Driving Loafer', desc: 'Rubber pebble sole wraps up the heel. Designed for the driver, loved by all.', tag: 'Most Casual', img: 'https://images.unsplash.com/photo-1573100925118-870b8efc799d?w=600&q=80&fit=crop' },
    { name: 'String Loafer', desc: 'Woven leather string bow on the vamp — relaxed, summery, and effortlessly chic.', tag: 'Most Relaxed', img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=600&q=80&fit=crop' },
    { name: 'Dress Slipper', desc: 'Flat-soled evening slipper with velvet or patent. A formal loafer for black-tie.', tag: 'Most Formal', img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80&fit=crop' }
  ],
  'Monk Strap': [
    { name: 'Single Monk', desc: 'One buckle, one strap — powerful restraint. The boldest dress shoe in any wardrobe.', tag: 'Most Popular', img: 'https://images.unsplash.com/photo-1770198408387-7f45e5d6c056?w=600&q=80&fit=crop' },
    { name: 'Double Monk', desc: 'Two straps, two buckles — maximum visual impact. A true statement in formal wear.', tag: 'Most Distinctive', img: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80&fit=crop' },
    { name: 'Brogue Monk', desc: 'Perforated detailing on the monk strap silhouette — smart-casual at its finest.', tag: '', img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=600&q=80&fit=crop' }
  ],
  Boots: [
    { name: 'Chelsea Boot', desc: 'Elastic side gussets, no laces. The most versatile boot — office to evening.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80&fit=crop' },
    { name: 'Chukka Boot', desc: 'Open-laced two or three-eyelet ankle boot. Casual refinement at its best.', tag: 'Most Casual', img: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80&fit=crop' },
    { name: 'Jodhpur Boot', desc: 'Ankle strap with buckle — equestrian heritage translated into everyday elegance.', tag: 'Most Heritage', img: 'https://images.unsplash.com/photo-1573100925118-870b8efc799d?w=600&q=80&fit=crop' },
    { name: 'Cap Toe Boot', desc: 'Formal boot with a stitched toe cap — dress shoe construction at ankle height.', tag: 'Most Formal', img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600&q=80&fit=crop' },
    { name: 'Wingtip Boot', desc: 'Full broguing on a boot silhouette — the most expressive boot in the collection.', tag: 'Most Distinctive', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&fit=crop' },
    { name: 'Balmoral Boot', desc: 'Closed lacing with seamed vamp — the most formal boot, built like an Oxford.', tag: 'Most Refined', img: 'https://images.unsplash.com/photo-1616696038562-574c18066055?w=600&q=80&fit=crop' },
    { name: 'Zipper Boot', desc: 'Side-zip closure for effortless wear without sacrificing polish.', tag: '', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80&fit=crop' }
  ],
  Jutis: [
    { name: 'Classic Juti', desc: 'Traditional pointed-toe juti with hand embroidery — a timeless ceremonial staple.', tag: 'Most Traditional', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop' },
    { name: 'Nagra', desc: 'Rounded toe with curled tip — Rajasthani heritage in every stitch.', tag: 'Regional Heritage', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop' },
    { name: 'Kolhapuri Juti', desc: 'Open-weave leather with floral embossing — Maharashtra craftsmanship at its finest.', tag: '', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop' },
    { name: 'Mojari', desc: 'Fully embroidered upper with mirror-work — festive, opulent, and entirely handcrafted.', tag: 'Most Festive', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop' }
  ],
  Ballerina: [
    { name: 'Classic Flat', desc: 'The essential ballet flat — soft round toe, comfortable last, endlessly versatile.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1774802536876-88b0e1ca7453?w=600&q=80&fit=crop' },
    { name: 'D\'Orsay Flat', desc: 'Open sides reveal the arch — a feminine silhouette for events and evenings.', tag: 'Most Elegant', img: 'https://images.unsplash.com/photo-1720604083961-88336789791e?w=600&q=80&fit=crop' },
    { name: 'Pointed Toe Flat', desc: 'A sharp elongated toe gives the classic flat a fashion-forward edge.', tag: 'Most Modern', img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=600&q=80&fit=crop' },
    { name: 'Bow Ballet', desc: 'A satin or leather bow at the vamp — playful luxury for dressy occasions.', tag: '', img: 'https://images.unsplash.com/photo-1774802536876-88b0e1ca7453?w=600&q=80&fit=crop' }
  ],
  WomenBoots: [
    { name: 'Ankle Boot', desc: 'A clean ankle silhouette that pairs with everything. The most versatile boot.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=600&q=80&fit=crop' },
    { name: 'Chelsea Ankle Boot', desc: 'Elastic side panels for slip-on ease — polished without the fuss.', tag: 'Most Comfortable', img: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&q=80&fit=crop' },
    { name: 'Block Heel Boot', desc: 'Sturdy block heel for all-day support without sacrificing height or style.', tag: 'Most Practical', img: 'https://images.unsplash.com/photo-1573100925118-870b8efc799d?w=600&q=80&fit=crop' },
    { name: 'Kitten Heel Boot', desc: 'A slender 4–5 cm heel — understated, feminine, and office-appropriate.', tag: 'Most Refined', img: 'https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=600&q=80&fit=crop' }
  ],
  Loafers: [
    { name: 'Penny Loafer', desc: 'The classic saddle-strap loafer in women\'s sizing — timeless from campus to boardroom.', tag: 'Most Classic', img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=600&q=80&fit=crop' },
    { name: 'Platform Loafer', desc: 'Chunky platform sole adds height with maximum comfort. A bold fashion statement.', tag: 'Most Trendy', img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=600&q=80&fit=crop' },
    { name: 'Horsebit Loafer', desc: 'Gold-tone hardware on a women\'s silhouette — Italian luxury redefined.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1627384113743-6bd5a479fffd?w=627&q=80&fit=crop' },
    { name: 'Tassel Loafer', desc: 'Playful leather tassels with a feminine last — smart-casual in the most chic sense.', tag: '', img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=600&q=80&fit=crop' }
  ],
  'Peep Toes': [
    { name: 'Kitten Heel Peep Toe', desc: 'Delicate 4–5 cm heel with an open toe — a refined choice for formal occasions.', tag: 'Most Elegant', img: 'https://images.unsplash.com/photo-1720604083961-88336789791e?w=600&q=80&fit=crop' },
    { name: 'Block Heel Peep Toe', desc: 'Peep-toe styling on a stable block heel — glamorous yet walkable.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1720604083961-88336789791e?w=600&q=80&fit=crop' },
    { name: 'Slingback Peep Toe', desc: 'An adjustable heel strap keeps the shoe secure while the open toe adds airiness.', tag: 'Most Comfortable', img: 'https://images.unsplash.com/photo-1774802536876-88b0e1ca7453?w=600&q=80&fit=crop' }
  ],
  'Desert Boot/Chukka Boots': [
    { name: 'Suede Desert Boot', desc: 'Classic crepe sole with soft suede upper — casual, comfortable heritage.', tag: 'Most Classic', img: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=600&q=80&fit=crop' },
    { name: 'Leather Chukka', desc: 'Premium leather finish with a smart thin dress sole for smart-casual events.', tag: 'Dress Casual', img: 'https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=600&q=80&fit=crop' }
  ],
  'Wing Tip': [
    { name: 'Brogue Wingtip', desc: 'Full wingtip broguing with decorative toe medallion — high personality.', tag: 'Bestseller', img: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&q=80&fit=crop' },
    { name: 'Longwing Brogue', desc: 'Classic American styling where the wingtip seam extends fully to the heel.', tag: 'Heritage', img: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=600&q=80&fit=crop' }
  ],
  Mule: [
    { name: 'Leather Mule Slipper', desc: 'Backless slip-on leather slide with low stacked heel — effortless luxury.', tag: 'New Arrival', img: 'https://images.unsplash.com/photo-1603191659812-ee978eeeef76?w=600&q=80&fit=crop' },
    { name: 'Suede Venetian Mule', desc: 'Ultra-soft backless venetian suede slide for high comfort.', tag: 'Casual Luxury', img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=600&q=80&fit=crop' }
  ],
  Mojaris: [
    { name: 'Pointed Sherwani Mojari', desc: 'Traditional pointed mojari with curled front tip for weddings and ceremonies.', tag: 'Ceremonial', img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop' },
    { name: 'Velvet Embroidered Mojari', desc: 'Rich velvet upper with detailed zardozi hand embroidery.', tag: 'Royal Collection', img: 'https://images.unsplash.com/photo-1610398061401-86320597d020?w=600&q=80&fit=crop' }
  ],
  Boat: [
    { name: 'Classic Boat Shoe', desc: 'Premium oiled leather with white siped rubber soles and 360-degree lacing.', tag: 'Nautical Classic', img: 'https://images.unsplash.com/photo-1562273138-f46be4ebdf33?w=600&q=80&fit=crop' },
    { name: 'Suede Deck Shoe', desc: 'Soft suede slip-on deck shoe for warm weather and sailing excursions.', tag: 'Summer Casual', img: 'https://images.unsplash.com/photo-1583264739275-656ff57a087f?w=600&q=80&fit=crop' }
  ]
};

const AdminCustomizer = () => {
  const [activeTab, setActiveTab] = useState('flow'); // 'flow' | 'catalog' | 'materials'
  const [toast, setToast] = useState('');

  // Style & Submodels state
  const [submodels, setSubmodels] = useState({});
  const [selectedModel, setSelectedModel] = useState('Oxford');
  const [showSubmodelModal, setShowSubmodelModal] = useState(false);
  const [editingSubmodelIndex, setEditingSubmodelIndex] = useState(null);
  const [submodelForm, setSubmodelForm] = useState({ name: '', desc: '', tag: '', img: '' });

  // Atelier Flow settings state (Mock/Localstorage persistence for demo and runtime control)
  const [steps, setSteps] = useState([
    { id: 'gender', label: 'Gender Choice', description: 'Step 0: Choose Men or Women cards', visible: true },
    { id: 'model', label: 'Category Model', description: 'Step 1: Choose category (e.g. Oxford, Derby)', visible: true },
    { id: 'submodel', label: 'Silhouette Submodel', description: 'Step 2: Choose distinct style silhouette', visible: true },
    { id: 'leather', label: 'Leather Selection', description: 'Step 3: Customize leather grade', visible: true },
    { id: 'color', label: 'Colorway Picker', description: 'Step 4: Choose color hex option', visible: true },
    { id: 'sole', label: 'Outsoles Selection', description: 'Step 5: Select sole type', visible: true },
    { id: 'size', label: 'Fit & Sizing', description: 'Step 6: Choose sizing parameters', visible: true },
    { id: 'summary', label: 'Summary & Monogram', description: 'Step 7: Personal monogram & place order', visible: true }
  ]);

  // Model/Silhouette Catalog State
  const [catalog, setCatalog] = useState({
    men: [
      { name: 'Oxford', desc: 'Classic closed-lacing elegance', img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&q=80&fit=crop' },
      { name: 'Derby', desc: 'Open-lacing versatility', img: 'https://images.unsplash.com/photo-1616696038562-574c18066055?w=500&q=80&fit=crop' },
      { name: 'Loafer', desc: 'Slip-on sophistication', img: 'https://images.pexels.com/photos/29258015/pexels-photo-29258015.jpeg?auto=compress&cs=tinysrgb&w=500' }
    ],
    women: [
      { name: 'Ballerina', desc: 'Graceful flat elegance', img: 'https://images.unsplash.com/photo-1774802536876-88b0e1ca7453?w=500&q=80&fit=crop' },
      { name: 'Boots', desc: 'Sculpted ankle silhouette', img: 'https://images.unsplash.com/photo-1720603989488-1f3d16b7be9d?w=500&q=80&fit=crop' }
    ]
  });

  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingCatalogGender, setEditingCatalogGender] = useState('men');
  const [editingCatalogIndex, setEditingCatalogIndex] = useState(null);
  const [catalogForm, setCatalogForm] = useState({ name: '', desc: '', img: '' });

  // CDN Assets / Swatches State
  const [assets, setAssets] = useState([]);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subTab, setSubTab] = useState('swatches'); // 'swatches' | 'rules'

  const [assetForm, setAssetForm] = useState({
    name: '',
    region: 'leather',
    type: 'material',
    color_hex: '',
    price_modifier: 0,
    available: true
  });
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');

  // Rules Engine State
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    condition_field: 'material',
    condition_value: '',
    action: 'add_price',
    action_value: 0,
    active: true,
    priority: 0,
    conditions: [],
    logical_operator: 'AND',
    description: ''
  });

  const conditionFields = ['material', 'style', 'sole_type', 'construction', 'color', 'category', 'gender'];

  useEffect(() => {
    // Load persisted flow settings if any
    const savedSteps = localStorage.getItem('byond_customizer_steps');
    if (savedSteps) {
      try { setSteps(JSON.parse(savedSteps)); } catch (e) {}
    }
    const savedCatalog = localStorage.getItem('byond_customizer_catalog');
    if (savedCatalog) {
      try { setCatalog(JSON.parse(savedCatalog)); } catch (e) {}
    }
    const savedSubmodels = localStorage.getItem('byond_customizer_submodels');
    if (savedSubmodels) {
      try { setSubmodels(JSON.parse(savedSubmodels)); } catch (e) {}
    } else {
      setSubmodels(defaultSubmodels);
      localStorage.setItem('byond_customizer_submodels', JSON.stringify(defaultSubmodels));
    }

    fetchAssets();
    fetchRules();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // 1. Atelier Flow Handlers
  const handleToggleStep = (index) => {
    const updated = [...steps];
    updated[index].visible = !updated[index].visible;
    setSteps(updated);
    localStorage.setItem('byond_customizer_steps', JSON.stringify(updated));
    showToast(`✨ Flow step visibility updated for ${updated[index].label}`);
  };

  const handleMoveStep = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...steps];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSteps(updated);
    localStorage.setItem('byond_customizer_steps', JSON.stringify(updated));
    showToast(`✨ Stepper sequence updated successfully!`);
  };

  // 2. Model Catalog Handlers
  const handleOpenCatalogModal = (gender, index = null) => {
    setEditingCatalogGender(gender);
    setEditingCatalogIndex(index);
    if (index !== null) {
      setCatalogForm(catalog[gender][index]);
    } else {
      setCatalogForm({ name: '', desc: '', img: '' });
    }
    setShowCatalogModal(true);
  };

  const handleSaveCatalogItem = (e) => {
    e.preventDefault();
    if (!catalogForm.name.trim()) return showToast('⚠️ Please enter a model name.');

    const updatedCatalog = { ...catalog };
    if (editingCatalogIndex !== null) {
      updatedCatalog[editingCatalogGender][editingCatalogIndex] = catalogForm;
    } else {
      updatedCatalog[editingCatalogGender].push(catalogForm);
    }
    setCatalog(updatedCatalog);
    localStorage.setItem('byond_customizer_catalog', JSON.stringify(updatedCatalog));
    setShowCatalogModal(false);
    showToast('✨ Model Catalog updated successfully!');
  };

  const handleDeleteCatalogItem = (gender, index) => {
    if (!confirm('Are you sure you want to delete this catalog model?')) return;
    const updatedCatalog = { ...catalog };
    updatedCatalog[gender].splice(index, 1);
    setCatalog(updatedCatalog);
    localStorage.setItem('byond_customizer_catalog', JSON.stringify(updatedCatalog));
    showToast('🗑️ Model deleted from catalog.');
  };

  // 2b. Style & Submodels Handlers
  const handleOpenSubmodelModal = (index = null) => {
    setEditingSubmodelIndex(index);
    if (index !== null) {
      setSubmodelForm(submodels[selectedModel][index]);
    } else {
      setSubmodelForm({ name: '', desc: '', tag: '', img: '' });
    }
    setShowSubmodelModal(true);
  };

  const handleSaveSubmodel = (e) => {
    e.preventDefault();
    if (!submodelForm.name.trim()) return showToast('⚠️ Please enter a submodel name.');

    const updated = { ...submodels };
    if (!updated[selectedModel]) {
      updated[selectedModel] = [];
    }

    if (editingSubmodelIndex !== null) {
      updated[selectedModel][editingSubmodelIndex] = submodelForm;
    } else {
      updated[selectedModel].push(submodelForm);
    }

    setSubmodels(updated);
    localStorage.setItem('byond_customizer_submodels', JSON.stringify(updated));
    setShowSubmodelModal(false);
    showToast('✨ Style & Submodels updated successfully!');
  };

  const handleDeleteSubmodel = (index) => {
    if (!confirm('Are you sure you want to delete this submodel variant?')) return;
    const updated = { ...submodels };
    updated[selectedModel].splice(index, 1);
    setSubmodels(updated);
    localStorage.setItem('byond_customizer_submodels', JSON.stringify(updated));
    showToast('🗑️ Submodel variant deleted.');
  };

  // 3. CDN Assets Handlers
  const fetchAssets = async () => {
    try {
      const res = await api.request('/assets');
      setAssets(res.assets || []);
    } catch (err) {
      console.error('Failed to fetch assets:', err);
      showToast('❌ Failed to retrieve customizer swatches.');
    } finally {
      setAssetsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFilePreview(URL.createObjectURL(selected));
    }
  };

  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    if (!assetForm.name.trim()) return showToast('⚠️ Please enter an asset name.');
    
    setActionLoading(true);
    try {
      let finalUrl = '';
      if (file) {
        const uploadRes = await api.uploadImage(file);
        const uploadedUrl = uploadRes.url;
        const filename = uploadRes.filename;
        const backendBase = uploadedUrl.split('/api/uploads/')[0];
        finalUrl = `${backendBase}/api/assets/cdn/${filename}`;
      } else if (assetForm.type === 'color' && assetForm.color_hex) {
        finalUrl = '';
      } else {
        throw new Error('Please choose a swatch/texture file to upload.');
      }

      await api.request('/assets', {
        method: 'POST',
        body: JSON.stringify({
          name: assetForm.name,
          region: assetForm.region,
          type: assetForm.type,
          image_url: finalUrl,
          color_hex: assetForm.color_hex || null,
          price_modifier: Number(assetForm.price_modifier),
          available: assetForm.available
        })
      });

      showToast('✨ Customizer asset added to CDN registry!');
      setAssetForm({
        name: '',
        region: 'leather',
        type: 'material',
        color_hex: '',
        price_modifier: 0,
        available: true
      });
      setFile(null);
      setFilePreview('');
      fetchAssets();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAssetAvailability = async (asset) => {
    try {
      await api.request(`/assets/${asset.id}`, {
        method: 'PUT',
        body: JSON.stringify({ available: !asset.available })
      });
      showToast(`✨ Availability updated for ${asset.name}`);
      fetchAssets();
    } catch (err) {
      showToast(`❌ Failed: ${err.message}`);
    }
  };

  const handleAssetDelete = async (assetId) => {
    if (!confirm('Are you sure you want to delete this customizer asset?')) return;
    setActionLoading(true);
    try {
      await api.request(`/assets/${assetId}`, { method: 'DELETE' });
      showToast('🗑️ Asset deleted successfully.');
      fetchAssets();
    } catch (err) {
      showToast(`❌ Failed to delete asset: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Rules Engine Handlers
  const fetchRules = async () => {
    try {
      const res = await api.request('/rules');
      setRules(res.rules || []);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setRulesLoading(false);
    }
  };

  const handleRuleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingRuleId) {
        await api.request(`/rules/${editingRuleId}`, {
          method: 'PUT',
          body: JSON.stringify(ruleForm)
        });
        showToast('✨ Pricing rule updated successfully!');
      } else {
        await api.request('/rules', {
          method: 'POST',
          body: JSON.stringify(ruleForm)
        });
        showToast('✨ Pricing rule created successfully!');
      }
      setShowRuleForm(false);
      setEditingRuleId(null);
      setRuleForm({
        name: '',
        condition_field: 'material',
        condition_value: '',
        action: 'add_price',
        action_value: 0,
        active: true,
        priority: 0,
        conditions: [],
        logical_operator: 'AND',
        description: ''
      });
      fetchRules();
    } catch (err) {
      showToast(`❌ Failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRuleEdit = (rule) => {
    setRuleForm({
      name: rule.name,
      condition_field: rule.condition_field,
      condition_value: rule.condition_value,
      action: rule.action,
      action_value: rule.action_value,
      active: rule.active,
      priority: rule.priority || 0,
      conditions: rule.conditions || [],
      logical_operator: rule.logical_operator || 'AND',
      description: rule.description || ''
    });
    setEditingRuleId(rule.id);
    setShowRuleForm(true);
  };

  const handleToggleRuleActive = async (rule) => {
    try {
      await api.request(`/rules/${rule.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !rule.active })
      });
      showToast(`✨ Rule status updated for ${rule.name}`);
      fetchRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRuleDelete = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this pricing rule?')) return;
    try {
      await api.request(`/rules/${ruleId}`, { method: 'DELETE' });
      showToast('🗑️ Pricing rule deleted.');
      fetchRules();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '24px 32px', color: '#1c1917', minHeight: '85vh', background: '#fff' }}>
      
      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', background: '#111', border: '1px solid #C9A84C', borderRadius: '8px', padding: '12px 24px', color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1100, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <Settings size={16} color="#C9A84C" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ borderBottom: '1px solid #e7e5e4', paddingBottom: '20px', marginBottom: '24px' }}>
        <span style={{ fontSize: '0.62rem', color: '#C9A84C', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>BESPOKE ATELIER</span>
        <h1 style={{ margin: '4px 0 0 0', fontFamily: 'Montserrat, sans-serif', fontSize: '1.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sliders size={28} color="#C9A84C" /> Customizer Configuration Suite
        </h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#78716c' }}>
          Take full command of the bespoke customization landing, steps visibility, models catalog, and CDN swatches pricing rules.
        </p>
      </div>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid #f3f4f6', marginBottom: '32px', paddingBottom: '1px' }}>
        {[
          { id: 'flow', label: 'Atelier Step Flow', icon: <Sliders size={16} /> },
          { id: 'catalog', label: 'Model & Silhouette Catalog', icon: <Layout size={16} /> },
          { id: 'submodels', label: 'Style & Submodels', icon: <Layers size={16} /> },
          { id: 'materials', label: 'Material Swatches & Pricing', icon: <Briefcase size={16} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #C9A84C' : '2px solid transparent',
              color: activeTab === tab.id ? '#C9A84C' : '#78716c',
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content 1: Atelier Flow Settings */}
      {activeTab === 'flow' && (
        <div style={{ maxWidth: '800px' }}>
          <div style={{ background: '#FAF9F6', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#1c1917', fontWeight: 600 }}>Customizer Step Sequencer</h3>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#78716c', lineHeight: 1.5 }}>
              Toggle visibility of customizer steps to streamline user paths, or re-order steps. Visibility changes are cached locally and immediately reflected on the storefront configurator.
            </p>
          </div>

          <div style={{ border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden' }}>
            {steps.map((s, idx) => (
              <div 
                key={s.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '16px 24px', 
                  background: s.visible ? '#fff' : '#f9fafb',
                  borderBottom: idx === steps.length - 1 ? 'none' : '1px solid #e7e5e4',
                  opacity: s.visible ? 1 : 0.65
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#C9A84C', width: '24px' }}>{idx + 1}.</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{s.label}</h4>
                    <span style={{ fontSize: '0.7rem', color: '#78716c' }}>{s.description}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {/* Visibility toggle button */}
                  <button
                    onClick={() => handleToggleStep(idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: s.visible ? '#059669' : '#78716c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {s.visible ? (
                      <><Eye size={16} /> Visible</>
                    ) : (
                      <><EyeOff size={16} /> Hidden</>
                    )}
                  </button>

                  {/* Ordering arrows */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => handleMoveStep(idx, 'up')}
                      disabled={idx === 0}
                      style={{ padding: '6px 8px', border: '1px solid #e7e5e4', background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', borderRadius: '4px', fontSize: '0.65rem' }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleMoveStep(idx, 'down')}
                      disabled={idx === steps.length - 1}
                      style={{ padding: '6px 8px', border: '1px solid #e7e5e4', background: '#fff', cursor: idx === steps.length - 1 ? 'not-allowed' : 'pointer', borderRadius: '4px', fontSize: '0.65rem' }}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab content 2: Model & Silhouette Catalog */}
      {activeTab === 'catalog' && (
        <div>
          {['men', 'women'].map(gender => (
            <div key={gender} style={{ marginBottom: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e7e5e4', paddingBottom: '8px', marginBottom: '20px' }}>
                <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.9rem', color: '#C9A84C' }}>
                  {gender === 'men' ? "Men's Silhouette Categories" : "Women's Silhouette Categories"}
                </h3>
                <button
                  onClick={() => handleOpenCatalogModal(gender)}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} /> Add Category
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {catalog[gender].map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: '#fff',
                      border: '1px solid #e7e5e4',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div style={{ height: '140px', background: '#F9FAFB', overflow: 'hidden' }}>
                      <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700 }}>{item.name}</h4>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#78716c', lineHeight: 1.4 }}>{item.desc}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                        <button
                          onClick={() => handleOpenCatalogModal(gender, idx)}
                          style={{ flex: 1, padding: '6px', fontSize: '0.7rem', background: 'none', border: '1px solid #d1d5db', color: '#4b5563', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Edit2 size={12} /> Edit Details
                        </button>
                        <button
                          onClick={() => handleDeleteCatalogItem(gender, idx)}
                          style={{ padding: '6px 10px', background: 'none', border: '1px solid #f3f4f6', color: '#dc2626', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab content 2.5: Style & Submodels */}
      {activeTab === 'submodels' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e7e5e4', paddingBottom: '12px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase' }}>Select Category Model:</span>
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.85rem', color: '#1F2937', background: '#fff', fontWeight: 600 }}
              >
                {Object.keys(submodels).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => handleOpenSubmodelModal()}
              style={{
                padding: '8px 14px',
                fontSize: '0.75rem',
                background: '#111',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Plus size={14} /> Add Style Variant
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {(submodels[selectedModel] || []).map((item, idx) => (
              <div
                key={idx}
                style={{
                  background: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.01)',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ height: '140px', background: '#F9FAFB', overflow: 'hidden', position: 'relative' }}>
                  <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {item.tag && (
                    <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#C9A84C', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.tag}
                    </span>
                  )}
                </div>
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700 }}>{item.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#78716c', lineHeight: 1.4 }}>{item.desc}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #f3f4f6', paddingTop: '12px' }}>
                    <button
                      onClick={() => handleOpenSubmodelModal(idx)}
                      style={{ flex: 1, padding: '6px', fontSize: '0.7rem', background: 'none', border: '1px solid #d1d5db', color: '#4b5563', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      <Edit2 size={12} /> Edit Details
                    </button>
                    <button
                      onClick={() => handleDeleteSubmodel(idx)}
                      style={{ padding: '6px 10px', background: 'none', border: '1px solid #f3f4f6', color: '#dc2626', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {(submodels[selectedModel] || []).length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', border: '1px dashed #d1d5db', borderRadius: '12px', color: '#78716c', fontSize: '0.85rem' }}>
                No style variants defined for {selectedModel}. Click "Add Style Variant" to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab content 3: Material Swatches & Rules */}
      {activeTab === 'materials' && (
        <div>
          {/* Sub Tab Switcher */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <button
              onClick={() => setSubTab('swatches')}
              style={{
                padding: '8px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '20px',
                border: 'none',
                background: subTab === 'swatches' ? '#111' : '#f3f4f6',
                color: subTab === 'swatches' ? '#fff' : '#4b5563',
                cursor: 'pointer'
              }}
            >
              Material Swatches CDN Manager
            </button>
            <button
              onClick={() => setSubTab('rules')}
              style={{
                padding: '8px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '20px',
                border: 'none',
                background: subTab === 'rules' ? '#111' : '#f3f4f6',
                color: subTab === 'rules' ? '#fff' : '#4b5563',
                cursor: 'pointer'
              }}
            >
              Pricing Rules Engine
            </button>
          </div>

          {/* Sub tab A: Swatches Manager */}
          {subTab === 'swatches' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '32px', alignItems: 'start' }}>
              {/* Form Upload */}
              <div style={{ background: '#FAF9F6', border: '1px solid #C9A84C', borderRadius: '12px', padding: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '0.85rem', fontWeight: 700, color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px dashed rgba(201,168,76,0.3)', paddingBottom: '8px' }}>
                  📥 Register Swatch to CDN
                </h3>
                <form onSubmit={handleAssetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Swatch Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Gilded Cork Suede" 
                      value={assetForm.name}
                      onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Customizer Region</label>
                      <select 
                        value={assetForm.region}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, region: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937', background: '#fff' }}
                      >
                        <option value="leather">Leather Upper</option>
                        <option value="sole">Outsole</option>
                        <option value="heel">Heel Block</option>
                        <option value="lining">Lining</option>
                        <option value="laces">Laces</option>
                        <option value="vamp">Vamp/Toe</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Asset Category</label>
                      <select 
                        value={assetForm.type}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, type: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937', background: '#fff' }}
                      >
                        <option value="material">Texture/Material</option>
                        <option value="color">Solid Color</option>
                        <option value="texture">Detailed Shader</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Color Hex (Optional)</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          placeholder="#C9A84C" 
                          value={assetForm.color_hex}
                          onChange={(e) => setAssetForm(prev => ({ ...prev, color_hex: e.target.value }))}
                          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937', fontFamily: 'monospace' }}
                        />
                        {assetForm.color_hex && (
                          <div style={{ width: '38px', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db', background: assetForm.color_hex }} />
                        )}
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Price Modifier (INR)</label>
                      <input 
                        type="number" 
                        placeholder="0" 
                        value={assetForm.price_modifier}
                        onChange={(e) => setAssetForm(prev => ({ ...prev, price_modifier: e.target.value }))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', color: '#1F2937' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Texture Swatch Image File</label>
                    <div style={{ border: '2px dashed #C9A84C', borderRadius: '8px', background: '#fff', padding: '20px', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      {filePreview ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <img src={filePreview} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #C9A84C' }} />
                          <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600 }}>✓ {file.name.slice(0, 16)}...</span>
                        </div>
                      ) : (
                        <div style={{ color: '#6b7280' }}>
                          <Upload size={24} color="#C9A84C" style={{ margin: '0 auto 8px' }} />
                          <span style={{ fontSize: '0.72rem', display: 'block', fontWeight: 600 }}>Drag or Click to Upload</span>
                          <span style={{ fontSize: '0.62rem', display: 'block', marginTop: '2px' }}>JPEG, PNG, WEBP</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#111',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={16} />} Upload to CDN
                  </button>
                </form>
              </div>

              {/* Swatches Grid */}
              <div>
                {assetsLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#78716c' }}>Loading CDN assets...</div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                    {assets.map(asset => (
                      <div
                        key={asset.id}
                        style={{
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          opacity: asset.available ? 1 : 0.6
                        }}
                      >
                        <div style={{ height: '110px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'relative' }}>
                          {asset.image_url ? (
                            <img src={asset.image_url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: asset.color_hex || '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.8)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{asset.color_hex}</span>
                            </div>
                          )}
                          <div style={{ position: 'absolute', top: '6px', left: '6px', background: asset.available ? '#059669' : '#4b5563', color: '#fff', fontSize: '0.55rem', padding: '2px 6px', borderRadius: '3px', fontWeight: 800 }}>
                            {asset.available ? 'Active' : 'Disabled'}
                          </div>
                          <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.7)', color: '#C9A84C', fontSize: '0.55rem', padding: '2px 6px', borderRadius: '3px', textTransform: 'uppercase' }}>
                            {asset.region}
                          </div>
                        </div>
                        <div style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '6px', marginBottom: '8px' }}>
                            <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>{asset.name}</h4>
                            <span style={{ fontSize: '0.7rem', color: '#C9A84C', fontWeight: 700 }}>
                              {asset.price_modifier > 0 ? `+₹${asset.price_modifier}` : 'Free'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid #f3f4f6', paddingTop: '8px', marginTop: '12px' }}>
                            <button
                              onClick={() => handleToggleAssetAvailability(asset)}
                              style={{ flex: 1, padding: '4px', fontSize: '0.65rem', background: 'none', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              {asset.available ? 'Disable' : 'Enable'}
                            </button>
                            <button
                              onClick={() => handleAssetDelete(asset.id)}
                              style={{ padding: '4px 8px', background: 'none', border: '1px solid #f3f4f6', color: '#dc2626', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub tab B: Pricing Rules Engine */}
          {subTab === 'rules' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>Active Customizer Pricing Rules</h3>
                <button
                  onClick={() => { setShowRuleForm(true); setEditingRuleId(null); setRuleForm({ name: '', condition_field: 'material', condition_value: '', action: 'add_price', action_value: 0, active: true, priority: 0, conditions: [], logical_operator: 'AND', description: '' }); }}
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.75rem',
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Plus size={14} /> Add Rule
                </button>
              </div>

              {rulesLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#78716c' }}>Loading rules...</div>
              ) : (
                <div style={{ border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e7e5e4' }}>
                        <th style={{ padding: '12px 20px' }}>Rule Name</th>
                        <th style={{ padding: '12px 20px' }}>Condition</th>
                        <th style={{ padding: '12px 20px' }}>Action</th>
                        <th style={{ padding: '12px 20px' }}>Amount</th>
                        <th style={{ padding: '12px 20px' }}>Priority</th>
                        <th style={{ padding: '12px 20px' }}>Status</th>
                        <th style={{ padding: '12px 20px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map(rule => (
                        <tr key={rule.id} style={{ borderBottom: '1px solid #e7e5e4', opacity: rule.active ? 1 : 0.65 }}>
                          <td style={{ padding: '12px 20px' }}>
                            <strong>{rule.name}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#78716c' }}>{rule.description}</div>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            {rule.conditions && rule.conditions.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.6rem', color: '#C9A84C', fontWeight: 700 }}>MATCH {rule.logical_operator}</span>
                                {rule.conditions.map((c, idx) => (
                                  <span key={idx} style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px', fontSize: '0.65rem' }}>
                                    If {c.field} {c.operator === 'not_equals' ? '!=' : '='} "{c.value}"
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px', fontSize: '0.65rem' }}>If {rule.condition_field} = "{rule.condition_value}"</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 20px' }}>{rule.action === 'add_price' ? 'Add Price' : 'Multiply'}</td>
                          <td style={{ padding: '12px 20px', color: '#C9A84C', fontWeight: 700 }}>
                            {rule.action === 'add_price' ? `+₹${rule.action_value}` : `+${rule.action_value}%`}
                          </td>
                          <td style={{ padding: '12px 20px' }}>{rule.priority}</td>
                          <td style={{ padding: '12px 20px' }}>
                            <button
                              onClick={() => handleToggleRuleActive(rule)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: rule.active ? '#059669' : '#78716c' }}
                            >
                              {rule.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                            </button>
                          </td>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => handleRuleEdit(rule)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563' }}><Edit2 size={14} /></button>
                              <button onClick={() => handleRuleDelete(rule.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Catalog Modal */}
      {showCatalogModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', position: 'relative' }}>
            <button onClick={() => setShowCatalogModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>{editingCatalogIndex !== null ? 'Edit Model' : 'Add Model to Catalog'}</h3>
            
            <form onSubmit={handleSaveCatalogItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Model Name</label>
                <input 
                  type="text" 
                  value={catalogForm.name} 
                  onChange={e => setCatalogForm({ ...catalogForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="e.g. Oxford"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Description</label>
                <textarea 
                  value={catalogForm.desc} 
                  onChange={e => setCatalogForm({ ...catalogForm, desc: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="Enter design details"
                  rows={3}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Image URL</label>
                <input 
                  type="text" 
                  value={catalogForm.img} 
                  onChange={e => setCatalogForm({ ...catalogForm, img: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="Paste picture URL"
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer' }}>
                Save Model Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRuleForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '560px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowRuleForm(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}><X size={20} /></button>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: 600 }}>{editingRuleId ? 'Edit Pricing Rule' : 'Add Pricing Rule'}</h3>
            
            <form onSubmit={handleRuleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Rule Name *</label>
                <input 
                  type="text" 
                  value={ruleForm.name} 
                  onChange={e => setRuleForm({ ...ruleForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="e.g. Cordovan Premium Grade"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Condition Attribute</label>
                  <select 
                    value={ruleForm.condition_field}
                    onChange={e => setRuleForm({ ...ruleForm, condition_field: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', background: '#fff' }}
                  >
                    {conditionFields.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Matching Value</label>
                  <input 
                    type="text" 
                    value={ruleForm.condition_value} 
                    onChange={e => setRuleForm({ ...ruleForm, condition_value: e.target.value })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                    placeholder="e.g. Cordovan"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Action</label>
                  <select 
                    value={ruleForm.action}
                    onChange={e => setRuleForm({ ...ruleForm, action: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem', background: '#fff' }}
                  >
                    <option value="add_price">Add to Price (₹)</option>
                    <option value="multiply_price">Multiply (%)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Value Amount</label>
                  <input 
                    type="number" 
                    value={ruleForm.action_value} 
                    onChange={e => setRuleForm({ ...ruleForm, action_value: parseInt(e.target.value) || 0 })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Priority Order</label>
                  <input 
                    type="number" 
                    value={ruleForm.priority} 
                    onChange={e => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) || 0 })} 
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Rule Description</label>
                <textarea 
                  value={ruleForm.description} 
                  onChange={e => setRuleForm({ ...ruleForm, description: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="Explain when this pricing modifier is applied"
                  rows={2}
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer' }}>
                {editingRuleId ? 'Update Rule' : 'Create Pricing Rule'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Submodel Modal */}
      {showSubmodelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', position: 'relative' }}>
            <button onClick={() => setShowSubmodelModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600 }}>{editingSubmodelIndex !== null ? 'Edit Style Variant' : `Add Style Variant to ${selectedModel}`}</h3>
            
            <form onSubmit={handleSaveSubmodel} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Variant Name *</label>
                <input 
                  type="text" 
                  value={submodelForm.name} 
                  onChange={e => setSubmodelForm({ ...submodelForm, name: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="e.g. Cap Toe Oxford"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Badge Tag (Optional)</label>
                <input 
                  type="text" 
                  value={submodelForm.tag} 
                  onChange={e => setSubmodelForm({ ...submodelForm, tag: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="e.g. Bestseller, Most Classic"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Description</label>
                <textarea 
                  value={submodelForm.desc} 
                  onChange={e => setSubmodelForm({ ...submodelForm, desc: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="Enter design details"
                  rows={3}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', marginBottom: '6px' }}>Image URL</label>
                <input 
                  type="text" 
                  value={submodelForm.img} 
                  onChange={e => setSubmodelForm({ ...submodelForm, img: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.8rem' }}
                  placeholder="Paste picture URL"
                />
              </div>

              <button type="submit" style={{ width: '100%', padding: '12px', background: '#111', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', cursor: 'pointer' }}>
                Save Style Variant
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCustomizer;
