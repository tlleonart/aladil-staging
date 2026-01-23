import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/modules/core/db";

// Fetch active executive members
async function getExecutiveMembers() {
  const members = await prisma.executiveMember.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { fullName: "asc" }],
    take: 50,
    include: {
      lab: { select: { id: true, name: true } },
      photoAsset: true,
    },
  });

  return members;
}

export const ExecutivePage = async () => {
  const members = await getExecutiveMembers();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Comite Ejecutivo
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
              Conoce a los miembros del Comite Ejecutivo de ALADIL
            </p>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Liderazgo de ALADIL
            </h2>
            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
              <p>
                El Comite Ejecutivo de ALADIL esta conformado por destacados
                directores de laboratorios de investigacion de toda America
                Latina, quienes lideran los esfuerzos de colaboracion cientifica
                y el desarrollo institucional de nuestra asociacion.
              </p>
              <p>
                Cada miembro aporta su experiencia y vision para fortalecer los
                lazos entre instituciones de investigacion y promover la
                excelencia cientifica en la region.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Members Grid Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Miembros del Comite
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Representantes de instituciones de investigacion de America Latina
            </p>
          </div>

          {/* Empty State */}
          {members.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                No hay miembros del comite ejecutivo disponibles en este
                momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {members.map((member) => (
                <Card
                  key={member.id}
                  className="text-center hover:shadow-md transition-shadow"
                >
                  <CardHeader className="pb-2">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100">
                      {member.photoAsset ? (
                        <img
                          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${member.photoAsset.bucket}/${member.photoAsset.path}`}
                          alt={member.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                          <Users className="h-10 w-10 text-blue-400" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg">{member.fullName}</CardTitle>
                    <p className="text-blue-600 font-medium">
                      {member.position}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {member.lab && (
                      <p className="text-sm text-gray-500">{member.lab.name}</p>
                    )}
                    <Badge variant="outline" className="mt-2">
                      {member.countryCode}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Forma Parte de ALADIL
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            Si tu laboratorio de investigacion desea formar parte de nuestra red
            de colaboracion cientifica, te invitamos a conocer mas sobre como
            unirte a ALADIL.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contactanos
          </a>
        </div>
      </section>
    </div>
  );
};
