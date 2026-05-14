import React, { Suspense } from 'react';
import VerifyEmail from '../../src/views/VerifyEmail';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: '100px', textAlign: 'center' }}>Loading...</div>}>
      <VerifyEmail />
    </Suspense>
  );
}