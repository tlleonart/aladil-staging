import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { auth } from "@/modules/core/auth/auth";
import { hasPermission } from "@/modules/core/auth/rbac";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: Request) {
  // Verify auth
  const { headers: reqHeaders } = request;
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verify PILA manage permission
  const allowed = await hasPermission(session.user.id, "PILA", "pila.manage");
  if (!allowed) {
    return NextResponse.json({ error: "Permiso denegado" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const storagePath = formData.get("storagePath") as string | null;

  if (!file || !storagePath) {
    return NextResponse.json(
      { error: "Archivo y storagePath requeridos" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabaseAdmin.storage
    .from("assets")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: `Error al subir: ${uploadError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, storagePath });
}
