/** Districts of Bangladesh. Dhaka maps to the Inside Dhaka delivery zone;
 *  everything else falls to Outside Dhaka. */
export const BD_DISTRICTS = [
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chattogram",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dhaka",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gazipur",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokathi",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narayanganj",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
] as const;

export const INSIDE_DHAKA_SLUG = "inside-dhaka";
export const OUTSIDE_DHAKA_SLUG = "outside-dhaka";

/** Narrows a submitted string to a real district. The delivery charge is
 *  derived from this value, so checkout treats anything else as invalid
 *  rather than falling through to the Outside Dhaka default. */
export function isBdDistrict(
  value: string,
): value is (typeof BD_DISTRICTS)[number] {
  return (BD_DISTRICTS as readonly string[]).includes(value);
}

export function zoneSlugForDistrict(district: string) {
  return district.trim().toLowerCase() === "dhaka"
    ? INSIDE_DHAKA_SLUG
    : OUTSIDE_DHAKA_SLUG;
}

/** Bangladeshi mobile numbers: 01XXXXXXXXX, optionally +88 prefixed. */
export function normalizeBdPhone(input: string) {
  const digits = input.replace(/[^\d]/g, "");
  const withoutCountry = digits.startsWith("88") ? digits.slice(2) : digits;
  return withoutCountry;
}

export function isValidBdPhone(input: string) {
  return /^01[3-9]\d{8}$/.test(normalizeBdPhone(input));
}
