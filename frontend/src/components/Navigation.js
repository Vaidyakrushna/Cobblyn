"use client";
﻿import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Search, User, Heart, ShoppingBag, ChevronDown, LogOut, LayoutDashboard, UserCircle } from 'lucide-react';
import SearchOverlay from './SearchOverlay';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

const Navigation = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const router = useRouter();
  const userMenuRef = useRef(null);

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

  const menSubmenu = {
    style: [
      { label: 'Oxford', slug: 'oxford' }, { label: 'Loafer', slug: 'loafer' },
      { label: 'Monk Strap', slug: 'monk-strap' }, { label: 'Desert Boot/Chukka Boots', slug: 'desert-boot' },
      { label: 'Derby', slug: 'derby' }, { label: 'Jutis', slug: 'jutis' },
      { label: 'Mojaris', slug: 'mojaris' }, { label: 'Boat', slug: 'boat' },
    ],
    occasion: [
      { label: 'Office', slug: 'office' }, { label: 'Casual', slug: 'casual' },
      { label: 'Daily Wear', slug: 'daily-wear' }, { label: 'Party', slug: 'party' },
      { label: 'Wedding', slug: 'wedding' }, { label: 'Travel', slug: 'travel' },
    ]
  };

  const womenSubmenu = {
    style: [
      { label: 'Ballerina', slug: 'ballerina' }, { label: 'Boots', slug: 'boots' },
      { label: 'Loafers', slug: 'loafers' }, { label: 'Jutis', slug: 'jutis' },
      { label: 'Peep Toes', slug: 'peep-toes' },
    ],
    occasion: [
      { label: 'Office', slug: 'office' }, { label: 'Casual', slug: 'casual' },
      { label: 'Daily Wear', slug: 'daily-wear' }, { label: 'Party', slug: 'party' },
      { label: 'Wedding', slug: 'wedding' }, { label: 'Travel', slug: 'travel' },
    ]
  };

  const accessoriesSubmenu = [
    { label: 'View All',              href: '/accessories' },
    { label: 'Belts',                 href: '/accessories/belts' },
    { label: 'Socks',                 href: '/accessories/socks' },
    { label: 'Wallets & Card Holders',href: '/accessories/wallets' },
    { label: 'Lace',                  href: '/accessories/lace' },
    { label: 'Key Rings',             href: '/accessories/key-rings' },
    { label: 'Travel Kit',            href: '/accessories/travel-kit' },
    { label: 'Shoe Care',             href: '/accessories/shoe-care' },
  ];

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
          <Link href="/" data-testid="logo-link">BY<span className="text-accent">O</span>ND</Link>
        </div>

        <ul className="nav-links nav-links-left">
          <li onMouseEnter={() => setActiveDropdown('men')} onMouseLeave={() => setActiveDropdown(null)}>
            <Link href="/men" data-testid="nav-link-men">Men <ChevronDown size={14} className="ml-1" /></Link>
            {activeDropdown === 'men' && (
              <div className="dropdown" data-testid="men-submenu">
                <div className="dropdown-inner">
                  <div>
                    <div className="dropdown-title">Style</div>
                    <ul className="dropdown-list">{menSubmenu.style.map((item) => (<li key={item.slug}><Link href={`/men/style/${item.slug}`}>{item.label}</Link></li>))}</ul>
                  </div>
                  <div>
                    <div className="dropdown-title">Occasion</div>
                    <ul className="dropdown-list">{menSubmenu.occasion.map((item) => (<li key={item.slug}><Link href={`/men/occasion/${item.slug}`}>{item.label}</Link></li>))}</ul>
                  </div>
                  <div>
                    <div className="dropdown-title">Explore</div>
                    <ul className="dropdown-list">
                      <li><Link href="/men?tag=ready-to-ship">Ready to ship</Link></li>
                      <li><Link href="/bespoke">Schedule Visit</Link></li>
                      <li><Link href="/customize/men">Customisation</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </li>
          <li onMouseEnter={() => setActiveDropdown('women')} onMouseLeave={() => setActiveDropdown(null)}>
            <Link href="/women" data-testid="nav-link-women">Women <ChevronDown size={14} className="ml-1" /></Link>
            {activeDropdown === 'women' && (
              <div className="dropdown" data-testid="women-submenu">
                <div className="dropdown-inner">
                  <div>
                    <div className="dropdown-title">Style</div>
                    <ul className="dropdown-list">{womenSubmenu.style.map((item) => (<li key={item.slug}><Link href={`/women/style/${item.slug}`}>{item.label}</Link></li>))}</ul>
                  </div>
                  <div>
                    <div className="dropdown-title">Occasion</div>
                    <ul className="dropdown-list">{womenSubmenu.occasion.map((item) => (<li key={item.slug}><Link href={`/women/occasion/${item.slug}`}>{item.label}</Link></li>))}</ul>
                  </div>
                  <div>
                    <div className="dropdown-title">Explore</div>
                    <ul className="dropdown-list">
                      <li><Link href="/women?tag=ready-to-ship">Ready to ship</Link></li>
                      <li><Link href="/bespoke">Schedule Visit</Link></li>
                      <li><Link href="/customize/women">Customisation</Link></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </li>
          <li>
            <Link href="/customize" data-testid="nav-link-customize">Customize</Link>
          </li>
          <li><Link href="/luxe-collection" data-testid="nav-link-luxe-collection">Luxe Collection</Link></li>
          <li onMouseEnter={() => setActiveDropdown('accessories')} onMouseLeave={() => setActiveDropdown(null)}>
            <Link href="/accessories" data-testid="nav-link-accessories">Accessories <ChevronDown size={14} className="ml-1" /></Link>
            {activeDropdown === 'accessories' && (
              <div className="dropdown dropdown-accessories" data-testid="accessories-submenu">
                <div className="dropdown-inner">
                  <div>
                    <div className="dropdown-title">Categories</div>
                    <ul className="dropdown-list">
                      {accessoriesSubmenu.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href}
                            style={item.label === 'View All' ? { color: 'var(--accent)', fontWeight: 600 } : {}}
                          >{item.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </li>
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

