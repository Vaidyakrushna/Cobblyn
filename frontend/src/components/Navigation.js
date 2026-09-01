"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Search, User, Heart, ShoppingBag, ChevronDown, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';
import SearchOverlay from './SearchOverlay';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const defaultNavItems = [
  {
    title: 'Men',
    nav_type: 'mega_menu',
    href: '/men',
    columns: [
      {
        title: 'Style',
        links: [
          { label: 'Oxford', href: '/men/style/oxford' },
          { label: 'Loafer', href: '/men/style/loafer' },
          { label: 'Monk Strap', href: '/men/style/monk-strap' },
          { label: 'Desert Boot/Chukka Boots', href: '/men/style/desert-boot' },
          { label: 'Derby', href: '/men/style/derby' },
          { label: 'Jutis', href: '/men/style/jutis' },
          { label: 'Mojaris', href: '/men/style/mojaris' },
          { label: 'Boat', href: '/men/style/boat' },
        ]
      },
      {
        title: 'Occasion',
        links: [
          { label: 'Office', href: '/men/occasion/office' },
          { label: 'Casual', href: '/men/occasion/casual' },
          { label: 'Daily Wear', href: '/men/occasion/daily-wear' },
          { label: 'Party', href: '/men/occasion/party' },
          { label: 'Wedding', href: '/men/occasion/wedding' },
          { label: 'Travel', href: '/men/occasion/travel' },
        ]
      },
      {
        title: 'Explore',
        links: [
          { label: 'Ready to ship', href: '/men?tag=ready-to-ship' },
          { label: 'Schedule Visit', href: '/bespoke' },
          { label: 'Customisation', href: '/customize/men' },
        ]
      }
    ],
    featured_card: {
      enabled: true,
      image_url: '/wf-nav-men.png',
      badge_text: 'New Arrival',
      title: 'Classic Oxfords',
      cta_text: 'Shop Now →',
      link_url: '/men'
    }
  },
  {
    title: 'Women',
    nav_type: 'mega_menu',
    href: '/women',
    columns: [
      {
        title: 'Style',
        links: [
          { label: 'Ballerina', href: '/women/style/ballerina' },
          { label: 'Boots', href: '/women/style/boots' },
          { label: 'Loafers', href: '/women/style/loafers' },
          { label: 'Jutis', href: '/women/style/jutis' },
          { label: 'Peep Toes', href: '/women/style/peep-toes' },
        ]
      },
      {
        title: 'Occasion',
        links: [
          { label: 'Office', href: '/women/occasion/office' },
          { label: 'Casual', href: '/women/occasion/casual' },
          { label: 'Daily Wear', href: '/women/occasion/daily-wear' },
          { label: 'Party', href: '/women/occasion/party' },
          { label: 'Wedding', href: '/women/occasion/wedding' },
          { label: 'Travel', href: '/women/occasion/travel' },
        ]
      },
      {
        title: 'Explore',
        links: [
          { label: 'Ready to ship', href: '/women?tag=ready-to-ship' },
          { label: 'Schedule Visit', href: '/bespoke' },
          { label: 'Customisation', href: '/customize/women' },
        ]
      }
    ],
    featured_card: {
      enabled: true,
      image_url: '/wf-nav-women.png',
      badge_text: 'Trending',
      title: 'Evening Heels',
      cta_text: 'Shop Evening →',
      link_url: '/women'
    }
  },
  {
    title: 'Customize',
    nav_type: 'direct_link',
    href: '/customize'
  },
  {
    title: 'Luxe Collection',
    nav_type: 'direct_link',
    href: '/luxe-collection'
  },
  {
    title: 'Accessories',
    nav_type: 'dropdown',
    href: '/accessories',
    columns: [
      {
        title: 'Categories',
        links: [
          { label: 'View All', href: '/accessories', is_highlighted: true },
          { label: 'Belts', href: '/accessories/belts' },
          { label: 'Socks', href: '/accessories/socks' },
          { label: 'Wallets & Card Holders', href: '/accessories/wallets' },
          { label: 'Lace', href: '/accessories/lace' },
          { label: 'Key Rings', href: '/accessories/key-rings' },
          { label: 'Travel Kit', href: '/accessories/travel-kit' },
          { label: 'Shoe Care', href: '/accessories/shoe-care' },
        ]
      }
    ],
    featured_card: {
      enabled: true,
      image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80&fit=crop',
      badge_text: 'New In',
      title: 'Premium Accessories',
      cta_text: 'Explore →',
      link_url: '/accessories'
    }
  }
];

