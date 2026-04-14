import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@/modules/core/auth/auth";
import { prisma } from "@/modules/core/db";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BUCKET = "assets";

export async function POST(request: Request) {
  // Verify auth
  const session = await auth.api.getSession({
    headers: request.headers,
  });
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  // Generate storage path
  const timestamp = Date.now();
  const sanitizedName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, "-");
  const storagePath = `editor/${timestamp}-${sanitizedName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  // Upload to Supabase Storage with service role (bypasses RLS)
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir: ${uploadError.message}` },
      { status: 500 },
    );
  }

  // Create asset record
  await prisma.asset.create({
    data: {
      type: "IMAGE",
      bucket: BUCKET,
      path: storagePath,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedById: session.user.id,
    },
  });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storagePath}`;

  return NextResponse.json({ url: publicUrl });
}
