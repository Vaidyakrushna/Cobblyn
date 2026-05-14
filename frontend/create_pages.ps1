$base = "c:\Users\krush\Downloads\Byondstudio-main\Byondstudio-main\frontend\app"

function Make-Page($dir, $content) {
    $path = Join-Path $base $dir
    New-Item -ItemType Directory -Force -LiteralPath $path | Out-Null
    $file = Join-Path $path "page.js"
    Set-Content -Path $file -Value $content -Encoding UTF8
    Write-Host "Created $file"
}

Make-Page "men" "import ProductListPage from '../../src/pages/ProductListPage';`nexport default function Page() { return <ProductListPage gender=`"men`" title=`"Men's Collection`" subtitle=`"Timeless styles crafted for the modern gentleman`" />; }"

Make-Page "women" "import ProductListPage from '../../src/pages/ProductListPage';`nexport default function Page() { return <ProductListPage gender=`"women`" title=`"Women's Collection`" subtitle=`"Elegant designs celebrating feminine grace`" />; }"

Make-Page "luxe-collection" "import ProductListPage from '../../src/pages/ProductListPage';`nexport default function Page() { return <ProductListPage gender=`"`" title=`"Luxe Collection`" subtitle=`"Our most coveted styles, curated for the connoisseur`" />; }"

Make-Page "men\product\[id]" "import ProductPDP from '../../../../src/pages/ProductPDP';`nexport default function Page() { return <ProductPDP gender=`"men`" />; }"

Make-Page "women\product\[id]" "import ProductPDP from '../../../../src/pages/ProductPDP';`nexport default function Page() { return <ProductPDP gender=`"women`" />; }"

Make-Page "customize" "import CustomizePage from '../../src/pages/CustomizePage';`nexport default function Page() { return <CustomizePage />; }"

Make-Page "customize\[gender]" "import CustomizePage from '../../../src/pages/CustomizePage';`nexport default function Page() { return <CustomizePage />; }"

Make-Page "login" "import LoginPage from '../../src/pages/LoginPage';`nexport default function Page() { return <LoginPage />; }"

Make-Page "cart" "import CartPage from '../../src/pages/CartPage';`nexport default function Page() { return <CartPage />; }"

Make-Page "checkout" "import CheckoutPage from '../../src/pages/CheckoutPage';`nexport default function Page() { return <CheckoutPage />; }"

Make-Page "order-confirmation" "import OrderConfirmation from '../../src/pages/OrderConfirmation';`nexport default function Page() { return <OrderConfirmation />; }"

Make-Page "wishlist" "import WishlistPage from '../../src/pages/WishlistPage';`nexport default function Page() { return <WishlistPage />; }"

Make-Page "account" "import MyAccountPage from '../../src/pages/MyAccountPage';`nexport default function Page() { return <MyAccountPage />; }"

# Admin Layout
$adminLayout = Join-Path $base "admin"
New-Item -ItemType Directory -Force -LiteralPath $adminLayout | Out-Null
Set-Content -Path (Join-Path $adminLayout "layout.js") -Value "import AdminLayout from '../../src/pages/admin/AdminLayout';`nexport default function Layout({ children }) { return <AdminLayout>{children}</AdminLayout>; }" -Encoding UTF8

Make-Page "admin" "import AdminDashboard from '../../src/pages/admin/AdminDashboard';`nexport default function Page() { return <AdminDashboard />; }"

Make-Page "admin\products" "import AdminProducts from '../../../src/pages/admin/AdminProducts';`nexport default function Page() { return <AdminProducts />; }"
Make-Page "admin\materials" "import AdminMaterials from '../../../src/pages/admin/AdminMaterials';`nexport default function Page() { return <AdminMaterials />; }"
Make-Page "admin\rules" "import AdminRules from '../../../src/pages/admin/AdminRules';`nexport default function Page() { return <AdminRules />; }"
Make-Page "admin\orders" "import AdminOrders from '../../../src/pages/admin/AdminOrders';`nexport default function Page() { return <AdminOrders />; }"
Make-Page "admin\customers" "import AdminCustomers from '../../../src/pages/admin/AdminCustomers';`nexport default function Page() { return <AdminCustomers />; }"
Make-Page "admin\tickets" "import AdminTickets from '../../../src/pages/admin/AdminTickets';`nexport default function Page() { return <AdminTickets />; }"
Make-Page "admin\inventory" "import AdminInventory from '../../../src/pages/admin/AdminInventory';`nexport default function Page() { return <AdminInventory />; }"
Make-Page "admin\production" "import AdminProduction from '../../../src/pages/admin/AdminProduction';`nexport default function Page() { return <AdminProduction />; }"
Make-Page "admin\visits" "import AdminVisits from '../../../src/pages/admin/AdminVisits';`nexport default function Page() { return <AdminVisits />; }"
Make-Page "admin\banners" "import AdminBanners from '../../../src/pages/admin/AdminBanners';`nexport default function Page() { return <AdminBanners />; }"
Make-Page "admin\coupons" "import AdminCoupons from '../../../src/pages/admin/AdminCoupons';`nexport default function Page() { return <AdminCoupons />; }"
Make-Page "admin\returns" "import AdminReturns from '../../../src/pages/admin/AdminReturns';`nexport default function Page() { return <AdminReturns />; }"
Make-Page "admin\analytics" "import AdminAnalytics from '../../../src/pages/admin/AdminAnalytics';`nexport default function Page() { return <AdminAnalytics />; }"
Make-Page "admin\users" "import AdminUsers from '../../../src/pages/admin/AdminUsers';`nexport default function Page() { return <AdminUsers />; }"
