"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Text } from "@chakra-ui/react";
import { ProductDetailView } from "@/components/shop/product-detail-view";

function Inner() {
  const search = useSearchParams();
  const id = useMemo(() => (search?.get("id") || "").trim(), [search]);
  if (!id) {
    return (
      <Text color="fg.muted" fontSize="sm" py="phi4">
        Missing product id. Open an item from the shop.
      </Text>
    );
  }
  return <ProductDetailView productId={id} />;
}

export default function ShopProductPage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading product…</Text>}>
      <Inner />
    </Suspense>
  );
}
