import { NextResponse } from "next/server";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { createConvexClient } from "@/modules/core/convex/server";

export async function POST(request: Request) {
  const convex = await createConvexClient();

  // Verify auth
  const me = await convex.query(api.users.me, {});
  if (!me) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const filename =
    (formData.get("filename") as string | null) ?? file?.name ?? "report.pdf";
  if (!file) {
    return NextResponse.json(
      { error: "Archivo requerido" },
      { status: 400 },
    );
  }

  const uploadUrl = await convex.mutation(api.storage.generateUploadUrl, {});
  const putRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/pdf" },
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

  return NextResponse.json({
    success: true,
    storageId,
    filename,
    size: file.size,
  });
}
