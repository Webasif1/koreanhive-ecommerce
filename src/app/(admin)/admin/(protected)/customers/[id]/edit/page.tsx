import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/admin/admin-ui";
import { CustomerForm } from "@/components/admin/customer-form";
import { getAdminCustomer } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Edit customer" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        back={
          <Link
            href={`/admin/customers/${customer.id}`}
            className="mb-1 inline-block text-sm text-muted-foreground hover:text-primary"
          >
            ← {customer.name}
          </Link>
        }
        title="Edit customer"
        description="Changes here update the customer record. Past orders keep the details they were placed with."
      />
      <CustomerForm
        customer={{
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          addressLine: customer.addressLine,
          area: customer.area,
          district: customer.district,
          postalCode: customer.postalCode,
          note: customer.note,
        }}
      />
    </div>
  );
}
