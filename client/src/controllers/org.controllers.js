import sequelize from '../config/database.config.js';
import {TempUser} from '../models/TempUser.js';
import {TempOrganization} from '../models/tempOrganization.js';
import {validateOrg} from "../validators/org.validator.js";
import {validateStkholder} from "../validators/stkholder.validator.js";
import tempStakeholder from "../models/tempStakeholder.js";
import TempOrgEmrgContact from "../models/tempOrgEmrgContact.js";
import {validateOrgEmrgContact} from "../validators/emrgC.validator.js";
import cloudinary from "../config/cloudinary.config.js";
import {Pages} from "../models/page/pages.js";
import {getFirstIncompletePage} from "../services/pageService.js";
import {TempOrg1Validator} from "../validators/tempOrgValidtor.js";
import {OrgEmrgFieldVerification} from "../models/OrgEmrgFieldVerification.js";
import {StakeholderFieldVerification} from "../models/StakeholderFieldVerification.js";
import {OrgFieldVerification} from "../models/OrgFieldVerification.js";
import {CustomError} from '../utils/customError.js';
import {HttpStatusCode} from '../utils/httpStatusCode.js';
import {UserFieldVerification} from "../models/UserFieldVerification.js";
import {formatOrganizationData} from "../services/dataFormatter.js";
import {Organization} from "../models/Organization.js";
import {Stakeholder} from "../models/Stakeholder.js";

// temporary Organization registration
export const registerOrgCreate = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {userId} = req.params;

        // Validate organization data from request body
        const validateOrgData = validateOrg(req.body);
        const {orgName} = validateOrgData;

        // Find the TempUser by userId
        const tempUser = await TempUser.findOne({where: {id: userId}});
        if (!tempUser) {
            throw new CustomError('User not found.', HttpStatusCode.NOT_FOUND);
        }

        // Check if the user is verified
        if (!tempUser.verified) {
            throw new CustomError('User must be verified before registering an organization.', HttpStatusCode.FORBIDDEN);
        }

        // Check if the organization already exists
        const existingOrganization = await Organization.findOne({where: {orgName: orgName}})
        const existingOrg = await TempOrganization.findOne({where: {orgName}, transaction});
        if (existingOrg || existingOrganization) {
            throw new CustomError('Organization with this name already exists.', HttpStatusCode.BAD_REQUEST);
        }

        // Create the organization
        const tempOrg = await TempOrganization.create({...validateOrgData, tempUserId: userId}, {transaction});

        // Create the organization verification fields
        const verificationFields = ["orgName", "address", "city", "country", "tin", "industry", "establishYear"];
        const orgFieldVerificationData = verificationFields.map((field) => ({
            tempOrganizationId: tempOrg.id,
            field,
            value: validateOrgData[field] || null,
            status: 'pending',
        }));

        await OrgFieldVerification.bulkCreate(orgFieldVerificationData, {transaction});

        // Create a stakeholder record for the organization
        await tempStakeholder.create({
            orgId: tempOrg.id,
            username: `${tempUser.firstName} ${tempUser.lastName}`,
            firstName: tempUser.firstName,
            lastName: tempUser.lastName,
            email: tempUser.email,
            phone: tempUser.phone,
            nidFront: tempUser.nidFront,
            nidBack: tempUser.nidBack,
        }, {transaction});

        // Update the Pages table for the user
        await Pages.update({page2: true, page3: true}, {where: {tempUserId: tempUser.id}, transaction});

        // Commit the transaction
        await transaction.commit();

        // Response with user and organization details
        res.status(201).json({
            message: 'Organization registered successfully.',
            user: {
                id: tempUser.id,
                username: tempUser.username,
                email: tempUser.email,
                phone: tempUser.phone,
            },
            tempOrg,
        });

    } catch (error) {
        // Rollback the transaction in case of error
        if (transaction) await transaction.rollback();
        next(error); // Pass the error to the global error handler
    }
};
// temporary Organization update
export const updateOrganization = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {orgId} = req.params;

        // Validate the input (assuming validation logic is implemented elsewhere)
        const validatedOrganizationData = req.body;

        // Find the TempOrg by id
        const tempOrg = await TempOrganization.findByPk(orgId);
        if (!tempOrg) {
            throw new CustomError('Organization not found.', HttpStatusCode.NOT_FOUND);
        }

        // Update the organization verification fields
        const updateFields = Object.keys(validatedOrganizationData);

        for (const field of updateFields) {
            await OrgFieldVerification.update(
                {
                    value: validatedOrganizationData[field],
                    status: 'pending',
                    updatedAt: new Date(),
                },
                {
                    where: {
                        tempOrganizationId: orgId,
                        fields: field,
                    },
                    transaction,
                }
            );
        }

        // Update the organization details
        await tempOrg.update(validatedOrganizationData, {transaction});

        // Commit the transaction
        await transaction.commit();

        // Response with updated organization details
        res.status(200).json({
            message: "Organization updated successfully.",
            data: tempOrg,
        });
    } catch (error) {
        // Rollback transaction in case of error
        if (transaction) await transaction.rollback();

        next(error); // Pass the error to the global error handler
    }
};
// temporary Organization's delete
export const deleteOrganization = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {orgId} = req.params;
        const tempOrg = await TempOrganization.findByPk(orgId);

        if (!tempOrg) {
            throw new CustomError('Organization not found.', HttpStatusCode.NOT_FOUND);
        }

        await Pages.update({
            page2: false,
            page3: false,
            page4: false,
            page5: false,
            page6: false,
        }, {where: {tempUserId: tempOrg.tempUserId}, transaction});

        // Delete the organization
        await tempOrg.destroy({transaction});

        // Commit the transaction
        await transaction.commit();

        // Response with success message
        res.status(200).json({message: "Organization deleted successfully."});
    } catch (error) {
        // Rollback the transaction in case of error
        if (transaction) await transaction.rollback();
        next(error); // Pass the error to the global error handler
    }
};

