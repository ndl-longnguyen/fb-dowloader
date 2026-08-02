import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Helper to clean VTT/SRT subtitle formatting
function parseVttToCleanText(vttContent: string): { time: string; text: string }[] {
  const lines = vttContent.split(/\r?\n/);
  const result: { time: string; text: string }[] = [];
  let currentTime = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Timestamp line matching 00:00:00.000 --> 00:00:05.000
    if (line.includes('-->')) {
      currentTime = line.split('-->')[0].trim();
      continue;
    }

    // Skip WEBVTT header or empty/numeric index lines
    if (
      !line ||
      line.startsWith('WEBVTT') ||
      line.startsWith('NOTE') ||
      /^\d+$/.test(line)
    ) {
      continue;
    }

    // Remove XML/HTML tags like <c.color> or <i>
    const cleanText = line.replace(/<[^>]*>/g, '').trim();
    if (cleanText) {
      // Avoid duplicate consecutive text lines
      if (result.length === 0 || result[result.length - 1].text !== cleanText) {
        result.push({
          time: currentTime || '00:00',
          text: cleanText,
        });
      }
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subtitleUrl } = body;

    if (!subtitleUrl) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tham số subtitleUrl' },
        { status: 400 }
      );
    }

    const response = await axios.get(subtitleUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const rawContent = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const parsedSubtitles = parseVttToCleanText(rawContent);

    const fullTranscript = parsedSubtitles.map((item) => item.text).join(' ');

    return NextResponse.json({
      success: true,
      transcript: fullTranscript,
      items: parsedSubtitles,
      rawVtt: rawContent,
    });
  } catch (error: any) {
    console.error('Transcribe API error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'Không thể chuyển đổi phụ đề tự động từ Facebook.' },
      { status: 500 }
    );
  }
}
