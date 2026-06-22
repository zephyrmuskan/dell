import React, { useState, useEffect, useRef } from 'react';
import { useWorkflow } from '../context/WorkflowContext';
import { MessageSquare, Send, Bot, User, ThumbsUp, ThumbsDown } from 'lucide-react';

export const AskTrustLensPanel: React.FC = () => {
  const { 
    companionMessages, 
    isCompanionLoading, 
    askTrustLens, 
    sendFeedback, 
    user: authUser,
    watchAgentDiscussion,
    setWatchAgentDiscussion
  } = useWorkflow();

  const [inputVal, setInputVal] = useState('');
  const [feedbackClicked, setFeedbackClicked] = useState<Record<number, boolean>>({});
  const chatPaneRef = useRef<HTMLDivElement | null>(null);

  const suggestedQuestions = [
    "Why was this recommended?",
    "What evidence supports this?",
    "What could make this wrong?",
    "Show similar incidents"
  ];

  // Auto-scroll messages to bottom
  useEffect(() => {
    if (chatPaneRef.current) {
      chatPaneRef.current.scrollTop = chatPaneRef.current.scrollHeight;
    }
  }, [companionMessages, isCompanionLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isCompanionLoading) return;
    askTrustLens(inputVal.trim());
    setInputVal('');
  };

  const handleSuggestedClick = (question: string) => {
    if (isCompanionLoading) return;
    askTrustLens(question);
  };

  const renderInlineMarkdown = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content: React.ReactNode = line;
      let isBullet = false;

      // Handle bullet list
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        isBullet = true;
        content = line.replace(/^[•-]\s*/, '');
      }

      // Handle bold tags (e.g. **text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      const strContent = typeof content === 'string' ? content : '';

      while ((match = boldRegex.exec(strContent)) !== null) {
        if (match.index > lastIndex) {
          parts.push(strContent.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-extrabold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }

      if (lastIndex < strContent.length) {
        parts.push(strContent.substring(lastIndex));
      }

      const finalLine = parts.length > 0 ? parts : content;

      if (isBullet) {
        return (
          <div key={idx} className="flex items-start space-x-2 pl-2 mt-1">
            <span className="text-indigo-500 flex-shrink-0">•</span>
            <span className="text-[11px] leading-relaxed text-slate-600 font-semibold">{finalLine}</span>
          </div>
        );
      }

      return (
        <p key={idx} className="text-[11px] leading-relaxed text-slate-700 font-medium mt-1 m-0">
          {finalLine}
        </p>
      );
    });
  };

  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col h-[400px] select-none text-slate-800">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-indigo-500" />
          <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider m-0">Ask TrustLens</h3>
        </div>
        
        {/* Toggle options */}
        <div className="flex items-center space-x-2.5 text-[9px] font-mono select-none">
          <button
            type="button"
            onClick={() => setWatchAgentDiscussion(true)}
            className={`flex items-center space-x-1 cursor-pointer transition-colors ${
              watchAgentDiscussion ? 'text-indigo-600 font-extrabold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <span>{watchAgentDiscussion ? '☑' : '☐'}</span>
            <span>Watch Agent Discussion</span>
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={() => setWatchAgentDiscussion(false)}
            className={`flex items-center space-x-1 cursor-pointer transition-colors ${
              !watchAgentDiscussion ? 'text-indigo-600 font-extrabold' : 'text-slate-450 hover:text-slate-600'
            }`}
          >
            <span>{!watchAgentDiscussion ? '☑' : '☐'}</span>
            <span>Final Answer Only</span>
          </button>
        </div>
      </div>

      {/* Suggested Questions Grid */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {suggestedQuestions.map((q) => (
          <button
            key={q}
            onClick={() => handleSuggestedClick(q)}
            disabled={isCompanionLoading}
            type="button"
            className="text-[10px] text-left px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-500/50 rounded-xl font-bold text-slate-600 hover:text-indigo-950 transition duration-200 ease-in-out cursor-pointer leading-tight disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Pane */}
      <div ref={chatPaneRef} className="flex-1 overflow-y-auto bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-3 mb-3 min-h-0">
        {companionMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center h-full space-y-2 p-4 text-slate-400">
            <Bot className="h-7 w-7 text-indigo-500" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trust Dialogue Active</p>
            <p className="text-[10px] leading-normal font-semibold max-w-[200px]">
              Ask why containment was suggested or challenge the decisions.
            </p>
          </div>
        ) : (
          companionMessages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isLastAssistant = !isUser && idx === companionMessages.length - 1;
            const hasFeedbackSaved = feedbackClicked[idx];

            return (
              <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser ? (
                  <div className="flex flex-col w-full max-w-[95%] space-y-1">
                    <div className="flex items-center space-x-1.5 pl-1 select-none">
                      {msg.agentIcon ? (
                        <span className="text-xs">{msg.agentIcon}</span>
                      ) : (
                        <Bot className="h-3 w-3 text-indigo-500" />
                      )}
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                        {msg.agentName || "TrustLens AI"}
                      </span>
                    </div>

                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-2.5 shadow-sm">
                      <div className="space-y-1">{renderInlineMarkdown(msg.content)}</div>

                      {/* Feedback widgets */}
                      {isLastAssistant && msg.requires_feedback && (
                        <div className="flex items-center space-x-1.5 mt-2.5 pt-2 border-t border-slate-100">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Helpful?</span>
                          <button
                            onClick={() => { sendFeedback(true); setFeedbackClicked(prev => ({ ...prev, [idx]: true })); }}
                            disabled={hasFeedbackSaved}
                            type="button"
                            className={`p-1 rounded bg-slate-50 border transition cursor-pointer ${
                              hasFeedbackSaved ? 'opacity-40' : 'border-slate-200 hover:border-emerald-500/40 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <ThumbsUp className="h-2.5 w-2.5" />
                          </button>
                          <button
                            onClick={() => { sendFeedback(false); setFeedbackClicked(prev => ({ ...prev, [idx]: true })); }}
                            disabled={hasFeedbackSaved}
                            type="button"
                            className={`p-1 rounded bg-slate-50 border transition cursor-pointer ${
                              hasFeedbackSaved ? 'opacity-40' : 'border-slate-200 hover:border-rose-500/40 text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                          >
                            <ThumbsDown className="h-2.5 w-2.5" />
                          </button>
                          {hasFeedbackSaved && (
                            <span className="text-[8px] font-black text-emerald-600 ml-1 select-none">Saved</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end max-w-[85%] space-y-1">
                    <div className="flex items-center space-x-1 pr-1 select-none">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">
                        {authUser?.user_metadata?.role ? authUser.user_metadata.role.split(' ')[1] || 'Operator' : 'Operator'}
                      </span>
                      <User className="h-2.5 w-2.5 text-slate-400" />
                    </div>
                    <div className="bg-indigo-600 border border-indigo-500 text-white rounded-2xl rounded-tr-none px-3 py-1.5 text-[11px] font-bold shadow-md">
                      {msg.content}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Spinner */}
        {isCompanionLoading && (
          <div className="flex justify-start">
            <div className="flex flex-col w-full max-w-[90%] space-y-1">
              <div className="flex items-center space-x-1.5 pl-1 select-none">
                <Bot className="h-3 w-3 text-indigo-500" />
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">TrustLens AI</span>
                <span className="bg-slate-100 text-slate-500 text-[8px] font-bold px-1 py-0.2 rounded font-mono uppercase tracking-widest animate-pulse">
                  Computing...
                </span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 w-[60%] flex space-x-1 items-center">
                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask a trust verification query..."
          disabled={isCompanionLoading}
          type="text"
          className="flex-1 bg-slate-50 border border-slate-200 hover:border-slate-350 focus:border-indigo-500 text-slate-800 text-xs px-3.5 py-2 rounded-xl outline-none font-semibold transition"
        />
        <button
          disabled={isCompanionLoading || !inputVal.trim()}
          type="submit"
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
};
