import express from 'express';
import {
    countNullFieldsInStakeholders,
    createTempOrg1,
    getAllDataReview,
    previewData,
    registerOrgCreate,
    registerOrgEmergencyContact,
    registerOrgEmergencyContactDelete,
    registerOrgEmergencyContactUpdate,
    registerOrgStakeholders,
    OrganizationStakeholdersDelete,
    stakeholdersPictureUpload,
    OrganizationStakeholdersUpdate,
    deleteOrganization, updateOrganization, rejectDataShow, acceptDataShow
} from "../controllers/index.js";
import upload from '../config/multer.config.js';
import {verifyToken} from "../middlewares/token.middleware.js";


const router = express.Router();

// A new organization operations
router.post('/register/:userId', verifyToken, registerOrgCreate);
router.patch('/register/:orgId', verifyToken, updateOrganization)
router.delete('/register/:orgId', verifyToken, deleteOrganization);

// Organization stakeholder operations
router.post('/register-stakeholder/:orgId', verifyToken, registerOrgStakeholders)
router.patch('/register-stakeholder-update/:id', verifyToken, OrganizationStakeholdersUpdate)
router.delete('/register-stakeholder-delete/:id', verifyToken, OrganizationStakeholdersDelete)

router.post('/register-stakeholder-image/:stakeholderId',
    upload.fields([
        {name: 'nidFront', maxCount: 1},
        {name: 'nidBack', maxCount: 1},
        {name: 'stakeholderImage', maxCount: 1},
    ]),
    verifyToken,
    stakeholdersPictureUpload)

// Organization Emergency contact's operations
router.post('/register-org-emergency-contact', verifyToken, registerOrgEmergencyContact)
router.patch('/register-org-emergency-contact-update/:id', verifyToken, registerOrgEmergencyContactUpdate)
router.delete('/register-org-emergency-contact-delete/:id', verifyToken, registerOrgEmergencyContactDelete)

router.get('/review/:userId', verifyToken, getAllDataReview)
// rejected data show
router.get('/rejected-data', verifyToken, rejectDataShow)
router.get('/accepted-data', verifyToken,acceptDataShow)

// testing routes for organization
router.post('/registertest/', verifyToken, createTempOrg1);
router.get('/reviewtesting', verifyToken, previewData)
router.get('/null-fields/:orgId', countNullFieldsInStakeholders)

export default router;
