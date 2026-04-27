export interface Product {
  id: string;
  name: string;
  spu?: string;
  sizes: string[];
}

export interface StockItemSize {
  size: string;
  plannedQty: number | '';
}

export interface StockItem {
  id: string;
  productId: string;
  productName: string;
  spu?: string;
  sizes: StockItemSize[];
}

export interface DocumentInfo {
  platform: string;
  store: string;
  personInCharge: string;
  shippingMethod: string;
  date: string;
}

export const DEFAULT_SIZES = ['2T', '3T', '4T', '6T', '8Y', '10Y', '12Y', '14Y'];
