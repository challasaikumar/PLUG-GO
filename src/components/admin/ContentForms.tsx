"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ALLOWED_RELATED_GUIDES } from "@/lib/content/paths";

type ApiResult = { ok: boolean; error?: string; errors?: Record<string, string> };

async function api(path: string, method: string, body?: unknown) {
  const response = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return (await response.json()) as ApiResult & Record<string, unknown>;
}

function ErrorBox({ result }: { result: ApiResult | null }) {
  if (!result || result.ok) return null;
  return (
    <Alert variant="error" title="Not saved">
      {result.error}
      {result.errors ? (
        <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
          {Object.entries(result.errors).map(([key, message]) => (
            <li key={key}>
              {key}: {message}
            </li>
          ))}
        </ul>
      ) : null}
    </Alert>
  );
}

function parseFaqLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [question, ...rest] = line.split("|");
      return { question: question.trim(), answer: rest.join("|").trim() };
    })
    .filter((row) => row.question && row.answer);
}

function faqLines(faqs: Array<{ question: string; answer: string }>) {
  return faqs.map((faq) => `${faq.question} | ${faq.answer}`).join("\n");
}

function WorkflowButtons({
  basePath,
  previewHref,
  onDone,
}: {
  basePath: string;
  previewHref: string;
  onDone: () => void;
}) {
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  async function run(action: "review" | "publish" | "unpublish") {
    setLoading(action);
    const data = await api(`${basePath}/${action}`, "POST");
    setResult(data);
    setLoading(null);
    if (data.ok) onDone();
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <ErrorBox result={result} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button type="button" size="sm" variant="outline" loading={loading === "review"} onClick={() => run("review")}>
          Mark reviewed
        </Button>
        <Button type="button" size="sm" loading={loading === "publish"} onClick={() => run("publish")}>
          Publish
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          loading={loading === "unpublish"}
          onClick={() => run("unpublish")}
        >
          Unpublish
        </Button>
        <Button href={previewHref} size="sm" variant="outline">
          Preview
        </Button>
      </div>
    </div>
  );
}

export function CityContentForm({
  city,
}: {
  city?: {
    id: string;
    slug: string;
    cityName: string;
    stateName: string;
    intro: string;
    accessGuidance: string;
    connectorGuidance: string;
    localNotes?: string | null;
    showFleetModule: boolean;
    seoTitle?: string | null;
    seoDescription?: string | null;
    publicationStatus: string;
    isDemo: boolean;
    faqs: Array<{ question: string; answer: string }>;
  };
}) {
  const router = useRouter();
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const payload = {
      slug: String(form.get("slug") ?? ""),
      cityName: String(form.get("cityName") ?? ""),
      stateName: String(form.get("stateName") ?? ""),
      intro: String(form.get("intro") ?? ""),
      accessGuidance: String(form.get("accessGuidance") ?? ""),
      connectorGuidance: String(form.get("connectorGuidance") ?? ""),
      localNotes: String(form.get("localNotes") ?? ""),
      showFleetModule: form.get("showFleetModule") === "on",
      seoTitle: String(form.get("seoTitle") ?? ""),
      seoDescription: String(form.get("seoDescription") ?? ""),
      faqs: parseFaqLines(String(form.get("faqs") ?? "")),
    };
    const data = city
      ? await api(`/api/admin/content/cities/${city.id}`, "PATCH", payload)
      : await api("/api/admin/content/cities", "POST", payload);
    setResult(data);
    setLoading(false);
    if (data.ok && !city && data.city && typeof data.city === "object" && "id" in data.city) {
      router.push(`/admin/content/cities/${(data.city as { id: string }).id}`);
    } else if (data.ok) {
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="enquiry-form" style={{ maxWidth: 720 }}>
      <ErrorBox result={result} />
      {city ? (
        <p className="type-caption">
          Status: {city.publicationStatus}
          {city.isDemo ? " · demo (cannot publish)" : ""}
        </p>
      ) : null}
      <label className="field-label" htmlFor="cityName">
        City name
      </label>
      <div className="field-control">
        <input id="cityName" name="cityName" required defaultValue={city?.cityName} />
      </div>
      <label className="field-label" htmlFor="stateName">
        State
      </label>
      <div className="field-control">
        <input id="stateName" name="stateName" required defaultValue={city?.stateName} />
      </div>
      <label className="field-label" htmlFor="slug">
        Slug
      </label>
      <div className="field-control">
        <input id="slug" name="slug" defaultValue={city?.slug} />
      </div>
      <label className="field-label" htmlFor="intro">
        Unique city introduction
      </label>
      <div className="field-control">
        <textarea id="intro" name="intro" rows={5} required defaultValue={city?.intro} />
      </div>
      <label className="field-label" htmlFor="accessGuidance">
        Local access guidance
      </label>
      <div className="field-control">
        <textarea id="accessGuidance" name="accessGuidance" rows={4} required defaultValue={city?.accessGuidance} />
      </div>
      <label className="field-label" htmlFor="connectorGuidance">
        Connector guidance for this city
      </label>
      <div className="field-control">
        <textarea
          id="connectorGuidance"
          name="connectorGuidance"
          rows={4}
          required
          defaultValue={city?.connectorGuidance}
        />
      </div>
      <label className="field-label" htmlFor="localNotes">
        Local notes (optional)
      </label>
      <div className="field-control">
        <textarea id="localNotes" name="localNotes" rows={3} defaultValue={city?.localNotes ?? ""} />
      </div>
      <label className="field-label" htmlFor="faqs">
        FAQs (one per line: question | answer)
      </label>
      <div className="field-control">
        <textarea id="faqs" name="faqs" rows={4} defaultValue={city ? faqLines(city.faqs) : ""} />
      </div>
      <label className="field-label" htmlFor="seoTitle">
        SEO title
      </label>
      <div className="field-control">
        <input id="seoTitle" name="seoTitle" defaultValue={city?.seoTitle ?? ""} />
      </div>
      <label className="field-label" htmlFor="seoDescription">
        SEO description
      </label>
      <div className="field-control">
        <textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={city?.seoDescription ?? ""} />
      </div>
      <label className="type-small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" name="showFleetModule" defaultChecked={city?.showFleetModule} />
        Show fleet/host module
      </label>
      <Button type="submit" loading={loading}>
        Save city page
      </Button>
      {city ? (
        <WorkflowButtons
          basePath={`/api/admin/content/cities/${city.id}`}
          previewHref={`/admin/content/preview/city/${city.slug}`}
          onDone={() => router.refresh()}
        />
      ) : null}
    </form>
  );
}

