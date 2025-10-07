"use client";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const publicEnv = {
  apiUrl,
};

export type PublicEnv = typeof publicEnv;