// temporary organization's stakeholder
export const registerOrgStakeholders = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {orgId} = req.params;

        // Step 1: Validate if the request body contains stakeholders array
        const stakeholdersData = req.body.stakeholders;
        const originalStakeholders = await Stakeholder.findOne(({
            where: {
                orgId: orgId
            },
        }))
        if (originalStakeholders) {
            throw new CustomError('Organization already has stakeholders registered.', HttpStatusCode.CONFLICT);
        }

        if (!Array.isArray(stakeholdersData) || stakeholdersData.length === 0) {
            throw new CustomError('Stakeholders data is required and must be an array.', HttpStatusCode.BAD_REQUEST);
        }

        // Step 2: Check if the orgId matches a valid tempOrg
        const tempOrg = await TempOrganization.findOne({where: {id: orgId}});

        if (!tempOrg) {
            throw new CustomError('Organization ID not found.', HttpStatusCode.BAD_REQUEST);
        }

        // Step 3: Validate stakeholder count
        const stakeholderCount = await tempStakeholder.count();
        if (stakeholderCount >= 6) {
            throw new CustomError('Adding these stakeholders exceeds the limit of 6.', HttpStatusCode.BAD_REQUEST);
        }

        // Step 4: Add orgId to each stakeholder and register them
        const createdStakeholders = [];
        const fieldVerificationRecords = [];
        for (const stakeholderData of stakeholdersData) {
            stakeholderData.orgId = orgId; // Automatically assign orgId

            // Validate individual stakeholder data
            const isValid = validateStkholder(stakeholderData);
            if (!isValid) {
                throw new CustomError(`Invalid data for stakeholder: ${JSON.stringify(stakeholderData)}`, HttpStatusCode.BAD_REQUEST);
            }

            const stakeholder = await tempStakeholder.create(stakeholderData, {transaction});
            createdStakeholders.push(stakeholder);
            const fieldsToVerify = [
                "username",
                "email",
                "firstName",
                "lastName",
                "phone",
                "nidFront",
                "nidBack",
                "stakeholderImage",
            ];

            for (const field of fieldsToVerify) {
                if (stakeholderData[field]) {
                    fieldVerificationRecords.push({
                        stakeholderId: stakeholder.id,
                        fields: field,
                        value: stakeholderData[field],
                    });
                }
            }
        }

        // Bulk create field verification records
        if (fieldVerificationRecords.length > 0) {
            await StakeholderFieldVerification.bulkCreate(fieldVerificationRecords, {transaction});
        }

        // Step 5: Increment the stakeholderCount in tempOrg
        const updateCount = tempOrg.stakeholderCount + createdStakeholders.length;
        await tempOrg.update({stakeholderCount: updateCount}, {transaction});

        // Step 6: Retrieve all stakeholders for the organization
        const allStakeholders = await tempStakeholder.findAll({
            where: {orgId}, transaction,
        });

        // Step 8: Update a specific page record in Pages
        await Pages.update({page4: false}, {
            where: {}, include: [{
                model: TempUser, as: "TempUser", required: true, include: [{
                    model: TempOrganization, as: "TempOrg", required: true, where: {id: orgId},
                },],
            },], transaction,
        });

        await transaction.commit();

        return res.status(200).json({
            message: "Stakeholders registered successfully.",
            stakeholders: createdStakeholders,
            allStakeholders: allStakeholders,
        });
    } catch (error) {
        // Rollback transaction in case of an error
        if (transaction) await transaction.rollback();
        next(error); // Pass the error to the global error handler
    }
};
// temporary organization stakeholder update
export const OrganizationStakeholdersUpdate = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {id} = req.params;

        // Validate the incoming data (adjust validation as needed)
        const validateOrganizationStakeholdersData = req.body;

        // Find the stakeholder by ID
        const stakeholder = await tempStakeholder.findByPk(id);
        if (!stakeholder) {
            throw new CustomError('Stakeholder not found', HttpStatusCode.NOT_FOUND);
        }

        // Check if the stakeholder is the organization owner
        const isOwner = await TempOrganization.findOne({
            where: {id: stakeholder.orgId},
            include: [
                {
                    model: TempUser,
                    as: 'organizationOwner', // Ensure this matches your association alias
                    attributes: ['email'],   // Only fetch the email for comparison
                },
            ],
        });

        if (isOwner.organizationOwner.email === stakeholder.email) {
            throw new CustomError('Cannot update the owner of the organization', HttpStatusCode.FORBIDDEN);
        }

        // Update the stakeholder's data
        await stakeholder.update({...validateOrganizationStakeholdersData}, {transaction});

        // Update the stakeholder verification fields
        const updateFields = Object.keys(validateOrganizationStakeholdersData);

        // Loop through fields to update them individually
        for (const field of updateFields) {
            await StakeholderFieldVerification.update(
                {
                    value: validateOrganizationStakeholdersData[field], // The updated value
                    status: 'pending',                                   // Update status to pending for re-verification
                    updatedAt: new Date(),                               // Update the timestamp
                },
                {
                    where: {
                        stakeholderId: stakeholder.id, // Ensure it matches the stakeholder ID
                        fields: field,                 // The specific field to update
                    },
                    transaction,
                }
            );
        }

        // Commit the transaction
        await transaction.commit();

        // Respond with success
        return res.status(200).json({
            message: 'Stakeholder updated successfully',
            stakeholder,
        });
    } catch (error) {
        // Rollback the transaction in case of error
        if (transaction) await transaction.rollback();
        next(error); // Pass the error to the global error handler
    }
};
// temporary organization stakeholder delete
export const OrganizationStakeholdersDelete = async (req, res, next) => {
    try {
        const {id} = req.params; // Stakeholder ID

        // Find the stakeholder by ID
        const stakeholder = await tempStakeholder.findByPk(id);

        if (!stakeholder) {
            throw new CustomError('Stakeholder not found', HttpStatusCode.NOT_FOUND);
        }

        // Check if the stakeholder is the owner of the organization
        const org = await TempOrganization.findOne({
            where: {id: stakeholder.orgId},
            include: [
                {
                    model: TempUser,
                    as: 'organizationOwner', // Assuming this alias matches the relationship in your model
                    attributes: ['email'],   // Only fetch the email for comparison
                },
            ],
        });

        if (org && org.organizationOwner.email === stakeholder.email) {
            throw new CustomError('Cannot delete the owner of the organization', HttpStatusCode.FORBIDDEN);
        }

        // Delete the images from Cloudinary (if they exist)
        if (stakeholder.nidFront) {
            const publicId = getPublicIdFromUrl(stakeholder.nidFront); // Extract public ID
            await cloudinary.uploader.destroy(publicId);
        }

        if (stakeholder.nidBack) {
            const publicId = getPublicIdFromUrl(stakeholder.nidBack); // Extract public ID
            await cloudinary.uploader.destroy(publicId);
        }

        if (stakeholder.stakeholderImage) {
            const publicId = getPublicIdFromUrl(stakeholder.stakeholderImage); // Extract public ID
            await cloudinary.uploader.destroy(publicId);
        }

        // Delete the stakeholder
        await stakeholder.destroy();

        return res.status(200).json({message: 'Stakeholder deleted successfully'});
    } catch (error) {
        console.error('Error deleting stakeholder:', error);
        next(error); // Pass the error to the global error handler
    }
};
// upload stakeholder pictures
export const stakeholdersPictureUpload = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {stakeholderId} = req.params;

        // Validate if the stakeholderId is provided
        if (!stakeholderId) {
            throw new CustomError('Stakeholder ID is required', HttpStatusCode.BAD_REQUEST);
        }

        // Verify if the stakeholder exists in the TempStakeholder table
        const stakeholder = await tempStakeholder.findOne({
            where: {id: stakeholderId},
        });

        if (!stakeholder) {
            throw new CustomError('Stakeholder not found', HttpStatusCode.NOT_FOUND);
        }

        const organization = stakeholder.orgId;

        const uploadResults = {};
        const updateData = {};

        // Check for `nidFront` file
        if (req.files?.nidFront?.[0]?.path) {
            const nidFrontPath = req.files.nidFront[0].path;

            const nidFrontUpload = await cloudinary.uploader.upload(nidFrontPath, {
                folder: 'stakeholderInfo',
            });

            uploadResults.nidFront = nidFrontUpload.secure_url;
            updateData.nidFront = uploadResults.nidFront;
        }

        // Check for `nidBack` file
        if (req.files?.nidBack?.[0]?.path) {
            const nidBackPath = req.files.nidBack[0].path;

            const nidBackUpload = await cloudinary.uploader.upload(nidBackPath, {
                folder: 'stakeholderInfo',
            });

            uploadResults.nidBack = nidBackUpload.secure_url;
            updateData.nidBack = uploadResults.nidBack;
        }

        // Check for `stakeholderImage` file
        if (req.files?.stakeholderImage?.[0]?.path) {
            const stakeholderImagePath = req.files.stakeholderImage[0].path;

            const stakeholderImageUpload = await cloudinary.uploader.upload(stakeholderImagePath, {
                folder: 'stakeholderInfo',
            });

            uploadResults.stakeholderImage = stakeholderImageUpload.secure_url;
            updateData.stakeholderImage = uploadResults.stakeholderImage;
        }

        // If no files are uploaded, return an error
        if (Object.keys(updateData).length === 0) {
            throw new CustomError('No images uploaded', HttpStatusCode.BAD_REQUEST);
        }

        // Update the stakeholder record with the new image URLs
        const updatedStakeholder = await tempStakeholder.update(updateData, {
            where: {id: stakeholderId},
        });

        if (updatedStakeholder[0] === 0) {
            throw new CustomError('Failed to update stakeholder images', HttpStatusCode.NOT_FOUND);
        }

        // Create field verification records for each updated field
        const bulkData = Object.keys(updateData).map(fields => ({
            stakeholderId,
            fields,
            value: updateData[fields],
            status: 'pending',
        }));

        // Insert field verification records
        await StakeholderFieldVerification.bulkCreate(bulkData, {transaction});

        // Get all stakeholders for the organization
        const stakeholders = await tempStakeholder.findAll({
            where: {orgId: organization},
        });

        if (!stakeholders || stakeholders.length === 0) {
            throw new CustomError('No stakeholders found for the given Organization ID.', HttpStatusCode.NOT_FOUND);
        }

        // Filter stakeholders who have at least one null field
        const nullDetails = stakeholders.map((stakeholder) => {
            const nullFields = [];
            Object.entries(stakeholder.toJSON()).forEach(([key, value]) => {
                if (value === null) nullFields.push(key);
            });

            if (nullFields.length > 0) {
                return {
                    IdOfStakeholder: stakeholder.id,
                    nullFieldCount: nullFields.length,
                    nullFields: [...nullFields],
                };
            }
            return null;
        }).filter(detail => detail !== null);

        // Update Pages if all stakeholders are updated
        if (nullDetails.length === 0) {
            await Pages.update({page4: true}, {
                where: {}, include: [{
                    model: TempUser, as: 'TempUser', required: true, include: [{
                        model: TempOrganization, as: 'TempOrg', required: true, where: {id: organization},
                    },],
                },], transaction,
            });
        }

        // Commit the transaction
        await transaction.commit();

        return res.status(200).json({
            message: 'Stakeholder images uploaded successfully',
            updatedFields: uploadResults,
            nullDetails,
        });
    } catch (error) {
        // Rollback the transaction if an error occurs
        await transaction.rollback();

        // Pass error to global handler
        next(error);
    }
};


