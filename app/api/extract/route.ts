import { NextRequest, NextResponse } from 'next/server';
import { extractFBVideo, isValidFBUrl } from '@/lib/fb-extractor';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp đường dẫn video Facebook hợp lệ.' },
        { status: 400 }
      );
    }

    if (!isValidFBUrl(url)) {
      return NextResponse.json(
        { success: false, error: 'Đường dẫn không hợp lệ. Vui lòng nhập liên kết Facebook (fb.watch, facebook.com/watch, reels, post).' },
        { status: 400 }
      );
    }

    const result = await extractFBVideo(url);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('FB Extract API Error:', error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Đã xảy ra lỗi khi trích xuất video từ Facebook. Vui lòng thử lại.',
      },
      { status: 500 }
    );
  }
}
