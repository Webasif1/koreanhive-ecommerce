import type { Metadata } from "next";

import { SuccessMessage } from "./success-message";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false },
};

export default function SuccessPage() {
  return <SuccessMessage />;
}
