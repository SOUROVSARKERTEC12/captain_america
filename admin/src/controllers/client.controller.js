import {TempUser} from "../models/client-models/tempUser.js";
import {TempOrganization} from '../models/client-models/tempOrganization.js';
import tempStakeholder from "../models/client-models/tempStakeholder.js";
import TempOrgEmrgContact from "../models/client-models/tempOrgEmrgContact.js";
import {OrgEmrgFieldVerification} from "../models/client-models/OrgEmrgFieldVerification.js";
import {StakeholderFieldVerification} from "../models/client-models/StakeholderFieldVerification.js";
import {OrgFieldVerification} from "../models/client-models/OrgFieldVerification.js";
import {sequelize1} from "../config/database.config.js";
import {UserFieldVerification} from "../models/client-models/UserFieldVerification.js";
import {formatOrganizationData} from "../services/dataFormatter.js";
import {User} from "../models/client-models/User.js";
import {Organization} from "../models/client-models/Organization.js";
import {Stakeholder} from "../models/client-models/Stakeholder.js";
import {OrgEmrgContact} from "../models/client-models/OrggEmrgContact.js";
import tempOrgEmrgContact from "../models/client-models/tempOrgEmrgContact.js";


export const clientDataPreview = async (req, res, next) => {
    try {
        const {id} = req.params;
        const clientData = await TempOrganization.findOne({
            where: {},
            include: [
                {
                    model: TempUser,
                    as: 'organizationOwner',
                    required: true,
                    where: {
                        id: id
                    }
                },
                {
                    model: tempStakeholder,
                    as: 'stakeholder',
                    required: false
                },
                {
                    model: TempOrgEmrgContact,
                    as: 'emergencyContact',
                    required: false
                }
            ]
        });
        res.status(200).json(clientData);
    } catch (error) {
        next(error);
        error.json({message: error.message})
    }
};

