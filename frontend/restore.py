import os

files = {
    'app/page.js': '''import HeroSlider from '../src/components/HeroSlider';
import Marquee from '../src/components/Marquee';
import SignatureStyles from '../src/components/SignatureStyles';
import LuxeCollection from '../src/components/LuxeCollection';
import Categories from '../src/components/Categories';
import StudioSection from '../src/components/StudioSection';
import BespokeForm from '../src/components/BespokeForm';

export default function Home() {
  return (
    <>
      <HeroSlider />
      <Marquee />
      <SignatureStyles />
      <Categories />
      <LuxeCollection />
      <BespokeForm />
      <StudioSection />
    </>
  );
}''',
    'app/layout.js': '''import './globals.css';
import '../src/App.css';
import '../src/account.css';
import '../src/admin-extra.css';
import '../src/mobile.css';
import { AuthProvider } from '../src/context/AuthContext';
import TopBar from '../src/components/TopBar';
import Navigation from '../src/components/Navigation';
import Footer from '../src/components/Footer';

export const metadata = {
  title: 'Cobblyn | Luxury Handcrafted Footwear',
  description: 'Cobblyn Shoes - Bespoke luxury footwear handcrafted with timeless design.',
};

export const viewport = {
  themeColor: '#000000',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <div className="App">
          <AuthProvider>
            <TopBar />
            <Navigation />
            {children}
            <Footer />
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}''',
    'app/cart/page.js': "import CartPage from '../../src/views/CartPage'; export default function Page() { return <CartPage />; }",
    'app/checkout/page.js': "import CheckoutPage from '../../src/views/CheckoutPage'; export default function Page() { return <CheckoutPage />; }",
    'app/login/page.js': "import LoginPage from '../../src/views/LoginPage'; export default function Page() { return <LoginPage />; }",
    'app/account/page.js': "import MyAccountPage from '../../src/views/MyAccountPage'; export default function Page() { return <MyAccountPage />; }",
    'app/wishlist/page.js': "import WishlistPage from '../../src/views/WishlistPage'; export default function Page() { return <WishlistPage />; }",
    'app/forgot-password/page.js': "import ForgotPassword from '../../src/views/ForgotPassword'; export default function Page() { return <ForgotPassword />; }",
    'app/reset-password/page.js': "import ResetPassword from '../../src/views/ResetPassword'; export default function Page() { return <ResetPassword />; }",
    'app/verify-email/page.js': "import VerifyEmail from '../../src/views/VerifyEmail'; export default function Page() { return <VerifyEmail />; }",
    'app/order-confirmation/page.js': "import OrderConfirmation from '../../src/views/OrderConfirmation'; export default function Page() { return <OrderConfirmation />; }",
    
    'app/bespoke/page.js': "import CustomizePage from '../../src/views/CustomizePage'; export default function Page() { return <CustomizePage />; }",
    'app/customize/page.js': "import CustomizePage from '../../src/views/CustomizePage'; export default function Page() { return <CustomizePage />; }",
    'app/customize/[gender]/page.js': "import CustomizePage from '../../../src/views/CustomizePage'; export default function Page() { return <CustomizePage />; }",
    
    'app/men/page.js': "import ProductListPage from '../../src/views/ProductListPage'; export default function Page() { return <ProductListPage gender='men' title='Mens Collection' subtitle='Handcrafted for the modern gentleman' />; }",
    'app/women/page.js': "import ProductListPage from '../../src/views/ProductListPage'; export default function Page() { return <ProductListPage gender='women' title='Womens Collection' subtitle='Elegance in every step' />; }",
    'app/collection/page.js': "import ProductListPage from '../../src/views/ProductListPage'; export default function Page() { return <ProductListPage gender='all' title='All Collections' subtitle='Explore our entire range' />; }",
    'app/luxe-collection/page.js': "import ProductListPage from '../../src/views/ProductListPage'; export default function Page() { return <ProductListPage gender='' title='Luxe Collection' subtitle='Our most coveted styles' />; }",
    'app/accessories/page.js': "import ProductListPage from '../../src/views/ProductListPage'; export default function Page() { return <ProductListPage gender='accessories' title='Accessories' subtitle='Premium accessories' />; }",
    
    'app/men/style/[slug]/page.js': "import ProductListPage from '../../../../src/views/ProductListPage'; export default function Page({params}) { return <ProductListPage gender='men' title='Mens Collection' filterType='style' filterValue={params.slug} />; }",
    'app/men/occasion/[slug]/page.js': "import ProductListPage from '../../../../src/views/ProductListPage'; export default function Page({params}) { return <ProductListPage gender='men' title='Mens Collection' filterType='occasion' filterValue={params.slug} />; }",
    'app/women/style/[slug]/page.js': "import ProductListPage from '../../../../src/views/ProductListPage'; export default function Page({params}) { return <ProductListPage gender='women' title='Womens Collection' filterType='style' filterValue={params.slug} />; }",
    'app/women/occasion/[slug]/page.js': "import ProductListPage from '../../../../src/views/ProductListPage'; export default function Page({params}) { return <ProductListPage gender='women' title='Womens Collection' filterType='occasion' filterValue={params.slug} />; }",
    
    'app/men/product/[id]/page.js': "import ProductPDP from '../../../../src/views/ProductPDP'; export default function Page() { return <ProductPDP />; }",
    'app/women/product/[id]/page.js': "import ProductPDP from '../../../../src/views/ProductPDP'; export default function Page() { return <ProductPDP />; }",
    
    'app/admin/layout.js': "import AdminLayout from '../../src/views/admin/AdminLayout'; export default function Layout({children}) { return <AdminLayout>{children}</AdminLayout>; }",
    'app/admin/page.js': "import AdminDashboard from '../../src/views/admin/AdminDashboard'; export default function Page() { return <AdminDashboard />; }",
    'app/admin/products/page.js': "import AdminProducts from '../../../src/views/admin/AdminProducts'; export default function Page() { return <AdminProducts />; }",
    'app/admin/orders/page.js': "import AdminOrders from '../../../src/views/admin/AdminOrders'; export default function Page() { return <AdminOrders />; }",
    'app/admin/inventory/page.js': "import AdminInventory from '../../../src/views/admin/AdminInventory'; export default function Page() { return <AdminInventory />; }",
    'app/admin/customers/page.js': "import AdminCustomers from '../../../src/views/admin/AdminCustomers'; export default function Page() { return <AdminCustomers />; }",
    'app/admin/visits/page.js': "import AdminVisits from '../../../src/views/admin/AdminVisits'; export default function Page() { return <AdminVisits />; }",
    'app/admin/returns/page.js': "import AdminReturns from '../../../src/views/admin/AdminReturns'; export default function Page() { return <AdminReturns />; }",
    'app/admin/users/page.js': "import AdminUsers from '../../../src/views/admin/AdminUsers'; export default function Page() { return <AdminUsers />; }",
    'app/admin/tickets/page.js': "import AdminTickets from '../../../src/views/admin/AdminTickets'; export default function Page() { return <AdminTickets />; }",
    'app/admin/rules/page.js': "import AdminRules from '../../../src/views/admin/AdminRules'; export default function Page() { return <AdminRules />; }",
    'app/admin/banners/page.js': "import AdminBanners from '../../../src/views/admin/AdminBanners'; export default function Page() { return <AdminBanners />; }",
    'app/admin/categories/page.js': "import AdminCategories from '../../../src/views/admin/AdminCategories'; export default function Page() { return <AdminCategories />; }",
    'app/admin/coupons/page.js': "import AdminCoupons from '../../../src/views/admin/AdminCoupons'; export default function Page() { return <AdminCoupons />; }",
    'app/admin/materials/page.js': "import AdminMaterials from '../../../src/views/admin/AdminMaterials'; export default function Page() { return <AdminMaterials />; }",
    'app/admin/analytics/page.js': "import AdminAnalytics from '../../../src/views/admin/AdminAnalytics'; export default function Page() { return <AdminAnalytics />; }",
    'app/admin/production/page.js': "import AdminProduction from '../../../src/views/admin/AdminProduction'; export default function Page() { return <AdminProduction />; }",
}

for path, content in files.items():
    if os.path.exists(path):
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
