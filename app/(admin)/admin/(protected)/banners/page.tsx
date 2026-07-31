import Image from "next/image";

import { BannerForm } from "@/components/admin/banner-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  deleteBannerAction,
  toggleBannerAction,
} from "@/server/actions/admin/banners";
import { getAdminBanners } from "@/server/queries/admin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Banners" };

export default async function AdminBannersPage() {
  const banners = await getAdminBanners();

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Banners
      </h1>
      <p className="text-sm text-muted-foreground">
        Active banners appear at the top of the home page, ordered by position.
      </p>

      <BannerForm />

      {banners.length === 0 ? (
        <p className="rounded-xl border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
          No banners yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {banners.map((banner) => (
            <li
              key={banner.id}
              className="overflow-hidden rounded-xl border bg-card"
            >
              <div className="relative aspect-[3/1] bg-muted">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{banner.title}</p>
                  <Badge variant={banner.isActive ? "success" : "muted"}>
                    {banner.isActive ? "Active" : "Off"}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    #{banner.position}
                  </span>
                </div>
                {banner.subtitle && (
                  <p className="text-sm text-muted-foreground">
                    {banner.subtitle}
                  </p>
                )}
                {banner.linkUrl && (
                  <p className="text-xs text-muted-foreground">
                    → {banner.linkUrl}
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <form action={toggleBannerAction}>
                    <input type="hidden" name="id" value={banner.id} />
                    <Button type="submit" variant="outline" size="sm">
                      {banner.isActive ? "Disable" : "Enable"}
                    </Button>
                  </form>
                  <form action={deleteBannerAction}>
                    <input type="hidden" name="id" value={banner.id} />
                    <Button type="submit" variant="destructive" size="sm">
                      Delete
                    </Button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
