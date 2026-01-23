import { prisma } from "@/modules/core/db";
import { LaboratoriesContent } from "./LaboratoriesContent";

// Fetch active laboratories
async function getLaboratories() {
  const labs = await prisma.lab.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: 50,
    include: {
      logoAsset: true,
    },
  });

  return labs;
}

export const LaboratoriesPage = async () => {
  const labs = await getLaboratories();

  // Transform data for client component
  const labsData = labs.map((lab) => ({
    id: lab.id,
    name: lab.name,
    countryCode: lab.countryCode,
    city: lab.city,
    websiteUrl: lab.websiteUrl,
    logoUrl: lab.logoAsset
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${lab.logoAsset.bucket}/${lab.logoAsset.path}`
      : null,
  }));

  return <LaboratoriesContent labs={labsData} />;
};
