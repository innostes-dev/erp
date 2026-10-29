import { NextResponse } from 'next/server';
import openapiSpec from '../../../public/openapi.json';

export async function GET() {
  return NextResponse.json(openapiSpec, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
