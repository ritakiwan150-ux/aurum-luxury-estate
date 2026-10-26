import {
  Armchair, Baby, Bath, BedDouble, Bike, Briefcase, Building, Building2, Camera, Car, Castle,
  CircleCheck, Crown, Droplets, Dumbbell, Fan, Flame, Flower2, Gem, Hotel, House, KeyRound,
  Lamp, Landmark, Languages, Layers, Lock, MapPin, Mountain, PawPrint, Phone, School, ShieldCheck,
  Snowflake, Sofa, Sparkles, Store, Sun, Tag, Tent, TreePalm, Trees, Tv, User, Utensils,
  Warehouse, Waves, Wifi, Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type IconGroup = "Property" | "Amenities" | "General";

export interface IconOption {
  key: string;
  label: string;
  group: IconGroup;
  Icon: LucideIcon;
}

/**
 * The icon `key` is what gets stored in the database `icon` column,
 * so keep keys stable (kebab-case, same as the lucide names).
 */
export const ICON_OPTIONS: IconOption[] = [
  // Property types
  { key: "house", label: "House", group: "Property", Icon: House },
  { key: "building-2", label: "Apartment", group: "Property", Icon: Building2 },
  { key: "building", label: "Office", group: "Property", Icon: Building },
  { key: "warehouse", label: "Warehouse", group: "Property", Icon: Warehouse },
  { key: "store", label: "Shop", group: "Property", Icon: Store },
  { key: "trees", label: "Land", group: "Property", Icon: Trees },
  { key: "tree-palm", label: "Palm", group: "Property", Icon: TreePalm },
  { key: "landmark", label: "Landmark", group: "Property", Icon: Landmark },
  { key: "castle", label: "Castle", group: "Property", Icon: Castle },
  { key: "hotel", label: "Hotel", group: "Property", Icon: Hotel },
  { key: "school", label: "School", group: "Property", Icon: School },
  { key: "mountain", label: "Mountain", group: "Property", Icon: Mountain },
  { key: "tent", label: "Camp", group: "Property", Icon: Tent },
  { key: "layers", label: "Penthouse", group: "Property", Icon: Layers },
  { key: "gem", label: "Luxury", group: "Property", Icon: Gem },
  { key: "crown", label: "Premium", group: "Property", Icon: Crown },
  // Amenities
  { key: "bed-double", label: "Bedroom", group: "Amenities", Icon: BedDouble },
  { key: "bath", label: "Bathroom", group: "Amenities", Icon: Bath },
  { key: "car", label: "Parking", group: "Amenities", Icon: Car },
  { key: "waves", label: "Pool", group: "Amenities", Icon: Waves },
  { key: "dumbbell", label: "Gym", group: "Amenities", Icon: Dumbbell },
  { key: "shield-check", label: "Security", group: "Amenities", Icon: ShieldCheck },
  { key: "wifi", label: "Wi-Fi", group: "Amenities", Icon: Wifi },
  { key: "wind", label: "Air conditioning", group: "Amenities", Icon: Wind },
  { key: "snowflake", label: "Cooling", group: "Amenities", Icon: Snowflake },
  { key: "sofa", label: "Furnished", group: "Amenities", Icon: Sofa },
  { key: "armchair", label: "Lounge", group: "Amenities", Icon: Armchair },
  { key: "utensils", label: "Kitchen", group: "Amenities", Icon: Utensils },
  { key: "baby", label: "Kids area", group: "Amenities", Icon: Baby },
  { key: "paw-print", label: "Pets allowed", group: "Amenities", Icon: PawPrint },
  { key: "flame", label: "Fireplace / BBQ", group: "Amenities", Icon: Flame },
  { key: "flower-2", label: "Garden", group: "Amenities", Icon: Flower2 },
  { key: "lamp", label: "Lighting", group: "Amenities", Icon: Lamp },
  { key: "tv", label: "Cinema / TV", group: "Amenities", Icon: Tv },
  { key: "fan", label: "Ventilation", group: "Amenities", Icon: Fan },
  { key: "bike", label: "Cycling track", group: "Amenities", Icon: Bike },
  { key: "camera", label: "CCTV", group: "Amenities", Icon: Camera },
  { key: "lock", label: "Private access", group: "Amenities", Icon: Lock },
  { key: "droplets", label: "Spa / Water", group: "Amenities", Icon: Droplets },
  { key: "sun", label: "Terrace / Sun", group: "Amenities", Icon: Sun },
  // General
  { key: "map-pin", label: "Location", group: "General", Icon: MapPin },
  { key: "key-round", label: "Key", group: "General", Icon: KeyRound },
  { key: "tag", label: "Tag", group: "General", Icon: Tag },
  { key: "sparkles", label: "Sparkles", group: "General", Icon: Sparkles },
  { key: "briefcase", label: "Briefcase", group: "General", Icon: Briefcase },
  { key: "user", label: "User", group: "General", Icon: User },
  { key: "phone", label: "Phone", group: "General", Icon: Phone },
  { key: "circle-check", label: "Check", group: "General", Icon: CircleCheck },
  { key: "languages", label: "Language", group: "General", Icon: Languages },
];

const ICON_MAP = new Map(ICON_OPTIONS.map((option) => [option.key, option]));

export function getIconOption(key?: string | null): IconOption | undefined {
  return key ? ICON_MAP.get(key) : undefined;
}

/** Renders the stored icon key; renders nothing for empty/unknown keys. */
export function DynamicIcon({ name, className }: { name?: string | null; className?: string }) {
  const option = getIconOption(name);
  if (!option) return null;
  const { Icon } = option;
  return <Icon className={className} aria-hidden="true" />;
}
