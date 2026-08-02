import { STATIC_ID_PLACEHOLDER } from "@/lib/static-params";

export function generateStaticParams() {
  return STATIC_ID_PLACEHOLDER;
}

export default function MarketIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
