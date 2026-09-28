import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/admin-ui";
import { OrderForm } from "@/components/admin/order-form";
import { getAdminOrder } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit order" };

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const order = await getAdminOrder(orderNumber);

  // a trashed order is read-only until it is restored
  if (!order || order.deletedAt) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        back={
          <Link
            href={`/admin/orders/${order.orderNumber}`}
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            ← {order.orderNumber}
          </Link>
        }
        title="Edit order details"
        description="Customer, address and note."
      />
      <OrderForm
        mode="edit"
        order={{
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          addressLine: order.addressLine,
          area: order.area,
          district: order.district,
          postalCode: order.postalCode,
          note: order.note,
        }}
      />
    </div>
  );
}
