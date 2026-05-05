/**
 * Georef Argentina API Utility
 * Documentation: https://datosgobar.github.io/georef-ar-api/
 */

export interface Province {
  id: string;
  nombre: string;
}

export interface Locality {
  id: string;
  nombre: string;
}

const BASE_URL = "https://apis.datos.gob.ar/georef/api";

export async function getProvinces(): Promise<Province[]> {
  try {
    const response = await fetch(`${BASE_URL}/provincias?campos=id,nombre&orden=nombre`);
    if (!response.ok) throw new Error("Failed to fetch provinces");
    const data = await response.json();
    return data.provincias || [];
  } catch (error) {
    console.error("Georef Error (Provinces):", error);
    return [];
  }
}

export async function getLocalities(provinceName: string): Promise<Locality[]> {
  if (!provinceName) return [];
  try {
    // We use max=1000 to get most localities, though some provinces might have more
    const response = await fetch(
      `${BASE_URL}/localidades?provincia=${encodeURIComponent(
        provinceName
      )}&campos=id,nombre&max=1000&orden=nombre`
    );
    if (!response.ok) throw new Error("Failed to fetch localities");
    const data = await response.json();
    return data.localidades || [];
  } catch (error) {
    console.error("Georef Error (Localities):", error);
    return [];
  }
}