export function InsightContentForm({
  article,
  authors,
}: {
  article?: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    authorId?: string | null;
    reviewerId?: string | null;
    relatedStationSlugs: string[];
    relatedGuideHrefs: string[];
    relatedCitySlug?: string | null;
    publicationStatus: string;
    isDemo: boolean;
    faqs: Array<{ question: string; answer: string }>;
  };
  authors: Array<{ id: string; displayName: string }>;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const payload = {
      slug: String(form.get("slug") ?? ""),
      title: String(form.get("title") ?? ""),
      excerpt: String(form.get("excerpt") ?? ""),
      body: String(form.get("body") ?? ""),
      seoTitle: String(form.get("seoTitle") ?? ""),
      seoDescription: String(form.get("seoDescription") ?? ""),
      authorId: String(form.get("authorId") ?? ""),
      reviewerId: String(form.get("reviewerId") ?? ""),
      relatedCitySlug: String(form.get("relatedCitySlug") ?? ""),
      relatedStationSlugs: String(form.get("relatedStationSlugs") ?? ""),
      relatedGuideHrefs: form.getAll("relatedGuideHrefs"),
      faqs: parseFaqLines(String(form.get("faqs") ?? "")),
    };
    const data = article
      ? await api(`/api/admin/content/insights/${article.id}`, "PATCH", payload)
      : await api("/api/admin/content/insights", "POST", payload);
    setResult(data);
    setLoading(false);
    if (data.ok && !article && data.article && typeof data.article === "object" && "id" in data.article) {
      router.push(`/admin/content/insights/${(data.article as { id: string }).id}`);
    } else if (data.ok) {
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="enquiry-form" style={{ maxWidth: 720 }}>
      <ErrorBox result={result} />
      {article ? (
        <p className="type-caption">
          Status: {article.publicationStatus}
          {article.isDemo ? " · demo template (cannot publish)" : ""}
        </p>
      ) : null}
      <label className="field-label" htmlFor="title">
        Title
      </label>
      <div className="field-control">
        <input id="title" name="title" required defaultValue={article?.title} />
      </div>
      <label className="field-label" htmlFor="slug">
        Slug
      </label>
      <div className="field-control">
        <input id="slug" name="slug" defaultValue={article?.slug} />
      </div>
      <label className="field-label" htmlFor="excerpt">
        Excerpt
      </label>
      <div className="field-control">
        <textarea id="excerpt" name="excerpt" rows={3} required defaultValue={article?.excerpt} />
      </div>
      <label className="field-label" htmlFor="body">
        Body (plain text, paragraphs separated by a blank line)
      </label>
      <div className="field-control">
        <textarea id="body" name="body" rows={12} required defaultValue={article?.body} />
      </div>
      <label className="field-label" htmlFor="authorId">
        Author
      </label>
      <div className="field-control">
        <select id="authorId" name="authorId" defaultValue={article?.authorId ?? ""}>
          <option value="">Select</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.displayName}
            </option>
          ))}
        </select>
      </div>
      <label className="field-label" htmlFor="reviewerId">
        Reviewer
      </label>
      <div className="field-control">
        <select id="reviewerId" name="reviewerId" defaultValue={article?.reviewerId ?? ""}>
          <option value="">Select</option>
          {authors.map((author) => (
            <option key={author.id} value={author.id}>
              {author.displayName}
            </option>
          ))}
        </select>
      </div>
      <label className="field-label" htmlFor="relatedCitySlug">
        Related city slug
      </label>
      <div className="field-control">
        <input id="relatedCitySlug" name="relatedCitySlug" defaultValue={article?.relatedCitySlug ?? ""} />
      </div>
      <label className="field-label" htmlFor="relatedStationSlugs">
        Related station slugs (comma or newline)
      </label>
      <div className="field-control">
        <textarea
          id="relatedStationSlugs"
          name="relatedStationSlugs"
          rows={2}
          defaultValue={article?.relatedStationSlugs.join("\n") ?? ""}
        />
      </div>
      <fieldset>
        <legend className="field-label">Related guides</legend>
        {ALLOWED_RELATED_GUIDES.map((href) => (
          <label key={href} className="type-small" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              type="checkbox"
              name="relatedGuideHrefs"
              value={href}
              defaultChecked={article?.relatedGuideHrefs.includes(href)}
            />
            {href}
          </label>
        ))}
      </fieldset>
      <label className="field-label" htmlFor="faqs">
        FAQs (question | answer)
      </label>
      <div className="field-control">
        <textarea id="faqs" name="faqs" rows={4} defaultValue={article ? faqLines(article.faqs) : ""} />
      </div>
      <label className="field-label" htmlFor="seoTitle">
        SEO title
      </label>
      <div className="field-control">
        <input id="seoTitle" name="seoTitle" defaultValue={article?.seoTitle ?? ""} />
      </div>
      <label className="field-label" htmlFor="seoDescription">
        SEO description
      </label>
      <div className="field-control">
        <textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={article?.seoDescription ?? ""} />
      </div>
      <Button type="submit" loading={loading}>
        Save article
      </Button>
      {article ? (
        <WorkflowButtons
          basePath={`/api/admin/content/insights/${article.id}`}
          previewHref={`/admin/content/preview/insight/${article.slug}`}
          onDone={() => router.refresh()}
        />
      ) : null}
    </form>
  );
}