// temporarily organization's emergency Contact
export const registerOrgEmergencyContact = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        // Step 1: Validate incoming data
        const validateOrgEmrgContactData = validateOrgEmrgContact(req.body);


        if (!validateOrgEmrgContactData || !validateOrgEmrgContactData.orgId || !validateOrgEmrgContactData.username || !validateOrgEmrgContactData.phone) {
            throw new CustomError('Missing required fields: orgId, username, phone.', HttpStatusCode.BAD_REQUEST);
        }

        // Step 2: Check if the orgId matches a valid organization
        const tempOrg = await TempOrganization.findOne({
            where: {id: validateOrgEmrgContactData.orgId},
            transaction,
        });

        if (!tempOrg) {
            throw new CustomError('Organization not found.', HttpStatusCode.NOT_FOUND);
        }

        // Step 3: Validate emergency contact count
        const tempEmergencyContactCount = await TempOrgEmrgContact.count();

        if (tempEmergencyContactCount >= 3) {
            throw new CustomError('Emergency contact limit exceeded. Maximum allowed is 3.', HttpStatusCode.BAD_REQUEST);
        }

        // Step 4: Create the Emergency Contact record
        const emergencyContact = await TempOrgEmrgContact.create(validateOrgEmrgContactData, {transaction});

        // Step 5: Create the Field Verification records
        const fieldsToVerify = ['username', 'phone', 'whatsapp'];
        const verificationRecords = fieldsToVerify.map((fields) => ({
            tempOrgEmrgContactId: emergencyContact.id,
            fields,
            value: validateOrgEmrgContactData[fields] || null,
        }));

        await OrgEmrgFieldVerification.bulkCreate(verificationRecords, {transaction});

        // Step 6: Update the organization page status
        await Pages.update({page5: true}, {
            where: {}, include: [{
                model: TempUser, as: 'TempUser', required: true, include: [{
                    model: TempOrganization, as: 'TempOrg', required: true, where: {
                        id: validateOrgEmrgContactData.orgId,
                    },
                },],
            },], transaction,
        });

        // Step 7: Commit the transaction
        await transaction.commit();

        // Step 8: Return the created emergency contact and success message
        return res.status(201).json({
            message: 'Emergency contact registered successfully.',
            emergencyContact,
        });
    } catch (error) {
        // Rollback the transaction in case of error
        await transaction.rollback();

        // Pass error to global handler
        next(error);
    }
};
// update registerOrgEmergencyContact
export const registerOrgEmergencyContactUpdate = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {id} = req.params;
        const validateOrgEmrgContactData = req.body;

        // Find the emergency contact
        const emergencyContact = await TempOrgEmrgContact.findByPk(id);
        if (!emergencyContact) {
            throw new CustomError('Emergency contact not found', HttpStatusCode.NOT_FOUND);
        }

        const updatedFields = {};

        // Iterate over the fields in the request body and check if they have been updated
        for (const key in validateOrgEmrgContactData) {
            if (validateOrgEmrgContactData[key] !== emergencyContact[key]) {
                updatedFields[key] = validateOrgEmrgContactData[key];
            }
        }

        // Update the emergency contact
        await emergencyContact.update({...validateOrgEmrgContactData}, {transaction});

        // Update the verification records for the changed fields
        for (const fields in updatedFields) {
            await OrgEmrgFieldVerification.update(
                {
                    value: updatedFields[fields],
                    status: 'pending', // Mark as pending for re-verification
                    updatedAt: new Date(), // Update the timestamp
                },
                {
                    where: {
                        tempOrgEmrgContactId: emergencyContact.id,
                        fields: fields,
                    },
                    transaction,
                }
            );
        }

        // Commit the transaction
        await transaction.commit();

        return res.status(200).json({
            message: 'Emergency contact updated successfully',
            emergencyContact,
        });
    } catch (error) {
        // Rollback transaction in case of error
        await transaction.rollback();

        // Pass the error to the global error handler
        next(error);
    }
};
// delete registrationOrgEmergencyContact
export const registerOrgEmergencyContactDelete = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const {id} = req.params; // Emergency Contact ID

        // Find the emergency contact
        const emergencyContact = await TempOrgEmrgContact.findOne({where: {id}});
        if (!emergencyContact) {
            throw new CustomError('Emergency contact not found', HttpStatusCode.NOT_FOUND);
        }

        // Delete the emergency contact
        await emergencyContact.destroy({transaction});

        // Commit the transaction
        await transaction.commit();

        return res.status(200).json({message: 'Emergency contact deleted successfully'});
    } catch (error) {
        // Rollback transaction in case of error
        await transaction.rollback();

        // Pass the error to the global error handler
        next(error);
    }
};


