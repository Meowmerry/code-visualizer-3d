"use client";

import { useEffect } from "react";
import { nodeSource } from "@/parser/astParser";
import { useSceneStore, findNode } from "@/store/sceneStore";

/**
 * Streaming Claude hook — watches the selected node and streams a plain-English
 * explanation into the store as tokens arrive. Each selection aborts the
 * previous in-flight request, so rapidly clicking around never stacks calls.
 * Mount once near the app root.
 */
export function useNodeExplain() {
  const selectedId = useSceneStore((s) => s.selectedId);

  useEffect(() => {
    if (!selectedId) return;

    const { tree, code, startExplain, appendAI, finishExplain, failExplain } =
      useSceneStore.getState();
    const node = findNode(tree, selectedId);
    if (!node) return;

    const controller = new AbortController();

    const run = async () => {
      startExplain();
      try {
        const res = await fetch("/api/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: node.name,
            kind: node.kind,
            snippet: nodeSource(code, node),
          }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) appendAI(chunk);
        }
        finishExplain();
      } catch (err) {
        if (controller.signal.aborted) return; // superseded by a newer select
        failExplain(err instanceof Error ? err.message : "Unknown error");
      }
    };

    run();
    return () => controller.abort();
  }, [selectedId]);
}
