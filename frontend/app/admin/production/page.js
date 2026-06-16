import { Suspense } from 'react';
import AdminProduction from '../../../src/views/admin/AdminProduction';

export default function Page() {
  return (
    <Suspense fallback={<div className="admin-loading" style={{ padding: 80, textAlign: 'center' }}>Loading production...</div>}>
      <AdminProduction />
    </Suspense>
  );
}