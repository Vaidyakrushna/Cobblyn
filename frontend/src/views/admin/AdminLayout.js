"use client";
import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import {
  LayoutDashboard, Package, Layers, Calculator, ShoppingCart, Users,
  MessageSquare, Warehouse, Factory, CalendarCheck, Image as ImageIcon,
  Tag, RotateCcw, BarChart3, Shield, ChevronRight, Briefcase, UserCog,
  FolderTree, ShoppingBag, Cpu, Star, Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_STRUCTURE = [
  { type: 'item', to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },

  { type: 'group', key: 'assets', icon: <Briefcase size={18} />, label: 'Asset Listing', items: [
    { to: '/admin/products', icon: <Package size={16} />, label: 'Products' },
    { to: '/admin/accessories', icon: <ShoppingBag size={16} />, label: 'Accessories' },
    { to: '/admin/categories', icon: <FolderTree size={16} />, label: 'Categories' },
    { to: '/admin/banners', icon: <ImageIcon size={16} />, label: 'Banners' },
    { to: '/admin/customizer', icon: <Sliders size={16} />, label: 'Customizer Studio' },
    { to: '/admin/materials', icon: <Layers size={16} />, label: 'Material Library' },
    { to: '/admin/coupons', icon: <Tag size={16} />, label: 'Coupons' },
  ]},

  { type: 'group', key: 'production', icon: <ShoppingCart size={18} />, label: 'Order Management', items: [
    { to: '/admin/production', icon: <Factory size={16} />, label: 'Production & Factory' },
    { to: '/admin/production?tab=vendors', icon: <Users size={16} />, label: 'Vendors' },
    { to: '/admin/orders', icon: <ShoppingCart size={16} />, label: 'Order' },
    { to: '/admin/inventory', icon: <Warehouse size={16} />, label: 'Inventory' },
  ]},

  { type: 'group', key: 'customers', icon: <UserCog size={18} />, label: 'Customer Profile', items: [
    { to: '/admin/customers', icon: <Users size={16} />, label: 'Customer' },
    { to: '/admin/vip', icon: <Star size={16} />, label: 'VIP Members' },
    { to: '/admin/visits', icon: <CalendarCheck size={16} />, label: 'Scheduled Visits' },
    { to: '/admin/returns', icon: <RotateCcw size={16} />, label: 'Return' },
    { to: '/admin/referrals', icon: <Users size={16} />, label: 'Referrals & Wallet' },
  ]},

  { type: 'item', to: '/admin/jobs', icon: <Cpu size={18} />, label: 'Background Tasks' },
  { type: 'item', to: '/admin/users', icon: <Shield size={18} />, label: 'Users and Roles' },
  { type: 'item', to: '/admin/audit-logs', icon: <Shield size={18} />, label: 'Security Audit Logs' },
  { type: 'item', to: '/admin/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
  { type: 'item', to: '/admin/tickets', icon: <MessageSquare size={18} />, label: 'Support' },
];

const groupForPath = (pathname) => {
  for (const node of NAV_STRUCTURE) {
    if (node.type === 'group' && node.items.some(s => pathname === s.to || pathname.startsWith(s.to + '/'))) {
      return node.key;
    }
  }
  return null;
};

const AdminSubLink = ({ sub, pathname }) => {
  const searchParams = useSearchParams();
  const isActive = sub.to.includes('?')
    ? (pathname === sub.to.split('?')[0] && searchParams.get('tab') === new URLSearchParams(sub.to.split('?')[1]).get('tab'))
    : (pathname === sub.to && !searchParams.get('tab'));
  return (
    <Link href={sub.to}
      className={`admin-nav-link admin-nav-sublink ${isActive ? 'active' : ''}`}
      data-testid={`admin-nav-${sub.label.toLowerCase().replace(/\s+/g, '-')}`}>
      {sub.icon}
      <span>{sub.label}</span>
    </Link>
  );
};

const AdminLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const pathname = usePathname() || '';
  const router = useRouter();

  const [expanded, setExpanded] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const saved = JSON.parse(localStorage.getItem('byond_admin_nav_expanded') || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch { return {}; }
  });

  useEffect(() => {
    const k = groupForPath(pathname);
    if (k) {
      // Auto-expand only the group that matches the current route
      setExpanded(prev => prev[k] ? prev : { [k]: true });
    }
  }, [pathname]);

  useEffect(() => {
    try { localStorage.setItem('byond_admin_nav_expanded', JSON.stringify(expanded)); } catch {}
  }, [expanded]);

  // Accordion: clicking a group closes all others
  const toggle = (key) => setExpanded(prev => {
    if (prev[key]) {
      // Clicking an open group just closes it
      return {};
    }
    // Open clicked group, close everything else
    return { [key]: true };
  });

  useEffect(() => {
    if (!loading && (!user || !['admin', 'super_admin', 'staff', 'factory_worker'].includes(user.role))) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div style={{ padding: 80, textAlign: 'center' }}>Loading...</div>;

  return (
    <div className="admin-layout" data-testid="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>{user.role === 'factory_worker' ? 'BYOND Factory' : 'BYOND Admin'}</h2>
        </div>
        <nav className="admin-nav" data-testid="admin-nav">
          {NAV_STRUCTURE.map((node) => {
            if (node.type === 'item') {
              const isActive = pathname === node.to || (node.to !== '/admin' && pathname.startsWith(node.to + '/'));
              return (
                <Link key={node.to} href={node.to}
                  className={`admin-nav-link ${isActive ? 'active' : ''}`}
                  data-testid={`admin-nav-${node.label.toLowerCase().replace(/\s+/g, '-')}`}>
                  {node.icon}
                  <span>{node.label}</span>
                </Link>
              );
            }
            const isOpen = !!expanded[node.key];
            const isActiveGroup = node.items.some(s => pathname === s.to || pathname.startsWith(s.to + '/'));
            return (
              <div key={node.key} className={`admin-nav-group ${isOpen ? 'open' : ''}`}
                data-testid={`admin-nav-group-${node.key}`}>
                <button type="button" onClick={() => toggle(node.key)}
                  className={`admin-nav-link admin-nav-group-header ${isActiveGroup && !isOpen ? 'active' : ''}`}
                  data-testid={`admin-nav-group-${node.key}-toggle`}
                  aria-expanded={isOpen}>
                  {node.icon}
                  <span>{node.label}</span>
                  <ChevronRight size={14} className="admin-nav-chevron"
                    style={{ marginLeft: 'auto', transition: 'transform 0.2s ease',
                             transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                </button>
                {isOpen && (
                  <div className="admin-nav-subgroup" data-testid={`admin-nav-group-${node.key}-items`}>
                    {node.items.map(sub => (
                      <Suspense key={sub.to} fallback={
                        <div className="admin-nav-link admin-nav-sublink" style={{ opacity: 0.6 }}>
                          {sub.icon}
                          <span>{sub.label}</span>
                        </div>
                      }>
                        <AdminSubLink sub={sub} pathname={pathname} />
                      </Suspense>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
