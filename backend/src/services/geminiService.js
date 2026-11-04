const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const OpenAI = require('openai');

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY, 
    baseURL: 'https://api.groq.com/openai/v1',
});

// L'Modèle s7i7 li kaykhdem daba f Groq
const MODEL = 'openai/gpt-oss-120b'; 

async function getChatResponse(userMessage, history = []) {
    try {
        const formattedHistory = history.map(msg => {
            if (msg.parts) return { role: msg.role === 'model' ? 'assistant' : msg.role, content: msg.parts[0]?.text || '' };
            return msg;
        });
        
        const messages = [...formattedHistory, { role: 'user', content: userMessage }];
        
        const chatCompletion = await groq.chat.completions.create({
            messages: messages, 
            model: MODEL, 
            temperature: 0.3,
        });
        return chatCompletion.choices[0]?.message?.content || "Je n'ai pas de réponse.";
    } catch (error) {
        console.error("❌ Erreur Groq:", error.message);
        return "Désolé, l'assistant IA est indisponible.";
    }
}

async function generateReportData(userPrompt, dataContext) {
    try {
        const prompt = `Tu es un analyste de données pour NMN Communication.
        L'utilisateur demande : "${userPrompt}".
        Voici les données brutes de l'application : ${dataContext}
        
        Ta mission : Prépare un rapport structuré en JSON pour répondre à sa demande.
        
        ⚠️ RÈGLE ABSOLUE : Ne renvoie pas plus de 15 lignes dans le tableau "data". Si les données sont nombreuses, fais un résumé ou sélectionne les plus importantes. Le rapport doit tenir sur 1 ou 2 pages maximum.
        
        Ne renvoie QUE du JSON valide, sans texte avant ou après.
        
        Format STRICT attendu :
        {
          "title": "Titre du rapport",
          "summary": "Résumé explicatif en 2 phrases",
          "columns": ["Colonne 1", "Colonne 2", "Colonne 3"],
          "data": [
            ["Valeur 1", "Valeur 2", "Valeur 3"]
          ]
        }`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL,
            temperature: 0.1,
            response_format: { type: "json_object" }
        });
        
        return JSON.parse(chatCompletion.choices[0]?.message?.content);
    } catch (error) {
        console.error("Erreur JSON Groq:", error.message);
        return { title: "Erreur", summary: "Erreur de génération", columns: [], data: [] };
    }
}

module.exports = { getChatResponse, generateReportData };