import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto';
import { CreateBookDto } from '../src/book/dto/create-book.dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'akbarsyah@gmail.com',
      password: '123131313',
    };

    it('should throw if email empty', () => {
      return pactum
        .spec()
        .post('/auth/signup')
        .withBody({
          password: dto.password,
        })
        .expectStatus(400);
    });

    it('should throw if password empty', () => {
      return pactum
        .spec()
        .post('/auth/signup')
        .withBody({
          email: dto.email,
        })
        .expectStatus(400);
    });

    it('should throw if no body provided', () => {
      return pactum
        .spec()
        .post('/auth/signup')
        .expectStatus(400);
    });

    describe('Signup', () => {
      it('Should Sign Up', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('Should Sign In', async () => {
        const response = await pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get Me', () => {
      it('Should Get Current User', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit User', () => {
      it('Should Edit User', () => {
        const dto = { firstName: 'John', lastName: 'Doe' };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(200);
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
            Authorization: 'Bearer $S{userAt}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Create Book', () => {
      it('Should Create Book', async () => {
        // Update the stock value to a number
        const dto: CreateBookDto = {
          code: 'book1',
          title: 'New Book',
          author: 'Author Name',
          stock: 5, // Change the stock value to a number
        };
        return await pactum
          .spec()
          .post('/books')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookId', 'id');
      });
    });

    describe('Get Books', () => {
      it('Should Get Books', () => {
        return pactum
          .spec()
          .get('/books')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
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
            Authorization: 'Bearer $S{userAt}',
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
        Authorization: 'Bearer $S{userAt}',
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
        Authorization: 'Bearer $S{userAt}',
      })
      .withPathParams('bookId', '$S{bookId}')
      .expectStatus(200);
  });
});


    describe('Edit Book', () => {
      it('Should Edit Book', () => {
        const dto = { title: 'Updated Book' };
        return pactum
          .spec()
          .patch('/books/{bookId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withPathParams('bookId', '$S{bookId}')
          .withBody(dto)
          .expectStatus(200);
      });
    });

   

    describe('Delete Book', () => {
      it('Should Delete Book', () => {
        return pactum
          .spec()
          .delete('/books/{bookId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}',
          })
          .withPathParams('bookId', '$S{bookId}')
          .expectStatus(200);
      });
    });

    

   
  });
});
