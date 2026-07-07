export class CreateReservationDto {
    restaurantId!: string;
    reservationDate!: string;
    reservationTime!: string;
    headCount!: number;
    requestMemo?: string;
  }