const Navigation = () => {
  const [navItems, setNavItems] = useState(defaultNavItems);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const userMenuRef = useRef(null);

  // Fetch dynamic navigation items from API
  useEffect(() => {
    api.request('/navigation')
      .then(res => {
        if (res && res.items && res.items.length > 0) {
          setNavItems(res.items);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch counts
  useEffect(() => {
    if (isAuthenticated) {
      api.getWishlist().then(data => setWishlistCount((data.items || []).length)).catch(() => {});
      api.getCart().then(data => setCartCount((data.items || []).reduce((s, i) => s + i.quantity, 0))).catch(() => {});
    } else {
      setWishlistCount(0);
      setCartCount(0);
    }
  }, [isAuthenticated]);

  // Listen for cart/wishlist updates
  useEffect(() => {
    const handler = () => {
      if (isAuthenticated) {
        api.getWishlist().then(data => setWishlistCount((data.items || []).length)).catch(() => {});
        api.getCart().then(data => setCartCount((data.items || []).reduce((s, i) => s + i.quantity, 0))).catch(() => {});
      }
    };
    window.addEventListener('cobblyn-cart-update', handler);
    window.addEventListener('cobblyn-wishlist-update', handler);
    return () => {
      window.removeEventListener('cobblyn-cart-update', handler);
      window.removeEventListener('cobblyn-wishlist-update', handler);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push('/');
  };

  // Close user menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="main-nav" data-testid="main-navigation">
        <div className="nav-logo">
          <Link href="/" data-testid="logo-link">C<span className="text-accent">O</span>BBLYN</Link>
        </div>

        <ul className="nav-links nav-links-left">
          {navItems.map((item, idx) => {
            const itemKey = item.id || item.title || idx;
            const testIdSlug = (item.title || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-');

            if (item.nav_type === 'direct_link') {
              return (
                <li key={itemKey}>
                  <Link href={item.href || '/'} data-testid={`nav-link-${testIdSlug}`}>
                    {item.title}
                    {item.badge && (
                      <span style={{ fontSize: '0.6rem', marginLeft: '5px', background: 'var(--accent)', color: '#fff', padding: '1px 5px', borderRadius: '4px', verticalAlign: 'middle', textTransform: 'uppercase', fontWeight: 700 }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            }

            const hasDropdown = item.columns && item.columns.length > 0;
            const isDropdown = item.nav_type === 'dropdown';

            return (
              <li
                key={itemKey}
                onMouseEnter={() => setActiveDropdown(itemKey)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link href={item.href || '/'} data-testid={`nav-link-${testIdSlug}`}>
                  {item.title}
                  {item.badge && (
                    <span style={{ fontSize: '0.6rem', marginLeft: '5px', background: 'var(--accent)', color: '#fff', padding: '1px 5px', borderRadius: '4px', verticalAlign: 'middle', textTransform: 'uppercase', fontWeight: 700 }}>
                      {item.badge}
                    </span>
                  )}
                  {hasDropdown && <ChevronDown size={14} className="ml-1" />}
                </Link>

                {hasDropdown && activeDropdown === itemKey && (
                  <div
                    className={`dropdown ${isDropdown ? 'dropdown-accessories' : ''}`}
                    data-testid={`${testIdSlug}-submenu`}
                    style={isDropdown ? { minWidth: '480px', left: 'auto', right: 0, transform: 'none' } : {}}
                  >
                    <div className="dropdown-inner">
                      {(item.columns || []).map((col, cIdx) => (
                        <div key={cIdx}>
                          <div className="dropdown-title">{col.title}</div>
                          <ul className="dropdown-list">
                            {(col.links || []).map((link, lIdx) => (
                              <li key={lIdx}>
                                <Link
                                  href={link.href}
                                  style={link.is_highlighted ? { color: 'var(--accent)', fontWeight: 600 } : {}}
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {item.featured_card && item.featured_card.enabled && (
                        <div className="dd-creative" style={isDropdown ? { width: '220px' } : {}}>
                          {item.featured_card.image_url ? (
                            <img src={item.featured_card.image_url} alt={item.featured_card.title || item.title} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', background: '#1c1917' }} />
                          )}
                          <div className="dd-creative-overlay">
                            {item.featured_card.badge_text && (
                              <div className="dd-creative-label">{item.featured_card.badge_text}</div>
                            )}
                            <div className="dd-creative-title">{item.featured_card.title || item.title}</div>
                            {item.featured_card.link_url ? (
                              <Link
                                href={item.featured_card.link_url}
                                className="dd-creative-cta"
                                style={{ textDecoration: 'none', color: '#fff' }}
                              >
                                {item.featured_card.cta_text || 'Shop Now →'}
                              </Link>
                            ) : (
                              <div className="dd-creative-cta">{item.featured_card.cta_text || 'Shop Now →'}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="nav-right">
          <button className="nav-icon-btn" onClick={() => setSearchOpen(true)} data-testid="search-button">
            <Search size={18} />
          </button>
          <Link href="/wishlist" className="nav-icon-btn-link" data-testid="nav-wishlist-link">
            <Heart size={18} fill={wishlistCount > 0 ? '#9d2706' : 'none'} color={wishlistCount > 0 ? '#9d2706' : 'currentColor'} />
          </Link>
          {isAuthenticated ? (
            <div className="nav-user-menu" ref={userMenuRef}>
              <button className="btn-login" onClick={() => setUserMenuOpen(!userMenuOpen)} data-testid="user-menu-button">
                <User size={16} /><span>{user?.name?.split(' ')[0] || 'Account'}</span>
                <ChevronDown size={12} />
              </button>
              {userMenuOpen && (
                <div className="user-dropdown-menu" data-testid="user-dropdown-menu">
                  <Link href="/account" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)} data-testid="my-account-link">
                    <UserCircle size={16} /> My Account
                  </Link>
                  {['admin', 'super_admin', 'staff', 'factory_worker'].includes(user?.role) && (
                    <Link href="/admin" className="user-dropdown-item" onClick={() => setUserMenuOpen(false)} data-testid="admin-dashboard-link">
                      <LayoutDashboard size={16} /> {user?.role === 'factory_worker' ? 'Factory Dashboard' : 'Admin Dashboard'}
                    </Link>
                  )}
                  <button className="user-dropdown-item user-dropdown-logout" onClick={handleLogout} data-testid="logout-button">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="btn-login" data-testid="login-button">
              <User size={16} /><span>Login</span>
            </Link>
          )}
          <Link href="/cart" className="btn-cart" data-testid="cart-button">
            <ShoppingBag size={16} />
            <span>Bag</span>
            {cartCount > 0 && <span className="cart-badge" data-testid="cart-badge">{cartCount}</span>}
          </Link>
        </div>
      </nav>

      <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default Navigation;
