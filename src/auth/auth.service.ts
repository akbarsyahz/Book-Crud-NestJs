import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService){}

    async signIn(dto: AuthDto){

       const user = 
       await this.prisma.user.findUnique({
        where: {
            email: dto.email,
        },
       });


    }

    async signUp(dto: AuthDto){

        const hash = await argon.hash(dto.password);

        try {
        //save the new user in the db
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                hash,
            },
        });

        delete user.hash;

        return user;
        } catch (error) {
            console.error('Error in signUp:', error); // Log the error
            if(error instanceof PrismaClientKnownRequestError){
                console.log('Error message:', error.message); // Log the error message
                if (error.message.includes('Unique constraint failed on the fields: (`email`)')) {
                    throw new ForbiddenException('Email address is already taken');
                }
            }
            throw error;
        }
    }
}