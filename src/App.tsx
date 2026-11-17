import { useEffect } from 'react'
import { BrowserRouter, HashRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { RoleSwitcher } from './components/layout/RoleSwitcher'
import { AppStoreProvider } from './store/AppStore'
import { CustomerLayout } from './features/customer/CustomerLayout'
import { DiscoveryFeed } from './features/customer/DiscoveryFeed'
import { Storefront } from './features/customer/Storefront'
import { OrderTracking } from './features/customer/OrderTracking'
import { OrdersPage } from './features/customer/OrdersPage'
import { AccountPage } from './features/customer/AccountPage'
import { MerchantPortal } from './features/merchant/MerchantPortal'
import { CourierApp } from './features/courier/CourierApp'
import { AdminDashboard } from './features/admin/AdminDashboard'
import { PartnerPortal } from './features/partner/PartnerPortal'
import { CreditsPage } from './features/customer/CreditsPage'

// VITE_ROUTER=memory is used for sandboxed previews; default is clean URLs.
const mode = import.meta.env.VITE_ROUTER as string | undefined
const Router = mode === 'memory' ? MemoryRouter : mode === 'hash' ? HashRouter : BrowserRouter

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <AppStoreProvider>
      <Router>
        <ScrollToTop />
        <RoleSwitcher />
        <Routes>
          <Route element={<CustomerLayout />}>
            <Route index element={<DiscoveryFeed />} />
            <Route path="search" element={<DiscoveryFeed searchMode />} />
            <Route path="store/:id" element={<Storefront />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="credits" element={<CreditsPage />} />
          </Route>
          <Route path="/partner/*" element={<PartnerPortal />} />
          <Route path="/track/:orderId" element={<OrderTracking />} />
          <Route path="/merchant/*" element={<MerchantPortal />} />
          <Route path="/courier/*" element={<CourierApp />} />
          <Route path="/admin/*" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppStoreProvider>
  )
}
