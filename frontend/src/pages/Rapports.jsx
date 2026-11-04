import { useState } from 'react';
import { FileText, Download, Bot, Send, User, FileSpreadsheet, Trash2, Sparkles } from 'lucide-react';
import api from '../services/api';

export default function Rapports() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Bonjour ! Je suis votre assistant IA. Je peux répondre à vos questions, générer des statistiques, ou créer des rapports (PDF, Word, Excel) pour vous.", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [reports, setReports] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const [chatHistory, setChatHistory] = useState([]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    const userMsg = { id: Date.now(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // 1. Sift l'soual l l'Backend w jbed l'jawab dyal l'IA
      const { data } = await api.post('/chat', { 
        message: userText,
        history: chatHistory 
      });

      // 2. Zid l'jawab f l'chat
      const botMsg = { id: Date.now() + 1, text: data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMsg]);

      // 3. Update l'historique
      setChatHistory(prev => [
        ...prev,
        { role: "user", content: userText },
        { role: "assistant", content: data.reply }
      ]);

      // 4. Chof wach l'user bgha fichier w achmen format
      const lowerInput = userText.toLowerCase();
      let format = null;
      
      if (lowerInput.includes('pdf')) format = 'pdf';
      else if (lowerInput.includes('word') || lowerInput.includes('docx')) format = 'word';
      else if (lowerInput.includes('excel') || lowerInput.includes('xlsx') || lowerInput.includes('tableur')) format = 'excel';
      else if (lowerInput.includes('rapport') || lowerInput.includes('statistique') || lowerInput.includes('génère')) format = 'pdf'; // Default PDF

      if (format) {
        generateReportFile(format, userText);
      }

    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now(), text: "❌ Désolé, l'assistant IA est indisponible pour le moment.", sender: 'bot' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateReportFile = async (format, promptText) => {
    setIsGeneratingReport(true);
    try {
      const { data } = await api.post('/reports/generate', { format, prompt: promptText });
      setReports(prev => [...prev, { name: data.name, url: data.url, type: format }]);
    } catch (err) {
      alert("Erreur lors de la génération du fichier.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce rapport ?")) return;
    try {
      await api.delete(`/reports/${filename}`);
      setReports(reports.filter(r => r.name !== filename));
    } catch (err) {
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-[#0F0F12] min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 transition-colors">
      
      {/* L'Jneb l'isar: Chatbot */}
      <div className="w-full lg:w-1/2 flex flex-col bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden h-[80vh]">
        
        <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Assistant IA <Sparkles size={14} className="text-warning" />
              </h2>
              <p className="text-xs text-gray-500 font-medium">Propulsé par Groq</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-gray-200 text-gray-600' : 'bg-primary text-white'}`}>
                  {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-3.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.sender === 'user' 
                    ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white rounded-tr-none' 
                    : 'bg-primary/5 border border-primary/10 text-gray-800 dark:text-gray-200 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
             <div className="flex justify-start">
               <div className="flex gap-3 max-w-[80%]">
                 <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
                   <Bot size={16} />
                 </div>
                 <div className="p-4 rounded-2xl text-sm bg-gray-50 dark:bg-white/5 text-gray-500 flex gap-1.5 items-center rounded-tl-none border border-gray-100 dark:border-white/5">
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                   <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                 </div>
               </div>
             </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/10">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ex: Générer un Excel des anomalies..."
              className="w-full pl-4 pr-12 py-3.5 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-900 dark:text-white shadow-sm transition-all"
            />
            <button type="submit" disabled={isTyping} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 shadow-sm">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* L'Jneb limen: L'Liste dyal l'Fichiers */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-[#1A1A1F] border border-gray-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[80vh]">
        
        <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/10 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-primary"/> Rapports Générés
            </h2>
            <p className="text-xs text-gray-500 mt-1">Téléchargez vos documents ici</p>
          </div>
          <span className="bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-lg">
            {reports.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isGeneratingReport && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3 animate-pulse">
              <div className="p-2.5 rounded-lg bg-primary/20 text-primary">
                <FileText size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-primary">Génération en cours...</p>
                <p className="text-xs text-primary/70">L'IA prépare votre document...</p>
              </div>
            </div>
          )}

          {reports.length === 0 && !isGeneratingReport ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-full mb-4">
                <FileText size={40} className="opacity-40" />
              </div>
              <p className="text-sm font-medium">Aucun rapport généré</p>
              <p className="text-xs mt-1 max-w-[200px] text-center">Demandez à l'assistant de créer un rapport.</p>
            </div>
          ) : (
            reports.map((rep, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl hover:border-primary/50 transition-all group">
                
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    rep.type === 'pdf' ? 'bg-red-100 text-red-600 dark:bg-red-500/10' : 
                    rep.type === 'word' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10' : 
                    'bg-green-100 text-green-600 dark:bg-green-500/10'
                  }`}>
                    {rep.type === 'pdf' ? <FileText size={20} /> : 
                     rep.type === 'word' ? <FileText size={20} /> : 
                     <FileSpreadsheet size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{rep.name}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{rep.type} Document</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a href={rep.url} target="_blank" rel="noreferrer" className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 hover:text-primary hover:border-primary transition-all shadow-sm" title="Télécharger">
                    <Download size={18} />
                  </a>
                  <button onClick={() => handleDelete(rep.name)} className="p-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-500 hover:text-red-600 hover:border-red-600 transition-all shadow-sm" title="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}