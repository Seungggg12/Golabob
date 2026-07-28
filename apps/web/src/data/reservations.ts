export interface Reservation {
    id: number;
    restaurantName: string;
    date: string;
    time: string;
    people: number;
    status: string;
  }
  
  export const reservations: Reservation[] = [];
  