export const emergencyContactVerificationData = async (req, res, next) => {
    try {
        const {id} = req.params;
        const emergencyContact = await OrgEmrgFieldVerification.findOne({
            where: {
                id: id
            }
        });

        if (emergencyContact) {
            res.status(200).json({
                data: {
                    [emergencyContact.fields]: {
                        id: emergencyContact.id,
                        value: emergencyContact.value,
                        status: emergencyContact.status
                    }
                }
            });
        } else {
            res.status(404).json({message: "Emergency contact does not exist."});
        }
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
};

export const emergencyContactVerificationConfirm = async (req, res, next) => {
    try {
        const {id} = req.params;
        const {orgEmrgContactId, status} = req.body;

        // Find the emergency contact record by its primary key (id)
        const emergencyContact = await OrgEmrgFieldVerification.findByPk(id);

        // Check if the emergency contact exists and the tempOrgEmrgContactId matches
        if (!emergencyContact) {
            return res.status(404).json({message: "Emergency contact not found."});
        }

        if (emergencyContact.tempOrgEmrgContactId === orgEmrgContactId) {
            // Determine the new status based on the 'status' field from the request body
            const newStatus = status === 'accept' ? 'verified' : status === 'reject' ? 'rejected' : emergencyContact.status;

            // Update the emergency contact record with the new status
            await emergencyContact.update({
                status: newStatus
            });

            res.status(200).json({
                message: 'Emergency contact status updated successfully.', data: {
                    [emergencyContact.fields]: {
                        id: emergencyContact.id,
                        value: emergencyContact.value,
                        status: emergencyContact.status
                    }
                }
            });
        } else {
            res.status(400).json({message: "TempOrgEmrgContactId does not match."});
        }

    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
};

export const stakeholderVerificationData = async (req, res, next) => {
    try {
        const {id} = req.params;
        const stakeholder = await StakeholderFieldVerification.findOne({
            where: {
                id: id
            }
        });

        if (stakeholder) {
            res.status(200).json({
                data: {
                    [stakeholder.fields]: {
                        id: stakeholder.id,
                        value: stakeholder.value,
                        status: stakeholder.status
                    }
                }
            });
        } else {
            res.status(404).json({message: "Stakeholder does not exist."});
        }
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const stakeholderVerificationConfirm = async (req, res, next) => {
    try {
        const {id} = req.params;
        const {stakeholderId, status} = req.body;

        // Find the stakeholder record by its primary key (id)
        const stakeholder = await StakeholderFieldVerification.findByPk(id);

        // Check if the stakeholder exists and the tempStakeholderId matches
        if (!stakeholder) {
            return res.status(404).json({message: "Stakeholder not found."});
        }

        if (stakeholder.stakeholderId === stakeholderId) {
            const newStatus = status === 'accept' ? 'verified' : status === 'reject' ? 'rejected' : stakeholder.status;

            console.log(newStatus);
            await stakeholder.update({
                status: newStatus
            });

            res.status(200).json({
                message: 'Stakeholder status updated successfully.', data: {
                    [stakeholder.fields]: {
                        id: stakeholder.id,
                        value: stakeholder.value,
                        status: stakeholder.status
                    }
                }
            });
        } else {
            res.status(400).json({message: "StakeholderId does not match."});
        }
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const organizationVerificationData = async (req, res, next) => {
    try {
        const {id} = req.params;
        const orgVerificationData = await OrgFieldVerification.findOne({
            where: {
                id: id
            }
        });

        if (orgVerificationData) {
            res.status(200).json({
                data: {
                    [orgVerificationData.fields]: {
                        id: orgVerificationData.id,
                        value: orgVerificationData.value,
                        status: orgVerificationData.status
                    }
                }
            });
        } else {
            res.status(404).json({message: "Organization verification data not found."});
        }
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const organizationVerificationConfirm = async (req, res, next) => {
    try {
        const {id} = req.params;
        const {orgId, status} = req.body;

        const orgVerificationData = await OrgFieldVerification.findOne({
            where: {
                id: id
            }
        })

        if (!orgVerificationData) {
            return res.status(404).json({message: "Organization verification data not found."});
        }

        if (orgVerificationData.tempOrganizationId === orgId) {
            const newStatus = status === 'accept' ? 'verified' : status === 'reject' ? 'rejected' : orgVerificationData.status;

            console.log(newStatus);
            await orgVerificationData.update({
                status: newStatus
            });

            res.status(200).json({
                message: 'Organization status updated successfully.', data: {
                    [orgVerificationData.fields]: {
                        id: orgVerificationData.id,
                        value: orgVerificationData.value,
                        status: orgVerificationData.status
                    }
                }
            });
        } else {
            res.status(400).json({message: "OrganizationId does not match."});
        }
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const clientVerificationData = async (req, res, next) => {
    try {
        const {id} = req.params
        const clientVerificationData = await UserFieldVerification.findOne({
            where: {
                id: id
            }
        });

        if (clientVerificationData) {
            res.status(200).json({
                data: {
                    [clientVerificationData.fields]: {
                        id: clientVerificationData.id,
                        value: clientVerificationData.value,
                        status: clientVerificationData.status
                    }
                }
            });
        } else {
            res.status(404).json({message: "Client verification data not found."});
        }
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const clientVerificationConfirm = async (req, res, next) => {
    try {
        const {id} = req.params
        const {clientId, status} = req.body;

        const clientVerificationData = await UserFieldVerification.findOne({
            where: {
                id: id
            }
        })

        if (!clientVerificationData) {
            return res.status(404).json({message: "Client verification data not found."});
        }

        if (clientVerificationData.tempUserId === clientId) {
            const newStatus = status === 'accept' ? 'verified' : status === 'reject' ? 'rejected' : clientVerificationData.status;

            console.log(newStatus);
            await clientVerificationData.update({
                status: newStatus
            });

            res.status(200).json({
                message: 'Client status updated successfully.', data: {
                    [clientVerificationData.fields]: {
                        id: clientVerificationData.id,
                        value: clientVerificationData.value,
                        status: clientVerificationData.status
                    }
                }
            });
        }
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const rejectDataShow = async (req, res, next) => {
    try {
        const {userId} = req.body;
        const tempUser = await TempUser.findByPk(userId);

        if (!tempUser) {
            return res.status(401).json({message: "Unauthorized access."});
        }

        const userFieldVerificationData = await sequelize1.query(
            `SELECT userfieldverification.id,
                    userfieldverification.fields,
                    userfieldverification.value,
                    userfieldverification.status
             FROM tempusers
                      INNER JOIN userfieldverification
                                 ON tempusers.id = userfieldverification.tempUserId
             WHERE tempusers.id = :userId
               AND userfieldverification.status = 'rejected'`,
            {
                type: sequelize1.QueryTypes.SELECT,
                replacements: {userId: userId},
            }
        );

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
                    required: true,
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


        const result = {
            ...clientData.toJSON(),
            userFieldVerificationData,
        };

        res.status(200).json(formatOrganizationData(result));
        // res.status(200).json(result);
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

        const userFieldVerificationData = await sequelize1.query(
            `SELECT userfieldverification.id,
                    userfieldverification.fields,
                    userfieldverification.value,
                    userfieldverification.status
             FROM tempusers
                      INNER JOIN userfieldverification
                                 ON tempusers.id = userfieldverification.tempUserId
             WHERE tempusers.id = :userId
               AND userfieldverification.status = 'verified'`,
            {
                type: sequelize1.QueryTypes.SELECT,
                replacements: {userId: userId},
            }
        );

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
                    required: true,
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


        const result = {
            ...clientData.toJSON(),
            userFieldVerificationData,
        };

        res.status(200).json(formatOrganizationData(result));
        // res.status(200).json(result);
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const showAfterOperations = async (req, res, next) => {
    try {
        const {userId} = req.params;
        const tempUser = await TempUser.findByPk(userId);

        if (!tempUser) {
            return res.status(401).json({message: "Unauthorized access."});
        }

        const userFieldVerificationData = await sequelize1.query(
            `SELECT userfieldverification.id,
                    userfieldverification.fields,
                    userfieldverification.value,
                    userfieldverification.status
             FROM tempusers
                      INNER JOIN userfieldverification
                                 ON tempusers.id = userfieldverification.tempUserId
             WHERE tempusers.id = :userId`,
            {
                type: sequelize1.QueryTypes.SELECT,
                replacements: {userId: userId},
            }
        );

        const clientData = await TempOrganization.findOne({
            where: {},
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
                        },
                    ],
                },
            ],
        });


        const result = {
            ...clientData.toJSON(),
            userFieldVerificationData,
        };

        res.status(200).json(formatOrganizationData(result));
        // res.status(200).json(result);
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}

export const approveTheClientInformation = async (req, res, next) => {
    const transaction = await sequelize1.transaction();
    try {
        const {userId, status} = req.body;
        const tempUser = await TempUser.findByPk(userId);

        if (!tempUser) {
            return res.status(401).json({message: "Unauthorized access."});
        }

        const userFieldVerificationData = await sequelize1.query(
            `SELECT userfieldverification.id,
                    userfieldverification.fields,
                    userfieldverification.value,
                    userfieldverification.status
             FROM tempusers
                      INNER JOIN userfieldverification
                                 ON tempusers.id = userfieldverification.tempUserId
             WHERE tempusers.id = :userId`,
            {
                type: sequelize1.QueryTypes.SELECT,
                replacements: {userId: userId},
            }
        );

        const clientData = await TempOrganization.findOne({
            where: {},
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
                        },
                    ],
                },
            ],
        });


        const result = {
            ...clientData.toJSON(),
            userFieldVerificationData,
        };

        const allFieldsApproved = [
            ...userFieldVerificationData,
            ...result.orgVerificationFields,
            ...result.stakeholder.flatMap(s => s.fieldVerification),
            ...result.emergencyContact.flatMap(e => e.emrgContact)
        ].every(field => field.status === 'verified');


        // If any field is not approved, return an error response
        if (!allFieldsApproved) {
            return res.status(400).json({ message: "Not all fields are verified." });
        }

        // console.log("TEST:", result.stakeholder.flatMap(s => s.username))
        if (status === 'approved') {
            const user = await User.create({
                email: result.organizationOwner.email,
                password: result.organizationOwner.password,
                firstName: result.organizationOwner.firstName,
                lastName: result.organizationOwner.lastName,
                nidFront: result.organizationOwner.nidFront,
                nidBack: result.organizationOwner.nidBack,
                phone: result.organizationOwner.phone,
                verified: true,
                status: "verified"
            }, {transaction});

            console.log("User is created");

            const organization = await Organization.create({
                orgName: result.orgName,
                address: result.address,
                city: result.city,
                country: result.country,
                tin: result.tin,
                industry: result.industry,
                establishYear: result.establishYear,
                status: "verified",
                userId: user.id
            }, {transaction});
            console.log("Organization is created");

            // Create stakeholders
            const stakeholders = result.stakeholder.map(s => ({
                username: s.username,
                email: s.email,
                firstName: s.firstName,
                lastName: s.lastName,
                phone: s.phone,
                nidFront: s.nidFront,
                nidBack: s.nidBack,
                stakeholderImage: s.stakeholderImage,
                status: "verified",
                orgId: organization.id
            }));

            await Stakeholder.bulkCreate(stakeholders, {transaction});
            console.log("Stakeholders are created")

            const emergencies = result.emergencyContact.map(s => ({
                username: s.username,
                phone: s.phone,
                whatsapp: s.whatsapp,
                status: "verified",
                orgId: organization.id
            }), {transaction});

            console.log("Emergency Contact is created")
            await OrgEmrgContact.bulkCreate(emergencies, {transaction});

            await TempUser.destroy({ where: { id: userId }, transaction });
            await TempOrganization.destroy({ where: { orgId: clientData.orgId }, transaction });
            await tempStakeholder.destroy({ where: { orgId: clientData.orgId }, transaction });
            await TempOrgEmrgContact.destroy({ where: { orgId: clientData.orgId }, transaction });

            await transaction.commit()
        }
        res.status(200).json(formatOrganizationData(result));
        // res.status(200).json(result);
    } catch (error) {
        next(error);
        res.status(500).json({message: error.message});
    }
}
// Query Testing controller
export const previewData = async (req, res, next) => {
    try {
        const {userId} = req.body;

        if (!userId) {
            return res.status(400).json({
                message: "User ID is required.",
            });
        }

        const tempUsers = await sequelize1.query(
            `SELECT userfieldverification.*
             FROM tempusers
                      INNER JOIN userfieldverification
                                 ON tempusers.id = userfieldverification.tempUserId
             WHERE tempusers.id = :userId`,
            {
                type: sequelize1.QueryTypes.SELECT, // Specifies the type of query
                replacements: {userId: userId}, // Replaces the :userId placeholder
            }
        );


        // Format the result to group field verifications under the same user
        return res.status(200).json({
            message: "Data preview fetched successfully.",
            data: tempUsers,
        });
    } catch (error) {
        console.error("Error in previewData:", error);
        return res.status(500).json({
            message: "An error occurred while fetching user data.",
            error: error.message,
        });
    }
};


