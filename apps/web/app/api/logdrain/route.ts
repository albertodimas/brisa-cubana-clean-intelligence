import { NextResponse } from "next/server";

const headerName = "x-vercel-verify";
const verificationCode =
  process.env.LOG_DRAIN_VERIFICATION_CODE ??
  "7f4677dfb49b149c4a67d45e84e0bcaab835ea50";

const respond = () =>
  new NextResponse(null, {
    status: 200,
    headers: {
      [headerName]: verificationCode,
    },
  });

export const GET = respond;
export const POST = respond;
export const HEAD = respond;
