import { NextRequest, NextResponse } from 'next/server';

/**
 * ScienceDojo Zoom Asset Proxy
 * Resolves 'dependent assets not accessible' by injecting mandatory CORP headers
 * into Zoom's CDN-hosted WebAssembly and worker files. 🏎️🔐
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Wait for params to resolve in Next.js 15+
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const url = `https://source.zoom.us/${path}`;

  console.log(`[Zoom Proxy] Beaming asset: ${url}`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
        console.error(`[Zoom Proxy] CDN Error (${response.status}) for: ${url}`);
        return new NextResponse(null, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const headers = new Headers();
    
    // Pass through the content type (critical for WASM - application/wasm)
    const contentType = response.headers.get('Content-Type');
    if (contentType) headers.set('Content-Type', contentType);
    
    // THE MAGIC: Inject the cross-origin permission header
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Optimize performance
    headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');

    return new NextResponse(buffer, { headers });
  } catch (error: any) {
    console.error(`[Zoom Proxy] Critical Bridge Failure:`, error.message);
    return new NextResponse(null, { status: 500 });
  }
}
