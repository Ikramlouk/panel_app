const router = require('express').Router();
const auth = require('../middleware/auth');
const { getChatResponse } = require('../services/geminiService');
const pool = require('../config/db');

router.post('/', auth, async (req, res) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Le message est requis." });
    }

    try {
        // 1. Jbed l'data l'7a9i9iya dyal l'application
        const panneauxRes = await pool.query('SELECT reference, emplacement, status FROM panneaux');
        const panneauxList = panneauxRes.rows;

        const anomaliesRes = await pool.query(`
            SELECT d.anomalie_type, d.confidence, d.detected_at, p.reference 
            FROM detections d
            JOIN panneaux p ON d.panneau_id = p.id
            WHERE d.anomalie_type IS NOT NULL 
            ORDER BY d.detected_at DESC LIMIT 10
        `);
        const anomaliesList = anomaliesRes.rows;

        // 2. 9ad l'contexte li ghadi ykoun 3nd l'IA
        const contextData = `
        --- DONNÉES DE L'APPLICATION ---
        Total Panneaux: ${panneauxList.length}
        Liste (Réf | Ville | Statut) : 
        ${panneauxList.map(p => `- ${p.reference} | ${p.emplacement || 'Inconnu'} | ${p.status}`).join('\n')}

        Dernières Anomalies :
        ${anomaliesList.map(a => `- ${a.anomalie_type} sur ${a.reference} le ${new Date(a.detected_at).toLocaleDateString('fr-FR')}`).join('\n')}
        --------------------------------
        `;

        // 3. 🔥 L'PROMPT JDID (Bach tjawb 3la kolchi)
        const finalMessage = `
        [RÔLE]
        Tu es l'assistant IA intelligent de NMN Communication. Tu es capable de répondre à TOUT type de questions (culture générale, science, mathématiques, etc.) tout en ayant un accès direct aux données de l'application.

        [CONTEXTE DES DONNÉES DE L'APPLICATION]
        ${contextData}

        [RÈGLES DE RÉPONSE]
        1. Si l'utilisateur pose une question sur les panneaux ou les anomalies de l'entreprise, base-toi UNIQUEMENT sur les données ci-dessus. Ne dis jamais que tu n'as pas l'information si elle est présente dans le contexte.
        2. Si l'utilisateur pose une question générale (ex: "Qui es-tu ?", "Quelle est la capitale de la France ?", "Comment ça va ?"), réponds normalement en utilisant tes connaissances générales.
        3. Si l'utilisateur demande de générer un rapport (PDF/Word/Excel/Statistiques), réponds EXACTEMENT: "Je génère le rapport pour vous, veuillez patienter..." et ne donne pas d'explications.
        4. Sois toujours professionnel, concis et utile.

        [QUESTION DE L'UTILISATEUR]: ${message}
        `;

        // 4. Sift l Groq
        const reply = await getChatResponse(finalMessage, history);
        res.json({ reply });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});

module.exports = router;