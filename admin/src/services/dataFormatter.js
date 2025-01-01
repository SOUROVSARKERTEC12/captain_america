
export const formatOrganizationData = (data) => {
    if (!data) {
        return { message: "No data provided." };
    }

    return {
        data: {
            orgId: data.id,
            orgVerificationFields: mapFields(data.orgVerificationFields),
            orgOwnerId: data.organizationOwner?.id || null,
            userFieldVerification: mapFields(data.userFieldVerificationData),
            stakeholder: mapStakeholders(data.stakeholder),
            emergencyContact: mapEmergencyContacts(data.emergencyContact),
        },
    };
};

const mapFields = (fields) => {
    const result = [];
    if (fields) {
        for (const { id, fields: fieldName, value, status } of fields) {
            result.push({ id, fields: fieldName, value, status });
        }
    }
    return result;
};

const reduceVerification = (verifications) => {
    const result = {};
    if (verifications) {
        for (const { id, fields, value, status } of verifications) {
            result[fields] = { id, value, status };
        }
    }
    return result;
};

const mapStakeholders = (stakeholders) => {
    const result = [];
    if (stakeholders) {
        for (const { id, fieldVerification } of stakeholders) {
            if (fieldVerification && fieldVerification.length > 0) {
                result.push({
                    id,
                    fieldVerification: mapFields(fieldVerification),
                });
            }
        }
    }
    return result;
};

const mapEmergencyContacts = (contacts) => {
    const result = [];
    if (contacts) {
        for (const { id, emrgContact } of contacts) {
            result.push({
                id,
                emrgContactVerification: reduceVerification(emrgContact),
            });
        }
    }
    return result;
};