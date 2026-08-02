'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Download,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Check,
  RefreshCw,
  Zap,
  ShieldCheck,
  Smartphone,
  ChevronDown,
  Video,
  X,
  Award,
  FileText,
  MessageSquareText,
  FileType,
  Mic,
  MicOff,
  Subtitles,
  Globe,
  Clock,
} from 'lucide-react';

interface FBVideoMedia {
  quality: 'HD' | 'SD';
  url: string;
}

interface FBSubtitle {
  language: string;
  url?: string;
  text?: string;
}

interface FBVideoResult {
  title: string;
  description: string;
  thumbnail: string;
  author?: string;
  duration?: string;
  subtitles: FBSubtitle[];
  medias: FBVideoMedia[];
  sourceUrl: string;
}

interface TranscriptItem {
  time: string;
  text: string;
}

export default function HomePage() {
  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<FBVideoResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedStt, setCopiedStt] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'video' | 'text' | 'stt'>('video');

  // Speech-to-Text State
  const [isListening, setIsListening] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [sttLanguage, setSttLanguage] = useState<'vi-VN' | 'en-US'>('vi-VN');
  const [parsedSubtitles, setParsedSubtitles] = useState<TranscriptItem[]>([]);
  const [transcribingSub, setTranscribingSub] = useState(false);

  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = sttLanguage;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          setSpeechTranscript(currentTranscript.trim());
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [sttLanguage]);

  // Toggle Live STT
  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ Web Speech Recognition API. Hãy thử trên Chrome hoặc Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = sttLanguage;
        recognitionRef.current.start();
        setIsListening(true);

        // Also play video preview if available
        if (videoRef.current) {
          videoRef.current.play();
        }
      } catch (err) {
        console.error('Speech start error:', err);
      }
    }
  };

  // Handle Subtitle Transcribe Request from Server
  const fetchParsedSubtitles = async (subUrl: string) => {
    setTranscribingSub(true);
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitleUrl: subUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setParsedSubtitles(data.items || []);
        if (data.transcript) {
          setSpeechTranscript(data.transcript);
        }
      }
    } catch (err) {
      console.error('Fetch subtitles error:', err);
    } finally {
      setTranscribingSub(false);
    }
  };

  // Handle Paste from Clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        setErrorMsg(null);
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  };

  // Clear input
  const handleClear = () => {
    setInputUrl('');
    setErrorMsg(null);
  };

  // Trigger video extraction
  const handleExtract = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMsg('Vui lòng dán liên kết video Facebook vào ô bên trên.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setShowPreview(false);
    setActiveTab('video');
    setSpeechTranscript('');
    setParsedSubtitles([]);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Trích xuất thất bại. Vui lòng kiểm tra lại liên kết.');
      }

      setResult(json.data);

      // Auto transcribe subtitles if available
      if (json.data.subtitles && json.data.subtitles.length > 0 && json.data.subtitles[0].url) {
        fetchParsedSubtitles(json.data.subtitles[0].url);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setLoading(false);
    }
  };

  // Copy direct video link
  const handleCopyLink = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Copy post text/caption
  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // Copy speech transcript
  const handleCopySpeechTranscript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStt(true);
    setTimeout(() => setCopiedStt(false), 2000);
  };

  // Download text caption as .txt file
  const handleDownloadTxt = (text: string, filenamePrefix: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${filenamePrefix}_${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle download trigger via proxy
  const getProxyDownloadUrl = (mediaUrl: string, quality: string) => {
    const filename = `ndl_fb_video_${quality.toLowerCase()}_${Date.now()}.mp4`;
    return `/api/proxy?url=${encodeURIComponent(mediaUrl)}&filename=${encodeURIComponent(filename)}`;
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Tính năng Speech-to-Text (Nhận dạng giọng nói) hoạt động như thế nào?',
      a: 'Tính năng Speech-to-Text tích hợp trực tiếp bộ nhận dạng giọng nói AI giúp chuyển âm thanh/lời thoại trong video Facebook thành văn bản (chữ viết) theo thời gian thực hoặc trích xuất phụ đề tự động.',
    },
    {
      q: 'Công cụ hỗ trợ trích xuất giọng nói các ngôn ngữ nào?',
      a: 'Hệ thống hỗ trợ nhận dạng tốt nhất đối với Tiếng Việt (vi-VN) và Tiếng Anh (en-US) cùng khả năng tự động bóc tách phụ đề đính kèm sẵn trên Facebook.',
    },
    {
      q: 'Công cụ do ai phát triển và có miễn phí không?',
      a: 'Công cụ được nghiên cứu & phát triển bởi NDL Developer (NDL Team), hoàn toàn miễn phí 100%. Bạn có thể tải video và chuyển âm thanh thành văn bản không giới hạn.',
    },
    {
      q: 'Công cụ hỗ trợ các định dạng liên kết Facebook nào?',
      a: 'Hỗ trợ tất cả liên kết Facebook bao gồm: Facebook Reels, Facebook Watch, Video bài viết, Video Livestream đã kết thúc và Facebook Shorts.',
    },
    {
      q: 'Video sau khi tải xuống sẽ được lưu ở đâu?',
      a: 'File video MP4 và file văn bản .TXT sẽ tự động lưu vào thư mục Tải về (Downloads) trên máy tính hoặc điện thoại thông minh của bạn.',
    },
  ];

  const features = [
    {
      icon: <Mic className="w-6 h-6 text-amber-400" />,
      title: 'Speech-to-Text & AI Transcribe',
      desc: 'Nhận dạng giọng nói trong video thành văn bản chữ Tiếng Việt & Tiếng Anh theo thời gian thực.',
    },
    {
      icon: <FileText className="w-6 h-6 text-amber-400" />,
      title: 'Trích Xuất Text & Caption',
      desc: 'Tự động bóc tách bài viết, phụ đề và nội dung chữ đính kèm video với tùy chọn tải file .txt tiện lợi.',
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: 'Tốc Độ Cực Nhanh',
      desc: 'Công nghệ proxy stream đa luồng tiên tiến từ NDL Developer giúp xử lý và tải video về máy chỉ trong vài giây.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: 'An Toàn & Bảo Mật NDL',
      desc: 'Cam kết không lưu trữ dữ liệu cá nhân, không mã độc và không chứa quảng cáo gây phiền phức.',
    },
  ];

  const getWordCount = (str: string) => (str ? str.trim().split(/\s+/).length : 0);

  return (
    <div className="relative flex-1 flex flex-col items-center justify-start overflow-hidden">
      {/* Dynamic Background Glows with Golden Ambient Accents */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-glow-blue pointer-events-none z-0 opacity-70" />
      <div className="absolute top-[15%] right-[-10%] w-[600px] h-[600px] bg-glow-purple pointer-events-none z-0 opacity-50" />
      <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-radial from-amber-500/10 to-transparent pointer-events-none z-0" />

      {/* Header / Navbar */}
      <header className="w-full max-w-6xl px-4 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden p-0.5 bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center overflow-hidden">
              <Image
                src="/ndl-logo.jpg"
                alt="NDL Developer Logo"
                width={44}
                height={44}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div>
            <span className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
              NDL <span className="text-amber-400">Downloader</span>
            </span>
            <span className="text-[10px] text-amber-400/90 font-semibold block uppercase tracking-wider">
              Powered by NDL Developer
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            NDL STT &amp; Video Engine
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="w-full max-w-4xl px-4 pt-4 pb-20 z-10 flex flex-col items-center">
        {/* Title & NDL Developer Badge */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-4 backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Phát triển bởi NDL Developer
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4 leading-tight">
            Tải Video FB &amp; Chuyển Giọng Nói{' '}
            <span className="bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Speech To Text
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Công cụ 3 trong 1: Tải video HD, trích xuất văn bản bài viết &amp; chuyển âm thanh giọng nói thành văn bản chữ tự động từ <strong>NDL Developer</strong>.
          </p>
        </div>

        {/* Converter Card */}
        <div className="w-full glass-card rounded-3xl p-4 sm:p-8 mb-12 shadow-2xl relative border-slate-800/80">
          <form onSubmit={handleExtract} className="space-y-4">
            <div className="relative flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full flex items-center">
                <div className="absolute left-4 text-amber-400/80 pointer-events-none">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => {
                    setInputUrl(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Dán liên kết video Facebook tại đây (Reels, Watch, Post)..."
                  className="w-full pl-11 pr-24 py-4 rounded-2xl glass-input text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none transition-all"
                  disabled={loading}
                />
                
                {/* Action buttons inside input */}
                <div className="absolute right-3 flex items-center gap-1.5">
                  {inputUrl ? (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition"
                      title="Xóa"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePaste}
                      className="hidden sm:flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                      title="Dán từ Clipboard"
                    >
                      <Copy className="w-3 h-3 text-amber-400" />
                      Dán
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !inputUrl.trim()}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 whitespace-nowrap active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin text-slate-950" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 text-slate-950" />
                    Trích Xuất Dữ Liệu
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Error Alert */}
          {errorMsg && (
            <div className="mt-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block mb-0.5">Thông báo từ hệ thống</span>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className="mt-6 p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 animate-shimmer space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="w-full sm:w-48 h-32 bg-slate-800/80 rounded-xl" />
                <div className="flex-1 space-y-3 w-full">
                  <div className="h-5 bg-slate-800/80 rounded w-3/4" />
                  <div className="h-4 bg-slate-800/80 rounded w-1/2" />
                  <div className="h-10 bg-slate-800/80 rounded-xl w-full sm:w-40" />
                </div>
              </div>
            </div>
          )}

          {/* Extracted Video & Text Result Card */}
          {result && !loading && (
            <div className="mt-6 p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-inner space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  NDL Engine: Bóc tách Video &amp; Text thành công!
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setResult(null);
                      setInputUrl('');
                    }}
                    className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Thực hiện lại
                  </button>
                </div>
              </div>

              {/* View Switcher Tabs: Video / Post Text / Speech To Text */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800/80 w-full sm:w-auto self-start overflow-x-auto">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition whitespace-nowrap ${
                    activeTab === 'video'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  Tải Video MP4 ({result.medias.length})
                </button>

                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition whitespace-nowrap ${
                    activeTab === 'text'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Bài Viết &amp; Caption
                </button>

                <button
                  onClick={() => setActiveTab('stt')}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition whitespace-nowrap ${
                    activeTab === 'stt'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-4 h-4 text-slate-950" />
                  Speech to Text (Lời Thoại)
                </button>
              </div>

              {/* Tab 1: Video Download Section */}
              {activeTab === 'video' && (
                <div className="flex flex-col md:flex-row gap-6 animate-in fade-in duration-300">
                  {/* Media Preview (Thumbnail or Player) */}
                  <div className="w-full md:w-64 flex-shrink-0 flex flex-col items-center">
                    <div className="relative w-full aspect-video md:aspect-[4/3] rounded-xl overflow-hidden group bg-slate-950 border border-slate-800 shadow-md">
                      {showPreview && result.medias.length > 0 ? (
                        <video
                          ref={videoRef}
                          src={result.medias[0].url}
                          controls
                          autoPlay
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={result.thumbnail}
                            alt={result.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <button
                            onClick={() => setShowPreview(true)}
                            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-amber-500/90 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl backdrop-blur-sm transition hover:scale-110 active:scale-95"
                            title="Xem trước video"
                          >
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </button>
                        </>
                      )}
                    </div>
                    {!showPreview && (
                      <button
                        onClick={() => setShowPreview(true)}
                        className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
                      >
                        <Play className="w-3 h-3 fill-current" /> Xem phát thử video
                      </button>
                    )}
                  </div>

                  {/* Info & Download Options */}
                  <div className="flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white line-clamp-2 mb-2 leading-snug">
                        {result.title}
                      </h3>
                      {result.author && (
                        <p className="text-xs text-amber-400/90 font-medium mb-2">
                          Tác giả / Trang: <strong>{result.author}</strong>
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
                          FB Video • NDL Verified
                        </span>
                        <span>•</span>
                        <span>{result.medias.length} tùy chọn tải</span>
                      </div>
                    </div>

                    {/* Quality Download Buttons */}
                    <div className="space-y-3">
                      {result.medias.map((media, idx) => {
                        const proxyUrl = getProxyDownloadUrl(media.url, media.quality);
                        const isHD = media.quality === 'HD';

                        return (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:border-amber-500/40 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs ${
                                  isHD
                                    ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                                    : 'bg-slate-700 text-slate-200'
                                }`}
                              >
                                {media.quality}
                              </div>
                              <div>
                                <span className="font-bold text-sm text-white block">
                                  Chất lượng {media.quality === 'HD' ? 'High Definition (HD)' : 'Standard Definition (SD)'}
                                </span>
                                <span className="text-xs text-slate-400">Định dạng MP4</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleCopyLink(media.url, idx)}
                                className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                                title="Sao chép đường dẫn trực tiếp"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                    Đã chép!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    Copy Link
                                  </>
                                )}
                              </button>

                              <a
                                href={proxyUrl}
                                download
                                className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition active:scale-95 ${
                                  isHD
                                    ? 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/20'
                                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
                                }`}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Tải {media.quality}
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Text Caption Extraction Section */}
              {activeTab === 'text' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                        <MessageSquareText className="w-4 h-4 text-amber-400" />
                        Nội Dung Bài Viết / Post Caption
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{getWordCount(result.description)} từ</span>
                        <span>•</span>
                        <span>{result.description.length} ký tự</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyText(result.description)}
                        className="px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        {copiedText ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Đã chép Text!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-400" />
                            Sao Chép Văn Bản
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownloadTxt(result.description, 'ndl_post_caption')}
                        className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <FileType className="w-3.5 h-3.5 text-blue-400" />
                        Tải File .TXT
                      </button>
                    </div>
                  </div>

                  {/* Text Box */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto font-sans shadow-inner selection:bg-amber-500 selection:text-slate-950">
                    {result.description || 'Không tìm thấy nội dung bài viết kèm theo video.'}
                  </div>
                </div>
              )}

              {/* Tab 3: Speech-to-Text & Subtitles Section */}
              {activeTab === 'stt' && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  {/* STT Controls Toolbar */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleSpeechRecognition}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 ${
                          isListening
                            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/30'
                            : 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:from-amber-400 hover:to-yellow-300 shadow-amber-500/25'
                        }`}
                      >
                        {isListening ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            Dừng Nhận Dạng (Recording...)
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Bật Nhận Dạng Giọng Nói (Speech to Text)
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                        <Globe className="w-3.5 h-3.5 text-amber-400" />
                        <select
                          value={sttLanguage}
                          onChange={(e) => setSttLanguage(e.target.value as any)}
                          className="bg-transparent text-white focus:outline-none cursor-pointer font-semibold text-xs"
                        >
                          <option value="vi-VN" className="bg-slate-900">Tiếng Việt (vi-VN)</option>
                          <option value="en-US" className="bg-slate-900">Tiếng Anh (en-US)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopySpeechTranscript(speechTranscript)}
                        disabled={!speechTranscript}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        {copiedStt ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Đã chép!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-amber-400" />
                            Copy Lời Thoại
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDownloadTxt(speechTranscript, 'ndl_speech_transcript')}
                        disabled={!speechTranscript}
                        className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-40 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
                      >
                        <FileType className="w-3.5 h-3.5" />
                        Tải .TXT
                      </button>
                    </div>
                  </div>

                  {/* Video Playback for STT alignment */}
                  {result.medias.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-center gap-4">
                      <div className="w-full md:w-64 aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                        <video
                          ref={videoRef}
                          src={result.medias[0].url}
                          controls
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 space-y-2 text-xs text-slate-300">
                        <span className="font-bold text-amber-400 block">
                          💡 Hướng dẫn chuyển giọng nói thành văn bản:
                        </span>
                        <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                          <li>Nhấn nút <strong>Bật Nhận Dạng Giọng Nói</strong> ở trên.</li>
                          <li>Bấm <strong>Play Video</strong> để phát âm thanh video.</li>
                          <li>Hệ thống AI sẽ tự động đọc âm thanh phát ra và chuyển thành lời thoại chữ tương ứng bên dưới!</li>
                        </ol>
                      </div>
                    </div>
                  )}

                  {/* Speech Transcript Output Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <Subtitles className="w-4 h-4 text-amber-400" />
                        Kết Quả Lời Thoại / Speech Transcript
                      </span>
                      <span>{getWordCount(speechTranscript)} từ • {speechTranscript.length} ký tự</span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm leading-relaxed whitespace-pre-wrap min-h-[140px] max-h-72 overflow-y-auto font-sans shadow-inner selection:bg-amber-500 selection:text-slate-950 relative">
                      {isListening && (
                        <div className="flex items-center gap-2 text-xs text-amber-400 font-bold mb-2 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Đang lắng nghe âm thanh video theo thời gian thực...
                        </div>
                      )}

                      {speechTranscript || (
                        <span className="text-slate-500 italic">
                          Chưa có dữ liệu lời thoại. Hãy bấm &quot;Bật Nhận Dạng Giọng Nói&quot; và phát video để hệ thống ghi lại văn bản.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeline Parsed Subtitles list if available */}
                  {parsedSubtitles.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Dòng thời gian Phụ Đề Tự Động ({parsedSubtitles.length} câu)
                      </h4>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {parsedSubtitles.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-3 text-xs"
                          >
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[11px]">
                              {item.time}
                            </span>
                            <span className="text-slate-200 flex-1 leading-normal">{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features Grid */}
        <section className="w-full mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
              Tính Năng Nổi Bật Tốt Nhất Từ NDL Developer
            </h2>
            <p className="text-slate-400 text-sm">
              Trải nghiệm công cụ tải video, trích xuất text &amp; nhận dạng giọng nói đỉnh cao.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl glass-card hover:border-amber-500/30 transition duration-300 space-y-3"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-white text-base">{feat.title}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3 Step Instruction */}
        <section className="w-full mb-16 p-8 rounded-3xl glass-card border border-slate-800">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-2">
              Hướng Dẫn Tải Video &amp; Chuyển Giọng Nói Thành Text 3 Bước
            </h2>
            <p className="text-slate-400 text-sm">Dễ dàng thao tác chỉ trong chưa đầy 30 giây</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-extrabold text-sm">
                1
              </div>
              <h4 className="font-bold text-white text-sm">Dán Liên Kết Video</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mở ứng dụng Facebook, sao chép liên kết video / Reels và dán vào khung tìm kiếm.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-extrabold text-sm">
                2
              </div>
              <h4 className="font-bold text-white text-sm">Chọn Tab Speech to Text</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Bấm chuyển sang tab <strong>Speech to Text</strong> và bật nhận dạng giọng nói.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3 p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-extrabold text-sm">
                3
              </div>
              <h4 className="font-bold text-white text-sm">Lưu Lời Thoại .TXT</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Phát âm thanh video và bấm <strong>Sao chép</strong> hoặc <strong>Tải file .TXT</strong> chứa toàn bộ lời thoại.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="w-full mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white mb-2">Câu Hỏi Thường Gặp (FAQ)</h2>
            <p className="text-slate-400 text-sm">Giải đáp thắc mắc người dùng cùng NDL Developer</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl glass-card overflow-hidden border border-slate-800/80 transition"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left font-bold text-sm sm:text-base text-white flex items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${
                      activeFaq === idx ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in duration-200">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer & License with NDL Developer Branding */}
      <footer className="w-full border-t border-slate-800/80 py-10 px-4 text-center text-xs text-slate-400 z-10 bg-[#060911]/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col items-center space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden p-0.5 bg-gradient-to-tr from-amber-500 to-yellow-400">
              <Image
                src="/ndl-logo.jpg"
                alt="NDL Developer Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-[10px]"
              />
            </div>
            <span className="font-extrabold text-base text-white tracking-wide">
              NDL <span className="text-amber-400">Developer</span>
            </span>
          </div>

          <p className="text-slate-300 font-medium">
            © {new Date().getFullYear()} NDL Developer. All rights reserved. (MIT License)
          </p>

          <p className="text-[11px] text-slate-500 max-w-xl mx-auto leading-relaxed">
            Phát triển &amp; Sở hữu bản quyền thương hiệu bởi <strong>NDL Developer</strong>. Trang web cung cấp giải pháp trích xuất dữ liệu video, văn bản &amp; nhận dạng lời thoại âm thanh từ Facebook.
          </p>
        </div>
      </footer>
    </div>
  );
}
