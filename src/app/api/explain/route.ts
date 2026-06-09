import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface ExplainBody {
  name?: string;
  kind?: string;
  snippet?: string;
}

const MAX_SNIPPET = 8000;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let body: ExplainBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const snippet = (body.snippet ?? "").slice(0, MAX_SNIPPET);
  if (!snippet.trim()) {
    return NextResponse.json(
      { error: "No code snippet provided." },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey });

  try {
    // Stream the explanation token-by-token so the inspector fills in live.
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system:
        "You explain code concisely for a developer exploring an unfamiliar " +
        "codebase. Given a single construct, describe in 2-4 short sentences " +
        "what it does, its role, and any notable behavior. No preamble, no " +
        "markdown headers, no restating the code line by line.",
      messages: [
        {
          role: "user",
          content: `This is a ${body.kind ?? "construct"} named "${
            body.name ?? "anonymous"
          }":\n\n\`\`\`\n${snippet}\n\`\`\``,
        },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Anthropic request failed: ${detail}` },
      { status: 502 },
    );
  }
}
