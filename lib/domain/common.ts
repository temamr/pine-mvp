export type ID = string;

export type ISODate = string;

export type Money = {
  amount: number;
  currency: "USD" | "EUR" | "RUB" | "AED";
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export type Address = {
  city: string;
  region: string;
  country: string;
  label: string;
  point?: GeoPoint;
};

export type AsyncResult<T> = Promise<T>;
