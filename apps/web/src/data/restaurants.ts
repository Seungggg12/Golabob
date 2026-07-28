export interface Restaurant {
    id: number;
    name: string;
    category: string;
    location: string;
    phone: string;
    description: string;
    openTime: string;
    closeTime: string;
    rating: number;
    image: string;
  }
  
  export const restaurants: Restaurant[] = [
    {
      id: 1,
      name: "고기굽는집",
      category: "고기",
      location: "강남역",
      phone: "02-1234-5678",
      description: "단체 회식 전문 고깃집입니다.",
      openTime: "11:00",
      closeTime: "22:00",
      rating: 4.8,
      image: "https://picsum.photos/400/250?random=1",
    },
  ];
  
  export const editingRestaurant = {
    id: null as number | null,
  };
  