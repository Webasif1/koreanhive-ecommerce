import Link from "next/link";

import { PageHeader } from "@/components/admin/admin-ui";
import { OrderForm } from "@/components/admin/order-form";
import {
  getAdminCustomer,
  getDeliveryZonesForForm,
  getOrderFormProducts,
} from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "New order" };

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customer?: string }>;
}) {
  const { customer: customerId } = await searchParams;
  const [products, zones, customer] = await Promise.all([
    getOrderFormProducts(),
    getDeliveryZonesForForm(),
    customerId ? getAdminCustomer(customerId) : null,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        back={
          <Link
            href={customer ? `/admin/customers/${customer.id}` : "/admin/orders"}
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            ← {customer ? customer.name : "Orders"}
          </Link>
        }
        title={customer ? `New order for ${customer.name}` : "New order"}
        description="For phone and WhatsApp orders. Priced and stocked exactly like a checkout order."
      />
      <OrderForm
        mode="create"
        products={products}
        zones={zones}
        prefill={
          customer
            ? {
                customerName: customer.name,
                customerPhone: customer.phone,
                customerEmail: customer.email,
                addressLine: customer.addressLine ?? "",
                area: customer.area ?? "",
                district: customer.district ?? "Dhaka",
                postalCode: customer.postalCode,
                note: null,
              }
            : null
        }
      />
    </div>
  );
}
