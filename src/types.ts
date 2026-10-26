export interface Property {
  id: string;
  apiId?: number;
  slug?: string;
  typeId?: number;
  cityId?: number;
  amenities?: string[];
  title: string;
  price: number;
  priceFormatted: string;
  location: string;
  postcode: string;
  beds: number;
  baths: number;
  area: string; // e.g. "12,400 sqft"
  image: string;
  tag?: "Exclusive" | "Off-Plan" | "New Listing" | "New Launch";
  type: string;
  isExclusive: boolean;
  description?: string;
}

export interface Enquiry {
  id: string;
  name: string;
  requirements: string;
  budget: string;
  date: string;
  status: "Meeting Set" | "Waitlisted" | "Pending";
  dateAdded: string;
  clientInitials: string;
  locationCountry: string;
  notes?: string;
}

export interface FilterState {
  types: string[];
  maxPrice: number;
  search: string;
  postcodes: string[];
}

export type ViewType = "home" | "properties" | "about" | "favorites" | "viewing" | "dashboard" | "login";