export function RouteContentForm({
  route,
}: {
  route?: {
    id: string;
    slug: string;
    originName: string;
    destinationName: string;
    originSlug: string;
    destinationSlug: string;
    routeNotes: string;
    accessCaveats: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    publicationStatus: string;
    isDemo: boolean;
    faqs: Array<{ question: string; answer: string }>;
    stops: Array<{ stationSlug: string; stopNotes?: string | null }>;
  };
}) {
  const router = useRouter();
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const payload = {
      slug: String(form.get("slug") ?? ""),
      originName: String(form.get("originName") ?? ""),
      destinationName: String(form.get("destinationName") ?? ""),
      originSlug: String(form.get("originSlug") ?? ""),
      destinationSlug: String(form.get("destinationSlug") ?? ""),
      routeNotes: String(form.get("routeNotes") ?? ""),
      accessCaveats: String(form.get("accessCaveats") ?? ""),
      seoTitle: String(form.get("seoTitle") ?? ""),
      seoDescription: String(form.get("seoDescription") ?? ""),
      faqs: parseFaqLines(String(form.get("faqs") ?? "")),
      stops: String(form.get("stops") ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [stationSlug, ...rest] = line.split("|");
          return { stationSlug: stationSlug.trim(), stopNotes: rest.join("|").trim() };
        }),
    };
    const data = route
      ? await api(`/api/admin/content/routes/${route.id}`, "PATCH", payload)
      : await api("/api/admin/content/routes", "POST", payload);
    setResult(data);
    setLoading(false);
    if (data.ok && !route && data.route && typeof data.route === "object" && "id" in data.route) {
      router.push(`/admin/content/routes/${(data.route as { id: string }).id}`);
    } else if (data.ok) {
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="enquiry-form" style={{ maxWidth: 720 }}>
      <ErrorBox result={result} />
      {route ? (
        <p className="type-caption">
          Status: {route.publicationStatus}
          {route.isDemo ? " · demo (cannot publish)" : ""}
        </p>
      ) : null}
      <label className="field-label" htmlFor="originName">
        Origin
      </label>
      <div className="field-control">
        <input id="originName" name="originName" required defaultValue={route?.originName} />
      </div>
      <label className="field-label" htmlFor="destinationName">
        Destination
      </label>
      <div className="field-control">
        <input id="destinationName" name="destinationName" required defaultValue={route?.destinationName} />
      </div>
      <label className="field-label" htmlFor="originSlug">
        Origin slug
      </label>
      <div className="field-control">
        <input id="originSlug" name="originSlug" defaultValue={route?.originSlug} />
      </div>
      <label className="field-label" htmlFor="destinationSlug">
        Destination slug
      </label>
      <div className="field-control">
        <input id="destinationSlug" name="destinationSlug" defaultValue={route?.destinationSlug} />
      </div>
      <label className="field-label" htmlFor="slug">
        Route slug
      </label>
      <div className="field-control">
        <input id="slug" name="slug" defaultValue={route?.slug} />
      </div>
      <label className="field-label" htmlFor="routeNotes">
        Researched charging plan
      </label>
      <div className="field-control">
        <textarea id="routeNotes" name="routeNotes" rows={6} required defaultValue={route?.routeNotes} />
      </div>
      <label className="field-label" htmlFor="accessCaveats">
        Access caveats
      </label>
      <div className="field-control">
        <textarea id="accessCaveats" name="accessCaveats" rows={4} required defaultValue={route?.accessCaveats} />
      </div>
      <label className="field-label" htmlFor="stops">
        Stops (one per line: station-slug | notes)
      </label>
      <div className="field-control">
        <textarea
          id="stops"
          name="stops"
          rows={4}
          defaultValue={route?.stops.map((stop) => `${stop.stationSlug} | ${stop.stopNotes ?? ""}`).join("\n")}
        />
      </div>
      <label className="field-label" htmlFor="faqs">
        FAQs (question | answer)
      </label>
      <div className="field-control">
        <textarea id="faqs" name="faqs" rows={3} defaultValue={route ? faqLines(route.faqs) : ""} />
      </div>
      <label className="field-label" htmlFor="seoTitle">
        SEO title
      </label>
      <div className="field-control">
        <input id="seoTitle" name="seoTitle" defaultValue={route?.seoTitle ?? ""} />
      </div>
      <label className="field-label" htmlFor="seoDescription">
        SEO description
      </label>
      <div className="field-control">
        <textarea id="seoDescription" name="seoDescription" rows={2} defaultValue={route?.seoDescription ?? ""} />
      </div>
      <Button type="submit" loading={loading}>
        Save route guide
      </Button>
      {route ? (
        <WorkflowButtons
          basePath={`/api/admin/content/routes/${route.id}`}
          previewHref={`/admin/content/preview/route/${route.slug}`}
          onDone={() => router.refresh()}
        />
      ) : null}
    </form>
  );
}

export function AuthorForm() {
  const router = useRouter();
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    const data = await api("/api/admin/content/authors", "POST", {
      displayName: String(form.get("displayName") ?? ""),
      roleTitle: String(form.get("roleTitle") ?? ""),
      bio: String(form.get("bio") ?? ""),
    });
    setResult(data);
    setLoading(false);
    if (data.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="enquiry-form" style={{ maxWidth: 480 }}>
      <ErrorBox result={result} />
      <label className="field-label" htmlFor="displayName">
        Display name
      </label>
      <div className="field-control">
        <input id="displayName" name="displayName" required />
      </div>
      <label className="field-label" htmlFor="roleTitle">
        Role title
      </label>
      <div className="field-control">
        <input id="roleTitle" name="roleTitle" />
      </div>
      <label className="field-label" htmlFor="bio">
        Bio
      </label>
      <div className="field-control">
        <textarea id="bio" name="bio" rows={3} />
      </div>
      <Button type="submit" loading={loading}>
        Add author
      </Button>
    </form>
  );
}
