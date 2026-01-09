
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Message } from './types';
import { StatBar } from './components/StatBar';
import { generateBossResponse } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    agitation: 0,
    mental: 100,
    evidence: 0
  });

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost' | 'compliance'>('playing');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial message
  useEffect(() => {
    const initialMessage: Message = {
      role: 'boss',
      content: 'ああ、君。ちょうどいいところに。例の「Aプロジェクト」の件なんだけど、クライアントから大クレームが入っていてねぇ。……これ、君が独断で進めた結果だよね？ 僕はそんな指示、出した覚えがないんだけどなぁ……。',
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading || gameStatus !== 'playing') return;

    const userMessage: Message = {
      role: 'player',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const bossResponse = await generateBossResponse(inputText, messages, gameState);
      
      const newAgitation = Math.min(100, Math.max(0, gameState.agitation + bossResponse.agitationUpdate));
      const newMental = Math.min(100, Math.max(0, gameState.mental + bossResponse.mentalUpdate));
      const newEvidence = Math.min(100, Math.max(0, gameState.evidence + bossResponse.evidenceUpdate));

      setGameState({
        agitation: newAgitation,
        mental: newMental,
        evidence: newEvidence
      });

      setMessages(prev => [...prev, {
        role: 'boss',
        content: bossResponse.dialogue,
        timestamp: new Date()
      }]);

      // Check win/loss conditions
      if (newMental <= 0) {
        setGameStatus('lost');
      } else if (newAgitation >= 100) {
        setGameStatus('won');
      }
    } catch (error) {
      console.error("Error communicating with boss:", error);
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'エラーが発生しました。接続を確認してください。',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplianceReport = () => {
    if (gameState.evidence >= 100) {
      setGameStatus('compliance');
    }
  };

  const renderGameOverlay = () => {
    if (gameStatus === 'playing') return null;

    let title = "";
    let description = "";
    let bgColor = "";

    switch (gameStatus) {
      case 'won':
        title = "勝利：自爆";
        description = "逃男係長は自身の矛盾に耐えきれず、部長の前で失言し自爆しました。あなたの潔白が証明されました！";
        bgColor = "bg-green-600";
        break;
      case 'lost':
        title = "敗北：退職";
        description = "降り注ぐ責任転嫁にあなたのメンタルは限界を迎えました。あなたは静かに退職届を提出しました。";
        bgColor = "bg-red-600";
        break;
      case 'compliance':
        title = "完全勝利：コンプラ通報";
        description = "蓄積した確固たる証拠をもとにコンプラ委員会へ通報。逃男係長は更迭され、平和なオフィスが戻りました。";
        bgColor = "bg-blue-600";
        break;
    }

    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4`}>
        <div className={`${bgColor} text-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center animate-bounce-in`}>
          <h2 className="text-3xl font-black mb-4">{title}</h2>
          <p className="text-lg mb-8 leading-relaxed">{description}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors"
          >
            もう一度やり直す
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-white shadow-2xl relative">
      {/* Header */}
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gray-300 rounded-full overflow-hidden border-2 border-white flex items-center justify-center text-2xl">
            👔
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">責任 逃男 (45)</h1>
            <p className="text-xs text-slate-400">営業二課 係長</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 block">Current Status</span>
          <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded">Active Blaming...</span>
        </div>
      </header>

      {/* Dashboard */}
      <div className="bg-slate-50 p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4 shadow-inner">
        <StatBar 
          label="上司の動揺" 
          value={gameState.agitation} 
          max={100} 
          color="bg-orange-500" 
          icon="😰" 
          description="100で自爆勝利"
        />
        <StatBar 
          label="メンタル" 
          value={gameState.mental} 
          max={100} 
          color="bg-emerald-500" 
          icon="🧠" 
          description="0でストレス退職"
        />
        <StatBar 
          label="証拠蓄積" 
          value={gameState.evidence} 
          max={100} 
          color="bg-blue-600" 
          icon="📁" 
          description="100でコンプラ通報可能"
        />
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] dark:bg-slate-900"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}
      >
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'boss' ? 'justify-start' : msg.role === 'player' ? 'justify-end' : 'justify-center'}`}>
            <div className={`
              max-w-[85%] px-4 py-2 rounded-2xl shadow-sm text-sm
              ${msg.role === 'boss' ? 'message-gradient-boss rounded-tl-none border border-gray-200 text-gray-800' : 
                msg.role === 'player' ? 'message-gradient-player rounded-tr-none text-white' : 
                'bg-gray-500/50 text-white italic text-xs px-6 py-1'}
            `}>
              {msg.content}
              <div className={`text-[10px] mt-1 ${msg.role === 'player' ? 'text-blue-100 text-right' : 'text-gray-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="message-gradient-boss rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t space-y-3">
        {gameState.evidence >= 100 && (
          <button 
            onClick={handleComplianceReport}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-2 rounded-lg shadow-lg transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2 animate-pulse"
          >
            📢 コンプラ委員会に通報する (決定打)
          </button>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="証拠を突きつけるか、反論してください..."
            disabled={isLoading || gameStatus !== 'playing'}
            className="flex-1 border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={isLoading || gameStatus !== 'playing' || !inputText.trim()}
            className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
        <div className="flex justify-center gap-4 text-[11px] text-gray-400 font-medium">
          <span>💡 ヒント: 「◯日のメール」「チャット履歴」などは有効です</span>
          <span>⚠️ 注意: 感情的になるとメンタルが削られます</span>
        </div>
      </div>

      {renderGameOverlay()}
    </div>
  );
};

export default App;
