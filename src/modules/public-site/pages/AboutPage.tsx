import { Award, Eye, Globe, Heart, History, Target, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ValueCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ValueCard = ({ icon, title, description }: ValueCardProps) => (
  <Card className="h-full hover:shadow-md transition-shadow">
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">{icon}</div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
    </CardHeader>
    <CardContent>
      <CardDescription className="text-gray-600 leading-relaxed">
        {description}
      </CardDescription>
    </CardContent>
  </Card>
);

export const AboutPage = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Quienes Somos
            </h1>
            <p className="mt-6 text-lg md:text-xl text-blue-100 max-w-3xl mx-auto">
              Asociacion Latinoamericana de Directores de Laboratorios de
              Investigacion
            </p>
          </div>
        </div>
      </section>

      {/* About ALADIL Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Sobre ALADIL
            </h2>
            <div className="space-y-6 text-lg text-gray-600 leading-relaxed">
              <p>
                ALADIL es una organizacion que reune a directores de
                laboratorios de investigacion de toda America Latina, con el
                objetivo de promover la colaboracion cientifica, el intercambio
                de conocimientos y el desarrollo de la investigacion en la
                region.
              </p>
              <p>
                Nuestra asociacion trabaja para fortalecer los lazos entre
                instituciones de investigacion, fomentar las mejores practicas
                en la gestion de laboratorios y contribuir al avance de la
                ciencia en beneficio de nuestras sociedades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission and Vision Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Mision y Vision
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Mision</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Promover la excelencia en la investigacion cientifica en
                  America Latina a traves de la colaboracion, el intercambio de
                  conocimientos y el fortalecimiento de las capacidades de los
                  laboratorios de investigacion, contribuyendo al desarrollo
                  cientifico y tecnologico de la region.
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-600">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Vision</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  Ser la red de referencia para la colaboracion cientifica entre
                  laboratorios de investigacion en America Latina, reconocida
                  por su impacto en el avance del conocimiento y la innovacion,
                  y por su contribucion al bienestar de las sociedades
                  latinoamericanas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-full bg-blue-100">
                  <History className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Nuestra Historia
                </h2>
              </div>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  ALADIL fue fundada en <strong>2004</strong> en{" "}
                  <strong>Vina del Mar, Chile</strong>, por un grupo de
                  visionarios directores de laboratorios que reconocieron la
                  necesidad de crear una red de colaboracion cientifica en
                  America Latina.
                </p>
                <p>
                  Desde entonces, hemos crecido hasta convertirnos en una
                  organizacion que representa a laboratorios de investigacion en
                  multiples paises de la region, facilitando el intercambio de
                  experiencias, la formacion de alianzas estrategicas y el
                  desarrollo de proyectos conjuntos.
                </p>
                <p>
                  A lo largo de mas de dos decadas, ALADIL ha organizado
                  reuniones anuales, talleres de capacitacion y ha establecido
                  convenios de colaboracion que han fortalecido la investigacion
                  cientifica latinoamericana.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
                <div className="text-center">
                  <div className="text-6xl md:text-7xl font-bold mb-2">
                    2004
                  </div>
                  <div className="text-xl text-blue-100">Ano de Fundacion</div>
                  <div className="mt-6 pt-6 border-t border-blue-500">
                    <div className="text-2xl font-semibold">Vina del Mar</div>
                    <div className="text-blue-100">Chile</div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-blue-500">
                    <div className="text-4xl font-bold">20+</div>
                    <div className="text-blue-100">Anos de trayectoria</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values/Objectives Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Nuestros Valores y Objetivos
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Los principios que guian nuestro trabajo y compromiso con la
              comunidad cientifica latinoamericana.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ValueCard
              icon={<Users className="h-5 w-5" />}
              title="Colaboracion"
              description="Fomentamos la cooperacion entre laboratorios e instituciones de investigacion para potenciar el impacto cientifico colectivo."
            />
            <ValueCard
              icon={<Award className="h-5 w-5" />}
              title="Excelencia"
              description="Promovemos los mas altos estandares de calidad en la investigacion y la gestion de laboratorios."
            />
            <ValueCard
              icon={<Globe className="h-5 w-5" />}
              title="Integracion Regional"
              description="Trabajamos por la integracion cientifica de America Latina, fortaleciendo redes de conocimiento transfronterizas."
            />
            <ValueCard
              icon={<Heart className="h-5 w-5" />}
              title="Compromiso Social"
              description="Orientamos la investigacion hacia el beneficio de las sociedades latinoamericanas y la solucion de sus desafios."
            />
            <ValueCard
              icon={<Target className="h-5 w-5" />}
              title="Innovacion"
              description="Impulsamos la adopcion de nuevas metodologias, tecnologias y practicas que mejoren la investigacion cientifica."
            />
            <ValueCard
              icon={<Eye className="h-5 w-5" />}
              title="Transparencia"
              description="Actuamos con integridad y apertura en todas nuestras actividades, promoviendo la ciencia abierta y accesible."
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 bg-blue-600 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Se Parte de ALADIL
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Unete a la red de directores de laboratorios mas importante de
            America Latina y contribuye al desarrollo cientifico de la region.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 text-lg font-semibold bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Contactanos
          </a>
        </div>
      </section>
    </div>
  );
};
