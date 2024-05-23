import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwt: JwtService, private config: ConfigService){}

    async signIn(dto: AuthDto){

       const user = 
       await this.prisma.user.findUnique({
        where: {
            email: dto.email,
        },
       });
       if (!user){
            throw new ForbiddenException(
                'Credential incorrect'
            );
       }

       const pwMatches = await argon.verify(user.hash, dto.password);

       if(!pwMatches){
        throw new ForbiddenException(
            'Credential incorrect'
        );
       }

       return this.signToken(user.id, user.email);
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

        return this.signToken(user.id, user.email);
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

    async signToken(userId: number, email: string): Promise<{access_token: string}>{
        const payload = {
            sub: userId,
            email,
        };

        const secret = this.config.get('JWT_SECRET');

        const token = await this.jwt.signAsync(payload,{
            expiresIn: '15m',
            secret: secret,
        },
    );

        return {
            access_token: token,
        };
    }
}