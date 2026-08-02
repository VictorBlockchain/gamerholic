"use client";

import { Suspense } from "react";
import { Text } from "@chakra-ui/react";
import { HostCreateView } from "@/components/create/host-create-view";

export default function CreatePage() {
  return (
    <Suspense fallback={<Text color="fg.muted">Loading host booth…</Text>}>
      <HostCreateView />
    </Suspense>
  );
}
