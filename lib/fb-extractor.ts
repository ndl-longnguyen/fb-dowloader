import axios from 'axios';
import * as cheerio from 'cheerio';

export interface FBVideoMedia {
  quality: 'HD' | 'SD';
  url: string;
}

export interface FBSubtitle {
  language: string;
  url?: string;
  text?: string;
}

export interface FBVideoResult {
  title: string;
  description: string;
  thumbnail: string;
  author?: string;
  duration?: string;
  subtitles: FBSubtitle[];
  medias: FBVideoMedia[];
  sourceUrl: string;
}

// Clean and validate Facebook URL
export function normalizeFBUrl(inputUrl: string): string {
  let url = inputUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  url = url.replace('m.facebook.com', 'www.facebook.com')
           .replace('mbasic.facebook.com', 'www.facebook.com')
           .replace('web.facebook.com', 'www.facebook.com');

  return url;
}

export function isValidFBUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    return (
      host.includes('facebook.com') ||
      host.includes('fb.watch') ||
      host.includes('fb.gg') ||
      host.includes('fb.com')
    );
  } catch {
    return false;
  }
}

function cleanString(str: string): string {
  try {
    return str
      .replace(/\\/g, '')
      .replace(/&amp;/g, '&')
      .replace(/\\u0025/g, '%')
      .replace(/\\u0026/g, '&');
  } catch {
    return str;
  }
}

// Extract HD, SD video links, caption text, and subtitles
export async function extractFBVideo(rawUrl: string): Promise<FBVideoResult> {
  const targetUrl = normalizeFBUrl(rawUrl);

  const desktopHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Upgrade-Insecure-Requests': '1',
  };

  let html = '';
  let finalUrl = targetUrl;

  try {
    const response = await axios.get(targetUrl, {
      headers: desktopHeaders,
      timeout: 12000,
      maxRedirects: 5,
    });
    html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    if (response.request?.res?.responseUrl) {
      finalUrl = response.request.res.responseUrl;
    }
  } catch (error: any) {
    // Try mobile fallback if desktop fails
    try {
      const mobileUrl = targetUrl.replace('www.facebook.com', 'm.facebook.com');
      const mobileResponse = await axios.get(mobileUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,vi;q=0.8',
        },
        timeout: 10000,
      });
      html = typeof mobileResponse.data === 'string' ? mobileResponse.data : JSON.stringify(mobileResponse.data);
    } catch {
      throw new Error('Không thể kết nối đến Facebook. Vui lòng kiểm tra lại đường dẫn hoặc thử lại sau.');
    }
  }

  if (!html || html.length < 100) {
    throw new Error('Không nhận được dữ liệu từ Facebook.');
  }

  let hdUrl: string | null = null;
  let sdUrl: string | null = null;
  let title = 'Facebook Video';
  let description = '';
  let thumbnail = '';
  let author = '';
  const subtitles: FBSubtitle[] = [];

  const $ = cheerio.load(html);

  // 1. Title Extraction
  const ogTitle = $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('title').text();
  if (ogTitle) {
    title = ogTitle.replace(/ \| Facebook$/i, '').trim();
  }

  // 2. Description / Post Text Extraction
  const ogDesc = $('meta[property="og:description"]').attr('content') ||
                 $('meta[name="description"]').attr('content') ||
                 $('meta[property="og:title"]').attr('content');
  if (ogDesc) {
    description = ogDesc.trim();
  }

  // Fallback description from script JSON if open graph is generic
  const descMatch = html.match(/"savable_description":\{"text":"([^"]+)"\}/) ||
                    html.match(/"message":\{"text":"([^"]+)"\}/) ||
                    html.match(/"accessibility_caption":"([^"]+)"/);
  if (descMatch && descMatch[1] && (!description || description.length < 10)) {
    description = cleanString(descMatch[1]);
  }

  // Author extraction
  const authorMatch = html.match(/"owner":\{"__typename":"User","name":"([^"]+)"\}/) ||
                      html.match(/"owner":\{"__typename":"Page","name":"([^"]+)"\}/) ||
                      html.match(/"author":\{"name":"([^"]+)"\}/);
  if (authorMatch && authorMatch[1]) {
    author = authorMatch[1];
  }

  // Thumbnail extraction
  const ogImage = $('meta[property="og:image"]').attr('content') ||
                  $('meta[name="twitter:image"]').attr('content');
  if (ogImage) {
    thumbnail = ogImage;
  }

  // 3. Subtitles / Captions Extraction from GraphQL payloads
  const captionMatches = html.matchAll(/"caption_url":"([^"]+)"/g);
  for (const match of captionMatches) {
    if (match[1]) {
      const capUrl = cleanString(match[1]);
      if (capUrl.startsWith('http')) {
        subtitles.push({
          language: 'Auto Captions',
          url: capUrl,
        });
      }
    }
  }

  // 4. Video Links Extraction
  const hdPatterns = [
    /"browser_native_hd_url":"([^"]+)"/,
    /"playable_url_quality_hd":"([^"]+)"/,
    /"hd_src":"([^"]+)"/,
    /"hd_src_no_ratelimit":"([^"]+)"/,
    /hd_src\s*:\s*"([^"]+)"/,
  ];

  for (const pattern of hdPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const candidate = cleanString(match[1]);
      if (candidate.startsWith('http')) {
        hdUrl = candidate;
        break;
      }
    }
  }

  const sdPatterns = [
    /"browser_native_sd_url":"([^"]+)"/,
    /"playable_url":"([^"]+)"/,
    /"sd_src":"([^"]+)"/,
    /"sd_src_no_ratelimit":"([^"]+)"/,
    /sd_src\s*:\s*"([^"]+)"/,
  ];

  for (const pattern of sdPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const candidate = cleanString(match[1]);
      if (candidate.startsWith('http')) {
        sdUrl = candidate;
        break;
      }
    }
  }

  if (!hdUrl && !sdUrl) {
    const ogVideo = $('meta[property="og:video"]').attr('content') ||
                    $('meta[property="og:video:secure_url"]').attr('content');
    if (ogVideo && ogVideo.startsWith('http')) {
      sdUrl = ogVideo;
    }
  }

  if (!hdUrl && !sdUrl) {
    const matches = html.match(/https?:\\\/\\\/[^"]+\.mp4[^"]*/g);
    if (matches && matches.length > 0) {
      for (const m of matches) {
        const cleaned = cleanString(m);
        if (cleaned.includes('bytestart') || cleaned.includes('.mp4')) {
          if (!sdUrl) sdUrl = cleaned;
          else if (!hdUrl && cleaned !== sdUrl) hdUrl = cleaned;
        }
      }
    }
  }

  const medias: FBVideoMedia[] = [];
  if (hdUrl) medias.push({ quality: 'HD', url: hdUrl });
  if (sdUrl && (!hdUrl || hdUrl !== sdUrl)) medias.push({ quality: 'SD', url: sdUrl });

  if (medias.length === 0) {
    throw new Error(
      'Không thể tìm thấy liên kết tải video. Video này có thể ở chế độ riêng tư, bị giới hạn hoặc đã bị xóa.'
    );
  }

  return {
    title,
    description: description || title,
    thumbnail: thumbnail || 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&auto=format&fit=crop&q=80',
    author: author || undefined,
    subtitles,
    medias,
    sourceUrl: finalUrl,
  };
}
