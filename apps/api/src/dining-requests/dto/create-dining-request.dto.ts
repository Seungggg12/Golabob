import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateDiningRequestDto {
  @ApiProperty({ example: "강남역 회식 장소 구해요", description: "사용자가 구분하기 위한 회식 요청 제목" })
  title!: string;

  @ApiProperty({ example: "2027-12-31", description: "회식 조건 등록 항목: 미래 회식 날짜" })
  diningDate!: string;

  @ApiProperty({ example: "19:00", description: "회식 조건 등록 항목: 회식 시간, HH:mm 형식" })
  diningTime!: string;

  @ApiProperty({ example: 8, description: "회식 조건 등록 항목: 회식 인원, 2명 이상" })
  headCount!: number;

  @ApiProperty({ example: "강남역", description: "회식 조건 등록 항목: 희망 지역" })
  region!: string;

  @ApiProperty({ example: 30000, description: "회식 조건 등록 항목: 1인 예산" })
  budgetPerPerson!: number;

  @ApiPropertyOptional({ example: "고기", description: "회식 조건 등록 항목: 선호 음식 종류" })
  preferredMenu?: string;

  @ApiPropertyOptional({
    example: "룸, 주차 가능, 조용한 분위기",
    description: "요청 옵션 선택 항목: 룸, 단체석, 주차, 조용한 분위기 등",
  })
  requiredOptions?: string;

  @ApiPropertyOptional({
    example: "조용한 자리면 좋겠습니다",
    description: "요청사항 입력 항목: 사장에게 전달할 추가 요청사항",
  })
  memo?: string;
}
