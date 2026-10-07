import { AdminProductEditor } from '@/components/admin-product-editor';

export default async function EditAdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProductEditor productId={decodeURIComponent(id)} />;
}
