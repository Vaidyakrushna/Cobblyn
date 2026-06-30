import PolicyPages from '@/views/PolicyPages';

export const metadata = {
  title: 'Policies | Cobblyn',
  description: 'View the privacy, terms, warranty, return, and cookie policies for Cobblyn.',
};

export default function PoliciesPage() {
  return (
    <main className="min-h-screen pt-24 pb-16">
      <PolicyPages />
    </main>
  );
}
