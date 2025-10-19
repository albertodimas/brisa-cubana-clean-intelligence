import { NextResponse } from "next/server";

const headerName = "x-vercel-verify";
const verificationCode = process.env.LOG_DRAIN_VERIFICATION_CODE;

const respond = () => {
  if (!verificationCode) {
    return new NextResponse(
      "Missing LOG_DRAIN_VERIFICATION_CODE environment variable",
      { status: 500 },
    );
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      [headerName]: verificationCode,
    },
  });
};

export const GET = respond;
export const POST = respond;
export const HEAD = respond;
