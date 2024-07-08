import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards, Logger, NotFoundException } from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto, EditBookDto } from './dto';
import { JwtGuard } from '../auth/guard';
import { GetUser } from '../auth/decorator';
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { BookDto } from './dto/book.dto';
import { UserRole } from '@prisma/client';
import { RolesGuard, Roles } from '../user/guard';

@ApiBearerAuth()
@ApiTags('books')
@UseGuards(JwtGuard, RolesGuard)
@Controller('books')
export class BookController {
  private readonly logger = new Logger(BookController.name);
  constructor(private bookService: BookService) {}

  @ApiOperation({ summary: 'Create a book' })
  @ApiCreatedResponse({ description: 'The book has been successfully created'})
  @ApiOkResponse({ description: 'Create a Book', type: BookDto })
  @ApiBody({ type: CreateBookDto })
  @Roles(UserRole.ADMIN)
  @Post()
  createBook(@GetUser('id') userId: number, @Body() dto: CreateBookDto) {
    this.logger.log(`Creating book for user ${userId}`);
    return this.bookService.createBook(userId, dto);
  }

  @ApiOperation({ summary: 'Get all books' })
  @ApiOkResponse({ description: 'Returns all books', type: [BookDto] })
  @Roles(UserRole.ADMIN, UserRole.USER) 
  @Get()
  getBooks(@GetUser('id') userId: number) {
    this.logger.log(`Getting books for user ${userId}`);
    return this.bookService.getBooks(userId);
  }


  @ApiOperation({ summary: 'See Book Being Borrowed' })
  @ApiOkResponse({ description: 'Returns all books', type: [BookDto] })
  @Roles(UserRole.ADMIN) 
  @Get('borrowed')
  getBookBorrow(@GetUser('id') userId: number) {
    this.logger.log(`Getting books for user ${userId}`);
    return this.bookService.getAllMembers();
  }

  @ApiOperation({ summary: 'Get a book by ID' })
  @ApiOkResponse({ description: 'Returns a book by ID', type: [BookDto] })
  @ApiParam({ name: 'id', description: 'Book ID', type: Number })
  @Roles(UserRole.ADMIN, UserRole.USER) 
  @Get(':id')
  getBookById(@GetUser('id') userId: number, @Param('id', ParseIntPipe) bookId: number) {
    this.logger.log(`Getting book ${bookId} for user ${userId}`);
    return this.bookService.getBookById(userId, bookId);
  }

  @ApiOperation({ summary: 'Edit a book' })
  @ApiOkResponse({ description: 'The book has been successfully edited', type: [BookDto]  })
  @ApiParam({ name: 'id', description: 'Book ID', type: Number })
  @ApiBody({ type: EditBookDto })
  @Roles(UserRole.ADMIN) 
  @Patch(':id')
  editBook(@GetUser('id') userId: number, @Param('id', ParseIntPipe) bookId: number, @Body() dto: EditBookDto) {
    this.logger.log(`Editing book ${bookId} for user ${userId}`);
    return this.bookService.editBook(userId, bookId, dto);
  }

  @ApiOperation({ summary: 'Borrow a book' })
  @ApiOkResponse({ description: 'The book has been successfully borrowed', type: BookDto })
  @ApiNotFoundResponse({ description: 'Book not found' })
  @ApiParam({ name: 'id', description: 'Book ID', type: Number })
  @Roles(UserRole.USER) 
  @Patch(':id/borrow')
  async borrowBook(@GetUser('id') userId: number, @Param('id', ParseIntPipe) bookId: number) {
    try {
      this.logger.log(`Borrowing book ${bookId} for user ${userId}`);
      return await this.bookService.borrowBook(userId, bookId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Book not found');
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Return a book' })
  @ApiOkResponse({ description: 'The book has been successfully returned', type: BookDto })
  @ApiParam({ name: 'id', description: 'Book ID', type: Number })
  @Roles(UserRole.USER) 
  @Patch(':id/return')
  returnBook(@GetUser('id') userId: number, @Param('id', ParseIntPipe) bookId: number) {
    this.logger.log(`Returning book ${bookId} for user ${userId}`);
    return this.bookService.returnBook(userId, bookId);
  }

  @ApiOperation({ summary: 'Delete a book' })
  @ApiOkResponse({ description: 'The book has been successfully deleted', type: BookDto })
  @ApiParam({ name: 'id', description: 'Book ID', type: Number })
  @Roles(UserRole.ADMIN)  
  @Delete(':id')
  deleteBook(@Param('id', ParseIntPipe) bookId: number) {
    this.logger.log(`Deleting book ${bookId}`);
    return this.bookService.deleteBook(bookId);
  }
}
