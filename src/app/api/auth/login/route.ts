import { NextRequest, NextResponse } from "next/server";

export function POST(req:NextRequest) {
    return NextResponse.json({
        firstname: "chi",
        lastname: "austine",
        email: "test@gmail.com"
    });
} 