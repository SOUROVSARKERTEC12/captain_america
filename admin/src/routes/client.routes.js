import express from 'express';
import {
    clientDataPreview,
    rejectDataShow, previewData,
    emergencyContactVerificationData,
    emergencyContactVerificationConfirm,
    stakeholderVerificationData,
    stakeholderVerificationConfirm,
    organizationVerificationData,
    organizationVerificationConfirm,
    clientVerificationData,
    clientVerificationConfirm,
    showAfterOperations, acceptDataShow, approveTheClientInformation
} from '../controllers/index.js';
import {verifyToken} from "../middlewares/token.middleware.js";

const router = express.Router();

router.get('/preview/:id', verifyToken, clientDataPreview)

// Emergency contact verification routes
router.get('/emergency-contact-verification/:id', emergencyContactVerificationData)
router.patch('/emergency-contact-verification/:id', emergencyContactVerificationConfirm)

// Stakeholder verification routes
router.get('/stakeholder-verification/:id', stakeholderVerificationData)
router.patch('/stakeholder-verification/:id', stakeholderVerificationConfirm)

// Organization verification routes
router.get('/org-verification/:id', organizationVerificationData)
router.patch('/org-verification/:id', organizationVerificationConfirm)

// Client verification routes
router.get('/client-verification/:id', clientVerificationData)
router.patch('/client-verification/:id', clientVerificationConfirm)

// Accepted data routes
router.get('/accepted-data', acceptDataShow)
// Rejected data route
router.get('/rejected-data', rejectDataShow)
// Field Show routes
router.get('/overall-show/:userId', showAfterOperations)

// Approved data route
router.post('/approved-data',approveTheClientInformation)
// Test routes
router.get('/test', previewData)

export default router