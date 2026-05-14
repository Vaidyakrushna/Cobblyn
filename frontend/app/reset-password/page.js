import React, { Suspense } from 'react';
import ResetPassword from '../../src/views/ResetPassword';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}