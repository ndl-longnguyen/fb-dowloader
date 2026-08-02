import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'fb_video.mp4';

  if (!videoUrl) {
    return NextResponse.json(
      { error: 'Missing video url parameter' },
      { status: 400 }
    );
  }

  try {
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      timeout: 30000,
    });

    const headers = new Headers();
    const rawContentType = response.headers['content-type'];
    const contentType = typeof rawContentType === 'string' ? rawContentType : 'video/mp4';
    const rawContentLength = response.headers['content-length'];

    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

    if (rawContentLength) {
      headers.set('Content-Length', String(rawContentLength));
    }

    // Convert node readable stream to Web ReadableStream
    const nodeStream = response.data;
    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err: any) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Proxy Download Error:', error?.message || error);
    // If proxy streaming fails, redirect client directly to the original video CDN URL
    return NextResponse.redirect(videoUrl);
  }
}
