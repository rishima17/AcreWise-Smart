import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Mic, Send, X, Volume2, Sparkles, User, 
  MessageSquare, ChevronRight, HelpCircle, ArrowRight
} from 'lucide-react';
import { sendAdvisoryMessage } from '../services/api';

export default function KisanMitra({ lang = 'en', farm, t, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: lang === 'hi' 
        ? 'नमस्ते! मैं किसान मित्र हूँ। फसल विविधीकरण, एमएसपी, मिट्टी सुधार या मौसम के जोखिम पर कोई भी सवाल पूछें।' 
        : (lang === 'pa' 
          ? 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਜੀ! ਮੈਂ ਕਿਸਾਨ ਮਿੱਤਰ ਹਾਂ। ਫ਼ਸਲੀ ਚੱਕਰ, ਐੱਮ.ਐੱਸ.ਪੀ., ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਜਾਂ ਪਾਣੀ ਦੀ ਬਚਤ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ।'
          : 'Namaste! I am Kisan Mitra, your agronomic copilot. Ask me any question about crop planning, MSP rates, soil health, or What-If weather risks.')
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const chatEndRef = useRef(null);

  const promptChips = {
    en: [
      "What crop should I grow after Paddy?",
      "How does Chickpea improve soil health?",
      "What is the MSP rate for Mustard and Wheat?",
      "How does What-If simulate drought?"
    ],
    hi: [
      "धान के बाद कौन सी फसल लगाना सबसे अच्छा है?",
      "चना और मूंग मिट्टी की सेहत कैसे सुधारते हैं?",
      "सरसों और गेहूं का सरकारी MSP क्या है?",
      "सूखे या बारिश की कमी में क्या करें?"
    ],
    pa: [
      "ਝੋਨੇ ਤੋਂ ਬਾਅਦ ਕਿਹੜੀ ਫ਼ਸਲ ਲਗਾਉਣੀ ਚਾਹੀਦੀ ਹੈ?",
      "ਛੋਲੇ ਮਿੱਟੀ ਦੀ ਸਿਹਤ ਕਿਵੇਂ ਸੁਧਾਰਦੇ ਹਨ?",
      "ਸਰ੍ਹੋਂ ਅਤੇ ਕਣਕ ਦਾ ਸਰਕਾਰੀ ਐੱਮ.ਐੱਸ.ਪੀ. ਕੀ ਹੈ?",
      "ਪਾਣੀ ਦੀ ਘਾਟ ਜਾਂ ਸੋਕੇ ਵਿੱਚ ਕਿਹੜੀ ਫ਼ਸਲ ਵਧੀਆ ਰਹੇਗੀ?"
    ]
  }[lang] || promptChips.en;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const farmContext = {
        acres: farm?.acres || 5,
        state: farm?.state || 'Punjab',
        district: farm?.district || 'Amritsar',
        soil: farm?.soil || 'Loamy',
        water: farm?.water || 'Medium',
        season: farm?.season || 'Rabi 2026'
      };

      const res = await sendAdvisoryMessage(textToSend, lang, messages, farmContext);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply }]);
    } catch (err) {
      console.warn('Backend advisory failed, using smart local fallback', err);
      // Local fallback
      let fallbackReply = '';
      const lower = textToSend.toLowerCase();
      if (lower.includes('paddy') || lower.includes('rice') || lower.includes('ਝੋਨ') || lower.includes('धान')) {
        fallbackReply = lang === 'hi' 
          ? 'धान के बाद सरसों या चना लगाना सबसे फायदेमंद है। यह 40% तक भूजल बचाता है और अगली फसल के लिए प्राकृतिक खाद देता है।'
          : (lang === 'pa' 
            ? 'ਝੋਨੇ ਤੋਂ ਬਾਅਦ ਸਰ੍ਹੋਂ ਜਾਂ ਛੋਲੇ ਲਗਾਉਣਾ ਬਹੁਤ ਲਾਹੇਵੰਦ ਹੈ। ਇਹ 40% ਧਰਤੀ ਹੇਠਲਾ ਪਾਣੀ ਬਚਾਉਂਦਾ ਹੈ ਅਤੇ ਯੂਰੀਆ ਦਾ ਖਰਚ ਘਟਾਉਂਦਾ ਹੈ।'
            : 'Rotating Paddy with Mustard or Chickpea saves up to 40% groundwater, breaks pest cycles, and fixes natural nitrogen for the subsequent crop.');
      } else if (lower.includes('msp') || lower.includes('rate') || lower.includes('ਭਾਅ') || lower.includes('एमएसपी')) {
        fallbackReply = lang === 'hi'
          ? 'सरकारी MSP (2025-26): गेहूं ₹2,425/क्विंटल, सरसों ₹5,950/क्विंटल, चना ₹5,650/क्विंटल, मूंग ₹8,768/क्विंटਲ।'
          : (lang === 'pa'
            ? 'ਸਰਕਾਰੀ ਐੱਮ.ਐੱਸ.ਪੀ. (2025-26): ਕਣਕ ₹2,425/ਕੁਇੰਟਲ, ਸਰ੍ਹੋਂ ₹5,950/ਕੁਇੰਟਲ, ਛੋਲੇ ₹5,650/ਕੁਇੰਟਲ, ਮੂੰਗੀ ₹8,768/ਕੁਇੰਟਲ।'
            : 'Official MSP 2025-26: Wheat ₹2,425/q, Mustard ₹5,950/q, Chickpea ₹5,650/q, Moong ₹8,768/q.');
      } else {
        fallbackReply = lang === 'hi'
          ? `आपके ${farm.acres || 5} एकड़ खेत के लिए दलहन व तिलहन फसलें सबसे अधिक जल-कुशल और टिकाऊ मुनाफा देती हैं।`
          : (lang === 'pa'
            ? `ਤੁਹਾਡੇ ${farm.acres || 5} ਏਕੜ ਖੇਤ ਲਈ ਸਰ੍ਹੋਂ ਜਾਂ ਛੋਲੇ ਲਗਾਉਣਾ ਪਾਣੀ ਦੀ ਬਚਤ ਅਤੇ ਚੰਗੇ ਮੁਨਾਫ਼ੇ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ।`
            : `For your ${farm.acres || 5}-acre farm, diversifying into Mustard and Pulses reduces pumping costs and provides resilient MSP-backed returns.`);
      }
      setMessages(prev => [...prev, { role: 'assistant', content: fallbackReply }]);
    } finally {
      setLoading(false);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please type your query.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : (lang === 'pa' ? 'pa-IN' : 'en-IN');
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      handleSend(transcript);
    };
    recognition.start();
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : (lang === 'pa' ? 'pa-IN' : 'en-IN');
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="mitra-drawer">
      {/* Header */}
      <div className="mitra-header">
        <div className="mitra-badge">
          <Bot size={20} className="mitra-bot-icon" />
          <div>
            <strong>{t.mitra_title || 'Kisan Mitra AI'}</strong>
            <small>Multilingual Agronomic Copilot</small>
          </div>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close Kisan Mitra">
          <X size={18} />
        </button>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="mitra-chips-scroll">
        {promptChips.map((chip, idx) => (
          <button 
            key={idx} 
            className="mitra-chip"
            onClick={() => handleSend(chip)}
          >
            <Sparkles size={12} /> {chip}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="mitra-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`mitra-bubble-row ${m.role}`}>
            <div className={`mitra-avatar ${m.role}`}>
              {m.role === 'assistant' ? <Bot size={15} /> : <User size={15} />}
            </div>
            <div className={`mitra-bubble ${m.role}`}>
              <p>{m.content}</p>
              {m.role === 'assistant' && (
                <button 
                  className="mitra-speak-btn"
                  onClick={() => speakText(m.content)}
                  title="Listen in regional voice"
                >
                  <Volume2 size={13} /> {t.mitra_audio_play || 'Listen'}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="mitra-bubble-row assistant">
            <div className="mitra-avatar assistant"><Bot size={15} /></div>
            <div className="mitra-bubble assistant thinking">
              <span>Thinking with agronomic engine…</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form */}
      <form 
        className="mitra-input-form"
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
      >
        <button 
          type="button" 
          className={`mitra-mic-btn ${listening ? 'listening' : ''}`}
          onClick={startVoiceInput}
          title="Click to speak (Punjabi/Hindi/English)"
        >
          <Mic size={17} />
        </button>
        <input 
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={listening ? (t.mitra_listening || 'Listening…') : (t.mitra_input_ph || 'Ask Kisan Mitra…')}
          disabled={loading}
        />
        <button 
          type="submit" 
          className="btn btn-primary mitra-send-btn"
          disabled={!input.trim() || loading}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
