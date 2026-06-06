import ProductListPage from '../../../../src/views/ProductListPage';

export default function Page({ params }) {
  return <ProductListPage gender="" title="Luxe Collection" filterType="occasion" filterValue={params.slug} />;
}
