export class UpdateRestaurantDto {
  name?: string;

  address?: string;

  phone?: string;

  imageUrl?: string;

  category?: string;

  description?: string;

  maxCapacity?: number;

  hasRoom?: boolean;

  hasParking?: boolean;

  openTime?: string;

  closeTime?: string;
}