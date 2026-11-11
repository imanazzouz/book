import { getAllCommunes, getWilayas } from 'algeria-geo';

/**
 * Official Algerian administrative divisions, 69 wilayas (Law 26-06).
 *
 * The data comes from `algeria-geo` (MIT), which transcribes the Journal
 * Officiel lists. Counts are *data*: nothing in the application hardcodes 69 or
 * 1 541 — the seed reports what the source contains and the CI check asserts it
 * still matches the official figures.
 */
export const OFFICIAL_WILAYA_COUNT = 69;
export const OFFICIAL_COMMUNE_COUNT = 1541;

export interface WilayaSeedRow {
  code: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  phoneCode: string | null;
  isNewWilaya: boolean;
  sortOrder: number;
}

export interface CommuneSeedRow {
  code: string;
  wilayaCode: string;
  dairaCode: string | null;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  postCode: string | null;
  latitude: string | null;
  longitude: string | null;
}

function coordinate(value: number | null | undefined): string | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value.toFixed(6);
}

export function buildWilayaRows(): WilayaSeedRow[] {
  return getWilayas(OFFICIAL_WILAYA_COUNT as 69).map((wilaya) => ({
    code: wilaya.code,
    nameAr: wilaya.name_ar,
    nameFr: wilaya.name_fr,
    nameEn: wilaya.name_en,
    phoneCode: wilaya.phone_code ? wilaya.phone_code.slice(0, 6) : null,
    isNewWilaya: Boolean(wilaya.is_new_wilaya),
    sortOrder: Number.parseInt(wilaya.code, 10),
  }));
}

export function buildCommuneRows(): CommuneSeedRow[] {
  return getAllCommunes(OFFICIAL_WILAYA_COUNT as 69).map((commune) => ({
    code: commune.code,
    wilayaCode: commune.wilaya_code,
    dairaCode: commune.daira_code,
    nameAr: commune.name_ar,
    nameFr: commune.name_fr,
    nameEn: commune.name_en,
    postCode: commune.post_code ?? null,
    latitude: coordinate(commune.latitude),
    longitude: coordinate(commune.longitude),
  }));
}
