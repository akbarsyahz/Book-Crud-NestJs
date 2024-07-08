import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto, EditBookDto } from './dto';
import { addDays } from 'date-fns';


@Injectable()
export class BookService {
  constructor(private prisma: PrismaService) {}

  // Create a new book
  async createBook(userId: number, dto: CreateBookDto) {
    const book = await this.prisma.book.create({
      data: {
        ...dto
      },
    });
    return book;
  }


  // Get all books
  async getBooks(userId: number) {
    return await this.prisma.book.findMany({
      where: { 
        borrowed: false 
      },
    });
  }

  // Get a book by its ID
  async getBookById(userId: number, bookId: number) {
    return await this.prisma.book.findUnique({
      where: { 
        id: bookId,
      },
    });
  }

  // Edit a book's details
  async editBook(userId: number, bookId: number, dto: EditBookDto) {
    return await this.prisma.book.update({
      where: {
        id: bookId,
      },
      data: dto,
    });
  }

  // Delete a book
  async deleteBook(bookId: number) {
    return await this.prisma.book.delete({
      where: { id: bookId },
    });
  }


  // Borrow a book
async borrowBook(userId: number, bookId: number) {
  try {
    console.log('UserID:', userId);
    console.log('BookID:', bookId);
    console.log(`Borrowing book ${bookId} for user ${userId}`);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { borrowedBooks: true, penalties: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }


    if (user.borrowedBooks.length >= 2) {
      throw new ForbiddenException('Sorry you just can borrow 2 books');
    }

    const activePenalty = user.penalties.some(penalty => penalty.endDate > new Date());
    if (activePenalty) {
      throw new ForbiddenException('You is currently penalized');
    }

    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (book.borrowed) {
      throw new ForbiddenException('Book is already borrowed');
    }

    console.log(`Updating book ${bookId} status to borrowed`);
    return await this.prisma.book.update({
      where: { id: bookId },
      data: {
        borrowed: true,
        borrowerId: userId,
      },
    });
  } catch (error) {
    console.error(`Failed to borrow book for user ${userId}: ${error.message}`);
    throw error;
  }
}

// Return a book
async returnBook(userId: number, bookId: number) {
  try {
    console.log(`Returning book ${bookId} for user ${userId}`);
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (!book.borrowed || book.borrowerId !== userId) {
      throw new ForbiddenException('This book was not borrowed by the user');
    }

    const borrowDate = book.updatedAt;
    const returnDate = new Date();
    const daysBorrowed = Math.ceil(
      (returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysBorrowed > 7) {
      const penaltyEndDate = addDays(returnDate, 3);
      await this.prisma.penalty.create({
        data: {
          userId: userId,
          startDate: returnDate,
          endDate: penaltyEndDate,
        },
      });
    }

    console.log(`Updating book ${bookId} status to returned`);
    return await this.prisma.book.update({
      where: { id: bookId },
      data: {
        borrowed: false,
        borrowerId: null,
      },
    });
  } catch (error) {
    console.error(`Failed to return book for user ${userId}: ${error.message}`);
    throw error;
  }
}


  // Show all books and their quantities
  async getAllBooks() {
    return await this.prisma.book.findMany();
  }

  // Show all members and the number of books being borrowed by each member
  async getAllMembers() {
    const members = await this.prisma.user.findMany({
      where: {
        borrowedBooks: {
          some: {
            borrowerId: {
              not: null, // Filter hanya pengguna yang meminjam buku
            },
          },
        },
      },
      select: { 
        email: true,
        firstName: true,
        lastName: true,
        borrowedBooks: {
          select: {
            id: true,
            code: true,
            title: true,
            author: true,
            stock: true,
            borrowed: true,
          },
        },
      },
    });
  
    return members.map(member => ({
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      borrowedBooks: member.borrowedBooks,
      booksBorrowed: member.borrowedBooks.length,
    }));
  }
}
