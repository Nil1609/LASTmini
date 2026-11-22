"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  MapPin,
  Send,
  Shield,
  X,
  KeyRound,
  AlertCircle,
  Clock,
  Building,
  RefreshCw,
  Sparkles,
  Phone,
  ArrowRight
} from 'lucide-react';

export default function ChatPage() {
  const { matchId } = useParams();
  const router = useRouter();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [hasUserPhone, setHasUserPhone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // Handover OTP Modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpExpiry, setOtpExpiry] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState({ text: '', type: '' });

  const chatContainerRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  const scrollToBottom = (behavior = 'smooth') => {
    const el = chatContainerRef.current;
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior
      });
    }
  };

  // 1. Fetch User Info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUserId(data.user.id);
          const rawPhone = data.user.phone || '';
          const digits = rawPhone.replace(/\D/g, '');
          const ten = digits.length >= 10 ? (digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits.slice(-10)) : '';
          setUserPhone(rawPhone);
          setHasUserPhone(ten.length === 10);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error("Auth error", err);
      }
    };
    fetchUser();
  }, [router]);

  // 2. Fetch Chat Messages & Conversation with efficient bounded polling
  useEffect(() => {
    let isMounted = true;

    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/chat/${matchId}`);
        if (res.ok && isMounted) {
          const data = await res.json();
          
          setConversation(prev => {
            if (!prev) return data.conversation;
            if (
              prev.id === data.conversation?.id &&
              prev.status === data.conversation?.status &&
              prev.counterparty_name === data.conversation?.counterparty_name
            ) {
              return prev;
            }
            return data.conversation;
          });

          if (data.currentUser) {
            setHasUserPhone(Boolean(data.currentUser.has_phone));
            if (data.currentUser.phone) setUserPhone(data.currentUser.phone);
          } else if (data.conversation?.user_has_phone !== undefined) {
            setHasUserPhone(Boolean(data.conversation.user_has_phone));
          }

          setMessages(prev => {
            const incoming = data.messages || [];
            if (prev.length === incoming.length) {
              const lastPrev = prev[prev.length - 1];
              const lastInc = incoming[incoming.length - 1];
              if (lastPrev?.id === lastInc?.id && lastPrev?.created_at === lastInc?.created_at) {
                return prev; // Same array reference, prevents unnecessary re-renders & scroll resets
              }
            }
            return incoming;
          });

          if (data.handover?.code) {
            setGeneratedOtp(data.handover.code);
            setOtpExpiry(data.handover.expires_at);
          }
          setError('');
        } else if (res.status === 403 || res.status === 401) {
          setError('Access denied. You are not an authorized participant in this conversation.');
        } else if (res.status === 404) {
          setError('Conversation record not found.');
        }
      } catch (err) {
        console.error("Chat polling error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchChat();

    // Bounded interval polling every 4 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchChat();
      }
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [matchId]);

  // Scroll to bottom smoothly only when new messages are added or on first load
  useEffect(() => {
    if (messages.length === 0) return;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      scrollToBottom('auto');
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    if (messages.length > prevMessagesLengthRef.current) {
      const el = chatContainerRef.current;
      const isNearBottom = el
        ? el.scrollHeight - el.scrollTop - el.clientHeight < 160
        : true;

      if (isNearBottom) {
        scrollToBottom('smooth');
      }
      prevMessagesLengthRef.current = messages.length;
    }
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await fetch(`/api/chat/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSend })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setTimeout(() => scrollToBottom('smooth'), 50);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to send message');
        setNewMessage(textToSend);
      }
    } catch (err) {
      alert('Network error sending message.');
      setNewMessage(textToSend);
    } finally {
      setSending(false);
    }
  };

  // Handover: Generate Code
  const handleGenerateCode = async () => {
    if (!hasUserPhone) {
      setOtpMessage({ text: 'A contact phone number is mandatory to coordinate asset handover. Please update your profile.', type: 'error' });
      return;
    }
    setOtpLoading(true);
    setOtpMessage({ text: '', type: '' });
    try {
      const res = await fetch(`/api/chat/${matchId}/handover`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setGeneratedOtp(data.code);
        setOtpExpiry(data.expires_at);
        setOtpMessage({ text: '6-Digit verification code generated! Present it to counterparty.', type: 'success' });
      } else {
        setOtpMessage({ text: data.error || 'Failed to generate code.', type: 'error' });
      }
    } catch (err) {
      setOtpMessage({ text: 'Network error.', type: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  // Handover: Verify Code
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!inputOtp.trim()) return;

    if (!hasUserPhone) {
      setOtpMessage({ text: 'A contact phone number is mandatory to complete asset handover. Please update your profile.', type: 'error' });
      return;
    }

    setOtpLoading(true);
    setOtpMessage({ text: '', type: '' });
    try {
      const res = await fetch(`/api/chat/${matchId}/handover/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: inputOtp.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpMessage({ text: 'Handover verified successfully! Report resolved.', type: 'success' });
        setTimeout(() => {
          setShowOtpModal(false);
          router.refresh();
        }, 1800);
      } else {
        setOtpMessage({ text: data.error || 'Incorrect code.', type: 'error' });
      }
    } catch (err) {
      setOtpMessage({ text: 'Network error.', type: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-28 pb-16 px-4 text-center relative chronicle-bg-glow chronicle-grid">
        <div className="max-w-md mx-auto p-12 bg-white/80 dark:bg-slate-900/80 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl text-xs text-slate-500 animate-pulse">
          Opening secure recovery chat session...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-28 pb-16 px-4 text-center relative chronicle-bg-glow chronicle-grid">
        <div className="max-w-md mx-auto p-8 bg-white/95 dark:bg-slate-900/90 rounded-3xl border border-rose-200 dark:border-rose-900 text-xs shadow-xl backdrop-blur-xl">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2.5" />
          <h2 className="text-base font-bold text-slate-950 dark:text-white">Conversation Inaccessible</h2>
          <p className="text-slate-500 mt-1">{error}</p>
          <Link href="/dashboard" className="mt-5 inline-block px-5 py-2.5 bg-[#050505] dark:bg-white text-white dark:text-slate-950 rounded-full font-semibold">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const isResolved = conversation?.status === 'resolved';

  return (
    <main className="w-full min-h-screen bg-white dark:bg-slate-950 pt-20 sm:pt-24 pb-8 px-3 sm:px-6 lg:px-8 transition-colors relative chronicle-bg-glow chronicle-grid">
      <div className="max-w-4xl mx-auto flex flex-col h-[calc(100dvh-130px)] min-h-[500px]">
        
        {/* Navigation & Context Banner */}
        <div className="flex items-center justify-between mb-4 text-xs">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white font-medium backdrop-blur-md transition-all shadow-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
            <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Encrypted Adamas Peer Session</span>
          </div>
        </div>

        {/* Chat Window Container (Chronicle Glass Card) */}
        <div className="flex-1 flex flex-col rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden">
          
          {/* Pinned Item & Handover Bar */}
          <div className="p-4 sm:p-5 bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#050505] dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-bold shadow-xs">
                <Shield className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
              </div>
              <div>
                <h2 className="font-headline font-bold text-slate-950 dark:text-white text-sm sm:text-base">
                  {conversation?.report_title || 'Campus Asset Recovery'}
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Communicating with: <strong className="text-slate-900 dark:text-white">{conversation?.counterparty_name || 'Verified Member'}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!hasUserPhone && !isResolved && (
                <Link
                  href="/profile"
                  title="Phone number mandatory for handover"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                >
                  <Phone className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Phone Required</span>
                </Link>
              )}
              <button
                onClick={() => setShowOtpModal(true)}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                  isResolved
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{isResolved ? 'Handover Verified ✓' : 'Handover OTP'}</span>
              </button>
            </div>
          </div>

          {/* Designated Campus Safe Spot Recommendation Ribbon */}
          <div className="px-5 py-2.5 bg-slate-100/70 dark:bg-white/[0.03] border-b border-slate-200/60 dark:border-white/5 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Recommended Handover Spot: <strong>Central Library 1F Desk</strong> or <strong>Main Gate Security Depot</strong></span>
            </span>
            <span className="hidden sm:inline text-slate-400 dark:text-slate-500 font-medium">24/7 Monitored</span>
          </div>

          {/* Message Stream */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-3 text-xs overscroll-contain">
            {messages.length === 0 ? (
              <div className="my-auto text-center text-slate-400 text-xs">
                No messages yet. Send a message to coordinate item inspection and handover.
              </div>
            ) : (
              messages.map((msg) => {
                if (msg.sender_id === 'system') {
                  return (
                    <div key={msg.id} className="my-2 p-2.5 rounded-2xl bg-slate-100/90 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/5 text-slate-600 dark:text-slate-300 text-center text-[11px] max-w-md mx-auto">
                      {msg.text}
                    </div>
                  );
                }

                const isMe = msg.sender_id === userId;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-[#050505] text-white dark:bg-white dark:text-slate-950 rounded-br-xs shadow-sm'
                          : 'bg-slate-100 dark:bg-white/[0.05] text-slate-900 dark:text-white rounded-bl-xs border border-slate-200/60 dark:border-white/5 shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Area */}
          <form onSubmit={handleSendMessage} className="p-3.5 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-white/10 flex items-center gap-2.5">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isResolved ? "This recovery conversation is resolved." : "Type a secure message..."}
              disabled={isResolved}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-slate-900 dark:focus:border-white/30 disabled:opacity-50 transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || isResolved}
              className="p-3 rounded-2xl bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 disabled:opacity-40 transition-all shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

      {/* HANDOVER OTP VERIFICATION MODAL (Chronicle Glass Card) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl p-7 sm:p-8 relative text-xs backdrop-blur-xl">
            
            <button
              onClick={() => setShowOtpModal(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Official Campus Recovery
              </span>
              <h3 className="font-headline text-lg sm:text-xl font-bold text-slate-950 dark:text-white mt-0.5">
                Handover OTP Verification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Meet in person at the campus custody desk. One party presents the 6-digit code, the recipient verifies it to close the listing.
              </p>
            </div>

            {/* Phone mandatory notice if user does not have a phone */}
            {!hasUserPhone && (
              <div className="p-4 rounded-2xl mb-5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col gap-2">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <Phone className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Contact Phone Mandatory for Handover</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  A verified contact phone number is mandatory to generate or verify handover codes for campus custody security.
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[11px] self-start mt-1 transition-all shadow-xs"
                >
                  <span>Update Phone in Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {otpMessage.text && (
              <div className={`p-3.5 rounded-2xl mb-5 text-xs font-semibold ${
                otpMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}>
                {otpMessage.text}
              </div>
            )}

            {/* Generated Code Display if user generated one */}
            {generatedOtp && (
              <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-center mb-5">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold block">
                  Your 6-Digit Handover Code:
                </span>
                <div className="text-3xl font-mono font-extrabold tracking-[0.3em] text-emerald-950 dark:text-emerald-200 my-2.5">
                  {generatedOtp}
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Show this code to the counterparty in person.
                </span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {/* Option A: Generate a code */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <span className="font-bold text-slate-900 dark:text-white block mb-1">
                  1. Have you handed over the item?
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Generate a handover verification code to show the recipient.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  disabled={otpLoading || !hasUserPhone}
                  className="w-full py-2.5 bg-[#050505] hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 rounded-full font-bold text-xs disabled:opacity-50 cursor-pointer shadow-xs transition-all"
                >
                  {!hasUserPhone ? 'Phone Required to Generate Code' : (otpLoading ? 'Generating...' : 'Generate New Handover Code')}
                </button>
              </div>

              {/* Option B: Enter a code */}
              <form onSubmit={handleVerifyCode} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex flex-col gap-2.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  2. Received the item? Verify Code
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter the 6-digit code shown by the counterparty:
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 842190"
                  disabled={!hasUserPhone}
                  className="w-full py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-white/15 text-center font-mono text-xl tracking-[0.3em] font-bold outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={inputOtp.length !== 6 || otpLoading || !hasUserPhone}
                  className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full font-bold text-xs disabled:opacity-50 shadow-xs cursor-pointer transition-all"
                >
                  {!hasUserPhone ? 'Phone Required to Verify Code' : (otpLoading ? 'Verifying...' : 'Verify Code & Resolve Report')}
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}
