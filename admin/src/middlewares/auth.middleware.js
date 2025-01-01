import Session from "../models/Session.js";
import {Admin} from "../models/Admin.js";


export const authenticateSession = async (req, res, next) => {
    try {
        // Extract session ID from cookie
        const sessionId = req.headers.cookie?.split('=')[0];
        console.log(sessionId)
        if (!sessionId) {
            return res.status(401).json({ error: 'Unauthorized: No session provided' });
        }

        // Validate session in the database
        const session = await Session.findOne({ where: { id: sessionId } });
        if (!session || new Date() > session.expiresAt) {
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
        }

        // Attach user to the request
        const user = await Admin.findByPk(session.userId);
        req.user = user;

        next();
    } catch (error) {
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};
