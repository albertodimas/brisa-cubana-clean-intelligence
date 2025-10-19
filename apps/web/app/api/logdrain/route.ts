import { NextRequest, NextResponse } from "next/server";

const headerName = "x-vercel-verify";

const respond = (request: NextRequest) => {
  const verifyHeader = request.headers.get(headerName) ?? "";

  return new NextResponse(null, {
    status: 200,
    headers: {
      [headerName]: verifyHeader,
    },
  });
};

export const GET = respond;
export const POST = respond;
export const HEAD = respond;
