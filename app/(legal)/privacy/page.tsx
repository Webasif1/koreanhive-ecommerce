import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Korean Hive collects, uses and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        Placeholder copy. Final policy is drafted before launch and must cover
        what we store for guest orders (name, phone, address), how long we keep
        it, and how to request deletion.
      </p>
    </>
  );
}
