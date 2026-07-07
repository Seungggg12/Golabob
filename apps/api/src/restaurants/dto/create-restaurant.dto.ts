export class CreateRestaurantDto {
    name!: string;
    address!: string;
    category!: string;
    description?: string;
    maxCapacity!: number;
    hasRoom?: boolean;
    hasParking?: boolean;
    openTime!: string;
    closeTime!: string;
  }