import { NextResponse } from "next/server";
import { headers } from 'next/headers'

export function GET() {

    const authorization = headers().get('Authorization')

    const access_tokn = authorization?.split(" ")[1];

    if (access_tokn == "access_token") {
        return NextResponse.json({
            firstname: "chi",
            lastname: "austine",
            email: "test@gmail.com"
        }, {
            status: 200
        });
    } else {
        return NextResponse.json({
            message: "Unauthorized"
        }, {
            status: 401
        })
    }
}