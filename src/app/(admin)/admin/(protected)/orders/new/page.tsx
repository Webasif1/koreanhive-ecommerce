import Link from "next/link";

import { PageHeader } from "@/components/admin/admin-ui";
import { OrderForm } from "@/components/admin/order-form";
import {
  getDeliveryZonesForForm,
  getOrderFormProducts,
} from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "New order" };

export default async function NewOrderPage() {
  const [products, zones] = await Promise.all([
    getOrderFormProducts(),
    getDeliveryZonesForForm(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        back={
          <Link
            href="/admin/orders"
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            ← Orders
          </Link>
        }
        title="New order"
        description="For phone and WhatsApp orders. Priced and stocked exactly like a checkout order."
      />
      <OrderForm mode="create" products={products} zones={zones} />
    </div>
  );
}
