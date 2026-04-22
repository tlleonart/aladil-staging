import { NextResponse } from "next/server";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { createConvexClient } from "@/modules/core/convex/server";

export async function POST(request: Request) {
  const convex = await createConvexClient();

  // Verify auth by asking Convex who the current user is.
  const me = await convex.query(api.users.me, {});
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  // 1) Ask Convex for a signed upload URL
  const uploadUrl = await convex.mutation(api.storage.generateUploadUrl, {});

  // 2) Stream the file directly to Convex Storage
  const putRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: await file.arrayBuffer(),
  });
  if (!putRes.ok) {
    const body = await putRes.text().catch(() => "");
    return NextResponse.json(
      { error: `Upload failed: ${putRes.status} ${body}` },
      { status: 500 },
    );
  }
  const { storageId } = (await putRes.json()) as {
    storageId: Id<"_storage">;
  };

  // 3) Create the Asset row and return URL
  const type = file.type.startsWith("image/")
    ? "IMAGE"
    : file.type === "application/pdf"
      ? "PDF"
      : "OTHER";
  const asset = await convex.mutation(api.assets.create, {
    type,
    storageId,
    filename: file.name,
    mimeType: file.type || undefined,
    size: file.size,
  });

  return NextResponse.json({
    url: asset?.url ?? null,
    assetId: asset?.id ?? null,
    storageId,
  });
}
