import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto';
import { CreateBookDto } from '../src/book/dto/create-book.dto';
import { UserRole } from '@prisma/client'; 

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');

    const adminDto: AuthDto = { email: 'admin@example.com', password: 'adminpassword' };
    const userDto: AuthDto = { email: 'user@example.com', password: 'userpassword' };

    await pactum.spec().post('/auth/signup').withBody(adminDto).expectStatus(201);
    const admin = await prisma.user.findUnique({ where: { email: adminDto.email } });
    await prisma.user.update({ where: { id: admin.id }, data: { role: UserRole.ADMIN } });

    await pactum.spec().post('/auth/signup').withBody(userDto).expectStatus(201);

    const adminSignInResponse = await pactum.spec().post('/auth/signin').withBody(adminDto);
    adminToken = adminSignInResponse.json.access_token;

    const userSignInResponse = await pactum.spec().post('/auth/signin').withBody(userDto);
    userToken = userSignInResponse.json.access_token;
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const adminDto = { email: `admin${Date.now()}@example.com`, password: 'adminpassword' }; // Email unik
    const userDto = { email: `user${Date.now()}@example.com`, password: 'userpassword' };
  
    describe('Signup', () => {
      it('should sign up as admin', async () => {
        await pactum.spec().post('/auth/signup').withBody(adminDto).expectStatus(201);
        const admin = await prisma.user.findUnique({
          where: { email: adminDto.email },
        });
        await prisma.user.update({
          where: { id: admin.id },
          data: { role: UserRole.ADMIN },
        });
      });
  
      it('should sign up as user', async () => {
        await pactum.spec().post('/auth/signup').withBody(userDto).expectStatus(201);
      });
  
      it('should throw if email already exists', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(adminDto) // Mencoba mendaftar lagi dengan email yang sama
          .expectStatus(403) // Harapkan error Forbidden karena email sudah ada
          .expectJsonLike({
            statusCode: 403,
            message: 'Email address is already taken',
            error: 'Forbidden',
          });
      });
    });
  
    describe('Signin', () => {
      it('should sign in as admin', async () => {
        const response = await pactum.spec().post('/auth/signin').withBody(adminDto).expectStatus(200);
        adminToken = response.json.access_token; // Simpan token admin setelah berhasil login
      });
  
      it('should sign in as user', async () => {
        const response = await pactum.spec().post('/auth/signin').withBody(userDto).expectStatus(200);
        userToken = response.json.access_token; // Simpan token user setelah berhasil login
      });
  
      it('should throw if email not found', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: 'nonexistent@example.com', password: 'password' })
          .expectStatus(403)
          .expectJsonLike({
            statusCode: 403,
            message: 'Credential incorrect', // Sesuaikan dengan pesan error yang Anda gunakan
            error: 'Forbidden',
          });
      });
  
      it('should throw if password incorrect', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: adminDto.email, password: 'wrongpassword' })
          .expectStatus(403)
          .expectJsonLike({
            statusCode: 403,
            message: 'Credential incorrect',
            error: 'Forbidden',
          });
      });
    });
  });

  describe('Books', () => {
    describe('Get empty book', () => {
      it('should get book', () => {
        return pactum
          .spec()
          .get('/books')
          .withHeaders({
            Authorization: `Bearer ${userToken}`,
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create Book (Admin)', () => {
      it('Should create a book as admin', () => {
        const dto: CreateBookDto = {
          code: 'book1',
          title: 'New Book',
          author: 'Author Name',
          stock: 5,
        };
        return pactum
          .spec()
          .post('/books')
          .withHeaders({
            Authorization: `Bearer ${adminToken}`, // Menggunakan token admin
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookId', 'id');
      });

      it('Should not create a book as user', () => {
        const dto: CreateBookDto = {
          code: 'book2',
          title: 'Another Book',
          author: 'Another Author',
          stock: 3,
        };
        return pactum
          .spec()
          .post('/books')
          .withHeaders({
            Authorization: `Bearer ${userToken}`, // Menggunakan token user
          })
          .withBody(dto)
          .expectStatus(403); // Forbidden, karena user tidak punya akses
      });
    });

    describe('Get Books', () => {
      it('Should Get Books', () => {
        return pactum
          .spec()
          .get('/books')
          .withHeaders({
            Authorization: `Bearer ${userToken}`,
          })
          .expectStatus(200);
      });
    });

    describe('Get Book by Id', () => {
      it('Should Get Book by Id', () => {
        return pactum
          .spec()
          .get('/books/{bookId}')
          .withHeaders({
            Authorization: `Bearer ${userToken}`,
          })
          .withPathParams('bookId', '$S{bookId}')
          .expectStatus(200);
      });
    });

    describe('Borrow Book', () => {
      it('Should Borrow Book', async () => {
        return await pactum
          .spec()
          .patch('/books/{bookId}/borrow')
          .withHeaders({
            Authorization: `Bearer ${userToken}`,
          })
          .withPathParams('bookId', '$S{bookId}')
          .expectStatus(200);
      });
    });

    describe('Return Book', () => {
      it('Should Return Book', async () => {
        return await pactum
          .spec()
          .patch('/books/{bookId}/return')
          .withHeaders({
            Authorization: `Bearer ${userToken}`,
          })
          .withPathParams('bookId', '$S{bookId}')
          .expectStatus(200);
      });
    });

    describe('Edit Book (Admin)', () => {
      it('Should edit a book as admin', () => {
        const dto = { title: 'Updated Book' };
        return pactum
          .spec()
          .patch('/books/{bookId}')
          .withHeaders({
            Authorization: `Bearer ${adminToken}`, // Menggunakan token admin
          })
          .withPathParams('bookId', '$S{bookId}')
          .withBody(dto)
          .expectStatus(200);
      });

      it('Should not edit a book as user', () => {
        const dto = { title: 'Failed Update' };
        return pactum
          .spec()
          .patch('/books/{bookId}')
          .withHeaders({
            Authorization: `Bearer ${userToken}`, // Menggunakan token user
          })
          .withPathParams('bookId', '$S{bookId}')
          .withBody(dto)
          .expectStatus(403); // Forbidden, karena user tidak punya akses
      });
    });

    describe('Delete Book', () => {
      it('Should Delete Book', () => {
        return pactum
          .spec()
          .delete('/books/{bookId}')
          .withHeaders({
            Authorization: `Bearer ${adminToken}`, // Menggunakan token admin
          })
          .withPathParams('bookId', '$S{bookId}')
          .expectStatus(200);
      });
    });
  });
});
