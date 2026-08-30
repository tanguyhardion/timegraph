export type WatchAvailability = 'in_stock' | 'out_of_stock' | 'pre_order' | 'waitlist' | 'unknown';

export type WatchStatus = 'wishlist' | 'acquired';

export type WatchOccasion =
  | 'Birthday'
  | 'Anniversary'
  | 'Milestone'
  | 'Promotion'
  | 'Graduation'
  | 'Wedding'
  | 'New Child'
  | 'Retirement'
  | 'Grail Goal'
  | 'Just Because';

export interface WatchSpecs {
  caseDiameter?: string;      // e.g. "40mm"
  caseThickness?: string;     // e.g. "12.4mm"
  lugToLug?: string;          // e.g. "47.5mm"
  lugWidth?: string;          // e.g. "20mm"
  movementCaliber?: string;   // e.g. "Calibre 4131"
  movementType?: 'Automatic' | 'Manual-Wind' | 'Quartz' | 'Spring Drive' | 'Co-Axial';
  powerReserve?: string;      // e.g. "72 hours"
  waterResistance?: string;   // e.g. "100m / 330ft"
  caseMaterial?: string;      // e.g. "Oystersteel", "18k Rose Gold", "Titanium"
  dialColor?: string;         // e.g. "Sunburst Silver", "Piano Black", "Snowflake White"
  crystal?: string;           // e.g. "Domed Sapphire with AR Coating"
  bezel?: string;             // e.g. "Cerachrom Ceramic tachymeter"
}

export interface PriceHistoryPoint {
  id: string;
  watchId: string;
  price: number;
  currency: string;
  availability: WatchAvailability;
  recordedAt: string;         // ISO String
  note?: string;              // e.g. "Price drop of 8.5%", "Back in stock"
}

export interface Watch {
  id: string;
  url: string;
  title: string;
  brand: string;
  model: string;
  referenceNumber?: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  lowestRecordedPrice?: number;
  highestRecordedPrice?: number;
  priceDropPercentage?: number;
  availability: WatchAvailability;
  occasion: WatchOccasion;
  status: WatchStatus;
  acquiredDate?: string;
  imageUrl: string;
  additionalImages?: string[];
  specs: WatchSpecs;
  notes?: string;
  retailerName?: string;
  lastScrapedAt?: string;
  scrapeStatus: 'success' | 'stale' | 'failed' | 'manual';
  scrapeErrorMessage?: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  priceHistory?: PriceHistoryPoint[];
}

export interface ScrapedWatchData {
  url: string;
  title?: string;
  brand?: string;
  model?: string;
  referenceNumber?: string;
  price?: number;
  originalPrice?: number;
  currency?: string;
  availability?: WatchAvailability;
  imageUrl?: string;
  additionalImages?: string[];
  specs?: WatchSpecs;
  retailerName?: string;
  rawDescription?: string;
}

export interface FilterOptions {
  status: WatchStatus;
  occasion?: WatchOccasion | 'All';
  brand?: string | 'All';
  availability?: WatchAvailability | 'All';
  searchQuery?: string;
  sortBy: 'price-asc' | 'price-desc' | 'date-newest' | 'date-oldest' | 'price-drop' | 'order';
}
