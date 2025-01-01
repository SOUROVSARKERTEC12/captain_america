export const formatOrganizationData = (data) => {
    if (!data) {
        return { message: "No data provided." };
    }

    return {
        data: {
            orgId: data.id,
            orgVerificationFields: mapFields(data.orgVerificationFields),
            orgOwnerId: data.organizationOwner?.id || null,
            userFieldVerification: mapFields(data.organizationOwner?.UserFieldVerifications || []),
            stakeholder: mapStakeholders(data.stakeholder || []),
            emergencyContact: mapEmergencyContacts(data.emergencyContact || []),
        },
    };
};

const mapFields = (fields) => {
    if (!fields) return [];
    return fields.map(({ id, fields: fieldName, value, status }) => ({
        id,
        fields: fieldName,
        value,
        status,
    }));
};

const reduceVerification = (verifications) => {
    if (!verifications) return {};
    return verifications.reduce((result, { id, fields, value, status }) => {
        result[fields] = { id, value, status };
        return result;
    }, {});
};

const mapStakeholders = (stakeholders) => {
    if (!stakeholders) return [];
    return stakeholders
        .filter(({ fieldVerification }) => fieldVerification && fieldVerification.length > 0)
        .map(({ id, fieldVerification }) => ({
            id,
            fieldVerification: mapFields(fieldVerification),
        }));
};

const mapEmergencyContacts = (contacts) => {
    if (!contacts) return [];
    return contacts.map(({ id, emrgContact }) => ({
        id,
        emrgContactVerification: reduceVerification(emrgContact),
    }));
};
