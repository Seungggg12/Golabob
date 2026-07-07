export class CreateReviewDto {
    reservationId!: string;
    restaurantId!: string;
    rating!: number;
    content!: string;
  }