// all data review
export const getAllDataReview = async (req, res, next) => {
    try {
        const {userId} = req.params;

        const tempUser = await TempOrganization.findOne({
            where: {},
            attributes: {
                exclude: ["createdAt", "updatedAt", "tempUserId"],
            },
            include: [
                {
                    model: OrgFieldVerification,
                    as: 'orgVerificationFields',
                    required: false,
                    attributes: ["id", "fields", "value", "status"],
                },
                {
                    model: TempUser,
                    as: 'organizationOwner',
                    required: true,
                    attributes: ["id", "email", "firstName", "lastName", "nidFront", "nidBack", "phone", "status"],
                    where: {
                        id: userId
                    },
                    include: [{
                        model: UserFieldVerification,
                        as: 'UserFieldVerifications',
                        attributes: ["id", "fields", "value", "status"]
                    }]
                },
                {
                    model: tempStakeholder,
                    as: 'stakeholder',
                    required: false,
                    attributes: {
                        exclude: ["orgId"]
                    },
                    include: [{
                        model: StakeholderFieldVerification,
                        as: 'fieldVerification',
                        required: false,
                        attributes: ["id", "fields", "value", "status"],
                    }]
                },
                {
                    model: TempOrgEmrgContact,
                    as: 'emergencyContact',
                    required: false,
                    attributes: {
                        exclude: ["orgId", "createdAt", "updatedAt"]
                    },
                    include: [
                        {
                            model: OrgEmrgFieldVerification,
                            as: 'emrgContact',
                            required: false,
                            attributes: ["id", "fields", "value", "status"],
                        },
                    ],
                }
            ]
        });

        if (!tempUser) {
            throw new CustomError('User or associated organization not found', HttpStatusCode.NOT_FOUND);
        }

        // Update page6 status
        await Pages.update({page6: true}, {where: {tempUserId: userId}});

        const result = await getFirstIncompletePage(userId);

        if (result.status === 400) {
            throw new CustomError(result.message, HttpStatusCode.BAD_REQUEST);
        }

        // Return user and associated organization data
        return res.status(200).json({
            message: "Data review fetched successfully.",
            Information: tempUser,
        });

    } catch (error) {
        // Pass the error to the global error handler
        next(error);
    }
};
export const rejectDataShow = async (req, res, next) => {
    try {
        const {userId} = req.body;
        const tempUser = await TempUser.findByPk(userId);

        if (!tempUser) {
            return res.status(401).json({message: "Unauthorized access."});
        }

        const clientData = await TempOrganization.findOne({
            where: {},
            include: [
                {
                    model: OrgFieldVerification,
                    as: 'orgVerificationFields',
                    required: false,
                    attributes: ["id", "fields", "value", "status"],
                    where: {
                        status: 'rejected',
                    },
                },
                {
                    model: TempUser,
                    as: 'organizationOwner',
                    required: false,
                    include: [{
                        model: UserFieldVerification,
                        as: 'UserFieldVerifications',
                        required: false,
                        attributes: ["id", "fields", "value", "status"],
                        where: {
                            status: 'rejected',
                        },
                    }]
                },
                {
                    model: tempStakeholder,
                    as: 'stakeholder',
                    required: false,
                    include: [
                        {
                            model: StakeholderFieldVerification,
                            as: 'fieldVerification',
                            required: false,
                            attributes: ["id", "fields", "value", "status"],
                            where: {
                                status: 'rejected',
                            },
                        },
                    ],
                },
                {
                    model: TempOrgEmrgContact,
                    as: 'emergencyContact',
                    required: false,
                    include: [
                        {
                            model: OrgEmrgFieldVerification,
                            as: 'emrgContact',
                            required: false,
                            attributes: ["id", "fields", "value", "status"],
                            where: {
                                status: 'rejected',
                            },
                        },
                    ],
                },
            ],
        });


        res.status(200).json(formatOrganizationData(clientData));
        // res.status(200).json(clientData);
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}
export const acceptDataShow = async (req, res, next) => {
    try {
        const {userId} = req.body;
        const tempUser = await TempUser.findByPk(userId);

        if (!tempUser) {
            return res.status(401).json({message: "Unauthorized access."});
        }

        const clientData = await TempOrganization.findOne({
            where: {},
            include: [
                {
                    model: OrgFieldVerification,
                    as: 'orgVerificationFields',
                    required: false,
                    attributes: ["id", "fields", "value", "status"],
                    where: {
                        status: 'verified',
                    },
                },
                {
                    model: TempUser,
                    as: 'organizationOwner',
                    required: false,
                    include: [{
                        model: UserFieldVerification,
                        as: 'UserFieldVerifications',
                        required: false,
                        attributes: ["id", "fields", "value", "status"],
                        where: {
                            status: 'verified',
                        },
                    }]
                },
                {
                    model: tempStakeholder,
                    as: 'stakeholder',
                    required: false,
                    include: [
                        {
                            model: StakeholderFieldVerification,
                            as: 'fieldVerification',
                            required: false,
                            attributes: ["id", "fields", "value", "status"],
                            where: {
                                status: 'verified',
                            },
                        },
                    ],
                },
                {
                    model: TempOrgEmrgContact,
                    as: 'emergencyContact',
                    required: false,
                    include: [
                        {
                            model: OrgEmrgFieldVerification,
                            as: 'emrgContact',
                            required: false,
                            attributes: ["id", "fields", "value", "status"],
                            where: {
                                status: 'verified',
                            },
                        },
                    ],
                },
            ],
        });


        res.status(200).json(formatOrganizationData(clientData));
        // res.status(200).json(clientData);
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

// Controller for creating a TempOrg1 instance
export const createTempOrg1 = async (req, res, next) => {
    try {
        // Validate the input using Zod
        const validatedData = TempOrg1Validator.parse(req.body);

        // Check if the associated TempUser exists
        if (validatedData.tempUserId) {
            const tempUserExists = await TempUser.findByPk(validatedData.tempUserId);
            if (!tempUserExists) {
                return res.status(404).json({message: "Associated TempUser not found."});
            }
        }

        // Create the TempOrg1 record
        const newOrg = await TempOrg1.create(validatedData);

        // Respond with the newly created record
        res.status(201).json({
            message: "TempOrg1 created successfully.",
            data: newOrg,
        });
    } catch (error) {
        // Handle validation errors
        if (error.name === "ZodError") {
            return res.status(400).json({
                message: "Validation error.",
                errors: error.errors,
            });
        }

        // Handle other errors
        console.error(error);
        res.status(500).json({
            message: "An error occurred while creating TempOrg1.",
            error: error.message,
        });
    }
};
// Preview data test
export const previewData = async (req, res, next) => {
    try {
        const {userId} = req.body;

        // Fetch user data including the associated organization
        // const tempUser = await TempUser.findOne({
        //     where: {id: userId},
        //     include: [{
        //         model: TempOrganization,
        //         as: 'OwnerOrganization',
        //         required: false, // Allow null for organization if not associated
        //     }],
        // });
        const tempUser = await TempOrganization.findOne({
            where: {},
            include: [{
                model: TempUser,
                as: 'organizationOwner',
                required: false,
                attributes: ["id", "email", "firstName", "lastName", "nidFront", "nidBack", "phone", "status"],
                where: {
                    id: userId
                },
                include: [
                    {
                        model: UserFieldVerification,
                        as: 'UserFieldVerifications',
                        required: false,
                        where: {
                            status: 'pending'
                        }
                    }
                ]
            }]
        });


        if (!tempUser) {
            return res.status(404).json({
                message: "User or associated organization not found.",
            });
        } else {
            await Pages.update(
                {page6: true},
                {where: {tempUserId: userId}}
            );
        }

        // Return user and associated organization data
        return res.status(200).json({
            message: "Data preview fetched successfully.",
            data: tempUser,
        });
    } catch (error) {
        console.error("Error in previewData:", error);
        return res.status(500).json({
            message: "An error occurred while fetching user data.",
            error: error.message,
        });
    }
};
// TESTING API
export const countNullFieldsInStakeholders = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        const {orgId} = req.params;
        // Validate orgId
        if (!orgId) {
            return res.status(400).json({message: "Organization ID is required."});
        }

        // Find all stakeholders for the given orgId
        const stakeholders = await tempStakeholder.findAll({
            where: {orgId},
        });
        // console.log(stakeholders)

        if (!stakeholders || stakeholders.length === 0) {
            return res.status(404).json({message: "No stakeholders found for the given Organization ID."});
        }

        // Filter stakeholders who have at least one null field
        const nullDetails = stakeholders.map((stakeholder) => {
            const nullFields = [];
            Object.entries(stakeholder.toJSON()).forEach(([key, value]) => {
                if (value === null) nullFields.push(key);
            });

            // Return details only if there are null fields
            if (nullFields.length > 0) {
                return {
                    nameOfStakeholder: stakeholder.username, nullFieldCount: nullFields.length, nullFields,
                };
            }
            return null;
        }).filter(detail => detail !== null); // Remove stakeholders without null fields

        if (nullDetails.length === 0) {
            const updated = await Pages.update({page4: true}, {
                where: {}, include: [{
                    model: TempUser, as: 'TempUser', required: true, include: [{
                        model: TempOrganization, as: 'TempOrg', required: true, where: {
                            id: orgId,
                        },
                    },],
                },], transaction,
            });

            await transaction.commit();

            if (updated) {
                console.log("Page updated successfully.");
            } else {
                console.log("No pages found to update.");
            }

            return res.status(200).json({
                message: "No null fields found for any stakeholders.",
            });
        }
        // Return the result
        return res.status(200).json({
            message: "Null field details retrieved successfully.", nullDetails,
        });
    } catch (error) {
        console.error("Error counting null fields in stakeholders:", error);
        return res.status(500).json({message: "An error occurred while counting null fields."});
    }
};


const getPublicIdFromUrl = (url) => {
    const matches = url.match(/\/v[0-9]+\/(.*?)(\.[a-zA-Z0-9]+)$/);
    if (matches) {
        return matches[1]; // Return the public ID without the extension
    }
    return null;
};

