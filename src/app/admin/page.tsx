"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VStack, Text } from "@chakra-ui/react";
import { GhSpinner } from "@/components/ui";

/**
 * /admin → full moderator console (legacy admin entry).
 */
export default function AdminPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/moderator/console/");
  }, [router]);

  return (
    <VStack py="phi8" gap="2">
      <GhSpinner />
      <Text fontSize="sm" color="fg.muted">
        Opening admin console…
      </Text>
    </VStack>
  );
}
