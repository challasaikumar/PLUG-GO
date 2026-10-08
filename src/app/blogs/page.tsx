import Link from "next/link";
import { HeroFieldPage } from "@/components/marketing/HeroFieldPage";
import { SectionHead } from "@/components/marketing/voltran/SectionHead";
import { JsonLd } from "@/components/seo/JsonLd";
import { voltran } from "@/content/voltran";
import { pageMeta } from "@/lib/metadata";
import { blogIndexJsonLd, breadcrumbListJsonLd } from "@/lib/seo/jsonld";

export const metadata = pageMeta({
  title: "Our Blogs",
  description: "PLUG & GO notes on electric vehicles and charging, including electric vehicle testing.",
  path: "/blogs",
  keywords: ["EV blogs", "electric vehicle testing"],
});

export default function BlogsPage() {
  return (
    <HeroFieldPage>
      <JsonLd
        data={breadcrumbListJsonLd([
          { name: "Home", path: "/" },
          { name: "Blogs", path: "/blogs" },
        ])}
      />
      <JsonLd data={blogIndexJsonLd()} />
      <div className="vt vt-blogs">
        <div className="vt-wrap">
          <SectionHead id="blogs-heading" kicker="Notes" as="h1">
            {voltran.blogs.title}
          </SectionHead>
          <ul className="vt-blog-list">
            {voltran.blogs.posts.map((post) => (
              <li key={post.slug}>
                <article className="vt-card">
                  <h2>{post.title}</h2>
                  <p>by {post.author}</p>
                </article>
              </li>
            ))}
          </ul>
          <p>
            <Link className="png-link" href="/">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </HeroFieldPage>
  );
}
