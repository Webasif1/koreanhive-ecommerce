import { PageShell } from "@/components/layout/page-shell";

type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;

  return (
    <PageShell
      title="Blog Post"
      description={`Article "${slug}".`}
      step="a later step"
    />
  );
}
