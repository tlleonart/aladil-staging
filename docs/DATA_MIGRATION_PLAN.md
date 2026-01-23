# ALADIL Data Migration Plan

## Overview

This plan outlines the data to be migrated from the legacy portal (https://aladil.org) to populate the new intranet database.

## Data Sources

| Entity | Source | Notes |
|--------|--------|-------|
| Labs | Legacy portal + manual research | ~15 laboratories across 10 countries |
| Executive Committee | Legacy portal | 4 current members |
| Meetings | Legacy portal | 37+ meetings (2004-2026) |
| News | N/A | No news section on legacy site |
| Contact Messages | N/A | Start fresh |

---

## 1. Labs (Laboratorios Socios)

### Known Laboratories

| Name | Country | Country Code | City | Website |
|------|---------|--------------|------|---------|
| Cibic Laboratorios | Argentina | AR | Rosario | https://cibic.com.ar |
| LAC | Uruguay | UY | Montevideo | https://lac.com.uy |
| Laboratorio Amadita | Dominican Republic | DO | Santo Domingo | https://amadita.com |
| Meyer Lab | Paraguay | PY | Asunción | https://meyerlab.com.py |
| Biomédica de Referencia | Mexico | MX | Mexico City | https://bioref.com.mx |
| MedLab | Peru | PE | Lima | https://medlab.pe |
| Laboratorios Fleury | Brazil | BR | São Paulo | https://fleury.com.br |
| LABIN | Costa Rica | CR | San José | https://labin.co.cr |
| Hospital Universitario Martín Dockweiler | Bolivia | BO | Santa Cruz | TBD |
| TBD | Colombia | CO | TBD | TBD |
| TBD | Guatemala | GT | TBD | TBD |
| TBD | Honduras | HN | TBD | TBD |

### Data Structure (Prisma `Lab` model)
```typescript
{
  name: string,
  countryCode: string,  // ISO 3166-1 alpha-2
  city: string | null,
  websiteUrl: string | null,
  isActive: boolean,
  sortOrder: number,
  logoAssetId: string | null  // Upload logos to Supabase Storage
}
```

### Action Items
- [ ] Verify all laboratory names and websites
- [ ] Collect logo images for each laboratory
- [ ] Upload logos to Supabase Storage
- [ ] Confirm laboratories from Colombia, Guatemala, Honduras


### Actions taken:

- Laboratory names and websites:

Amadita https://amadita.com (República Dominicana)
Biotest https://biotest.com (Guatemala)
Labin https://labinlab.com (Costa Rica)
Laboratorio Médico de Referencia https://www.labmedico.com (Colombia)
Diagnóstico do Brasil https://www.diagnosticosdobrasil.com.br (Brasil)
Hospital Universitario Martín Dockweiler https://www.udabol.edu.bo/internacional/hospital-universitario-2/ (Bolivia)
Meyer Lab https://www.meyerlab.com.py (Paraguay)
LAC https://www.lac.com.uy (Uruguay)
Cibic https://cibic.com.ar (Argentina)
Laboratorio Centro Médico Honduras https://laboratorioscentromedico.hn (Honduras)

- Logos:

https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/amadita.webp -> Amadita
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/biotest.webp -> Biotest
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/labin.webp -> Labin
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/laboratorio_medico_referencia.webp -> Laboratorio medico de referencia
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/db.webp -> Diagnostico do Brasil
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/meyer.webp -> Meyerlab
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/lac.webp -> LAC
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/cibic.webp -> Cibic
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/cp.webp -> Martin Dockweiler
https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/lab-logos/lcm.webp -> Hospital Universitario Martín Dockweiler

---

## 2. Executive Committee (Comité Ejecutivo)

### Current Members (2025)

| Name | Position | Laboratory | Country | Country Code | Sort Order |
|------|----------|------------|---------|--------------|------------|
| Fabián Fay | Presidente | Cibic Laboratorios | Argentina | AR | 1 |
| Milton Fornella | Vice Presidente | LAC | Uruguay | UY | 2 |
| Giancarlo Sanguinetti | Vice Presidente | Laboratorio Amadita | Dominican Republic | DO | 3 |
| Paulo Díaz Meyer | Tesorero | Meyer Lab | Paraguay | PY | 4 |

### Data Structure (Prisma `ExecutiveMember` model)
```typescript
{
  fullName: string,
  position: string,
  countryCode: string,
  sortOrder: number,
  isActive: boolean,
  labId: string | null,      // FK to Lab
  photoAssetId: string | null // Upload photos to Supabase Storage
}
```

### Action Items
- [ ] Collect headshot photos for each member
- [ ] Upload photos to Supabase Storage
- [ ] Link members to their respective laboratories

### Action taken:

- Members with labs and headshots:

Fabián Fay, Cibic, https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/executives/Fabian.webp
Milton Fornella, LAC, https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/executives/Milton.jpg
Giancarlo Sanguinetti, Laboratorio Amadita, https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/executives/Giancarlo.jpg
Paulo Díaz Meyer, Meyer Lab, https://lvcgwvgmwzreamiqjjun.supabase.co/storage/v1/object/public/assets/executives/Paulo.webp

---

## 3. Meetings (Reuniones)

### Historical Meetings (2004-2026)

| # | City | Country | Code | Date | Host Laboratory |
|---|------|---------|------|------|-----------------|
| 37 | San José | Costa Rica | CR | May 2026 | LABIN |
| 36 | Santa Cruz de la Sierra | Bolivia | BO | Nov 6-7, 2025 | Hospital U. Martín Dockweiler |
| 35 | Asunción | Paraguay | PY | Jun 2025 | Meyer Lab |
| 34 | Montevideo | Uruguay | UY | 2024 | LAC |
| 33 | Rosario | Argentina | AR | 2023 | Cibic |
| 32 | Antigua | Guatemala | GT | 2022 | TBD |
| 31 | TBD | TBD | TBD | 2021 | TBD |
| ... | ... | ... | ... | ... | ... |
| 1 | Viña del Mar | Chile | CL | May 2004 | Dr. Ivo Sapunar |

### Data Structure (Prisma `Meeting` model)
```typescript
{
  number: number,
  title: string,           // "Reunión #36 | Santa Cruz de la Sierra, Bolivia"
  slug: string,            // "reunion-36-santa-cruz-bolivia"
  city: string,
  country: string,
  countryCode: string,
  startDate: Date,
  endDate: Date | null,
  hostName: string | null,
  hostLabId: string | null,
  summary: string | null,
  content: JSON | null,
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
  coverAssetId: string | null,
  topicsPdfAssetId: string | null
}
```

### Action Items
- [ ] Research complete meeting history (meetings 1-31)
- [ ] Collect cover images for each meeting
- [ ] Collect topics PDFs if available
- [ ] Collect gallery photos for recent meetings
- [ ] Determine exact dates for all meetings

---

## 4. News Posts (Noticias)

The legacy portal does not have a news section. This will start as empty content.

### Future Content Ideas
- Meeting announcements
- Member laboratory updates
- Industry news
- Annual reports

---

## 5. Assets (Media Files)

### Asset Categories

| Category | Quantity (Est.) | Bucket |
|----------|-----------------|--------|
| Lab Logos | ~15 | `logos` |
| Executive Photos | 4 | `photos` |
| Meeting Covers | ~37 | `meetings` |
| Meeting Galleries | ~100+ | `meetings` |
| Meeting PDFs | ~30 | `documents` |

### Supabase Storage Buckets to Create
```
aladil-assets/
├── logos/           # Laboratory logos
├── photos/          # Executive member photos
├── meetings/        # Meeting covers and galleries
└── documents/       # PDFs and other documents
```

---

## 6. Seed Script Structure

### File: `prisma/seed-content.ts`

```typescript
// Phase 1: Labs (no dependencies)
const labs = await seedLabs();

// Phase 2: Executive Members (depends on Labs)
const executives = await seedExecutiveMembers(labs);

// Phase 3: Meetings (depends on Labs)
const meetings = await seedMeetings(labs);

// Phase 4: Assets (upload to Supabase Storage)
// - Lab logos
// - Executive photos
// - Meeting covers
```

---

## 7. Country Codes Reference

| Country | ISO Code | Flag Emoji |
|---------|----------|------------|
| Argentina | AR | 🇦🇷 |
| Bolivia | BO | 🇧🇴 |
| Brazil | BR | 🇧🇷 |
| Chile | CL | 🇨🇱 |
| Colombia | CO | 🇨🇴 |
| Costa Rica | CR | 🇨🇷 |
| Dominican Republic | DO | 🇩🇴 |
| Guatemala | GT | 🇬🇹 |
| Honduras | HN | 🇭🇳 |
| Mexico | MX | 🇲🇽 |
| Paraguay | PY | 🇵🇾 |
| Peru | PE | 🇵🇪 |
| Uruguay | UY | 🇺🇾 |

---

## 8. Implementation Order

1. **Create Supabase Storage buckets**
2. **Seed Labs** (with placeholder logos)
3. **Seed Executive Committee** (linked to labs)
4. **Seed Meetings** (linked to host labs)
5. **Upload Assets** (logos, photos, meeting images)
6. **Update records** with asset references

---

## 9. Manual Data Collection Needed

### Priority 1 (Required)
- [ ] Complete list of member laboratories with websites
- [ ] Executive committee member photos
- [ ] Meeting dates for meetings #1-31

### Priority 2 (Nice to Have)
- [ ] Laboratory logo images
- [ ] Meeting cover photos
- [ ] Meeting gallery photos
- [ ] Topics PDFs for past meetings

---

## 10. Estimated Effort

| Task | Time Estimate |
|------|---------------|
| Manual research & data collection | 2-4 hours |
| Create seed script | 1-2 hours |
| Upload assets to Supabase | 1-2 hours |
| Testing & verification | 1 hour |
| **Total** | **5-9 hours** |
