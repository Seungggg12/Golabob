import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateOfferDto {
  @ApiProperty({ example: "1", description: "오퍼를 보내는 식당 id. 식당 기능 연동 전까지는 임시 값으로 사용합니다." })
  restaurantId?: string;

  @ApiProperty({ example: 28000, description: "오퍼 작성 항목: 1인 제안 가격" })
  pricePerPerson?: number;

  @ApiProperty({ example: "삼겹살 + 된장찌개 + 음료", description: "오퍼 작성 항목: 메뉴 구성" })
  menuDescription?: string;

  @ApiPropertyOptional({ example: "소주 2병 서비스", description: "오퍼 작성 항목: 제공 서비스 또는 혜택" })
  serviceDescription?: string;

  @ApiPropertyOptional({ example: "룸 가능 / 최대 12명", description: "오퍼 작성 항목: 좌석 정보" })
  seatDescription?: string;

  @ApiProperty({ example: "19:00", description: "오퍼 작성 항목: 예약 가능 시간, HH:mm 형식" })
  availableTime?: string;

  @ApiPropertyOptional({
    example: "조용한 룸으로 준비해드릴 수 있습니다.",
    description: "오퍼 작성 항목: 사장 코멘트",
  })
  ownerComment?: string;

  @ApiPropertyOptional({
    example: "2026-07-09T23:59:59+09:00",
    description: "오퍼 유효 시간. 지정하지 않으면 만료 시간 없이 등록됩니다.",
  })
  expiresAt?: string;
}
