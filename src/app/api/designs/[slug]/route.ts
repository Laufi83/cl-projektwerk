import { getDesign, getDesigns, getNeighbours } from "@/lib/designs";

export const dynamic = "force-static";
// wie die Detailseite: tägliche Veröffentlichung, unveröffentlichte Designs → 404
export const dynamicParams = true;
export const revalidate = 300;

export function generateStaticParams() {
  return getDesigns().map((d) => ({ slug: d.slug }));
}

/** Detaildaten für das Overlay (statisch, nach jeder Veröffentlichung neu erzeugt). */
export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const design = getDesign(slug);
  if (!design) return Response.json({ error: "not found" }, { status: 404 });
  const { prev, next } = getNeighbours(slug);
  const ref = (d: typeof prev) => ({ slug: d.slug, title: d.title, number: d.number });
  return Response.json({ design, prev: ref(prev), next: ref(next) });
}
