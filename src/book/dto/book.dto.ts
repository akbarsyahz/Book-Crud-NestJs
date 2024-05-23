import { ApiProperty } from '@nestjs/swagger';

export class BookDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  author: string;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  ownerId: number;

  // Tambahkan properti lain sesuai kebutuhan

  constructor(partial: Partial<BookDto>) {
    Object.assign(this, partial);
  }
}
