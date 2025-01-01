/*
import { CustomError } from '../utils/customError'; // Custom error class for consistent error handling
import { HttpStatusCode } from '../constants/httpStatusCode'; // Optionally, define status codes in a constants file

export const register = async (req, res, next) => {
    const transaction = await sequelize.transaction();

    try {
        // Validate input using Zod or any validation schema
        const validatedData = validateUser(req.body);

        // Check if email is already registered or pending in TempAdmin table
        const existingUser = await User.findOne({
            where: { email: validatedData.email },
            transaction
        });

        if (existingUser) {
            throw new CustomError('Email already registered', HttpStatusCode.BAD_REQUEST);
        }

        const tempUser = await TempUser.findOne({
            where: { email: validatedData.email },
            transaction
        });

        if (tempUser) {
            await TempUser.destroy({ where: { email: tempUser.email }, transaction });
        }

        if (req.files && req.files.nidFront && req.files.nidBack) {
            // Extract image paths from the uploaded files
            const nidFrontPath = req.files.nidFront[0].path; // Assuming you're using multer
            const nidBackPath = req.files.nidBack[0].path;

            // Upload images to Cloudinary
            const nidFrontUpload = cloudinary.uploader.upload(nidFrontPath, { folder: 'information' });
            const nidBackUpload = cloudinary.uploader.upload(nidBackPath, { folder: 'information' });

            // Wait for both uploads to complete
            const [nidFrontResult, nidBackResult] = await Promise.all([nidFrontUpload, nidBackUpload]);

            const nidFrontSave = nidFrontResult.secure_url;
            const nidBackSave = nidBackResult.secure_url;

            validatedData.nidFront = nidFrontSave;
            validatedData.nidBack = nidBackSave;
        }

        // Create a new TempUser entry in the database with transaction handling
        const tempUserData = await TempUser.create(validatedData, { transaction });

        // Create a verification fields for temp user
        const verificationFields = [
            'email', 'firstName', 'lastName', 'nidFront', 'nidBack', 'phone', 'role'
        ];
        const tempUserFieldVerificationData = verificationFields.map((field) => ({
            tempUserId: tempUserData.id,
            fields: field,
            value: validatedData[field] || null,
            status: 'pending',
        }));

        await UserFieldVerification1.bulkCreate(tempUserFieldVerificationData, { transaction });

        // Request OTP and send verification email
        const otp = EmailOTPService.generateOTP();
        console.log("EmailOTP", otp);

        // Store OTP in OTPStore table, ensuring the OTP is associated with the TempAdmin
        await OTPStore.create({
            otp,
            tempUserId: tempUserData.id,
            email: tempUserData.email
        }, { transaction });

        // Send OTP via email
        await EmailOTPService.sendOTP(otp, validatedData.email);

        // Commit the transaction after all operations are successful
        await transaction.commit();

        res.status(200).json({
            message: 'Registration initiated. Please verify your email to complete registration.'
        });
    } catch (error) {
        // Rollback the transaction to maintain data integrity
        if (transaction) await transaction.rollback();

        // If it's a custom error, pass it to the next error handler
        if (error instanceof CustomError) {
            return next(error);
        }

        // Log and pass unknown errors to the global error handler
        console.error(error);
        return next(new CustomError('Error registering user', HttpStatusCode.INTERNAL_SERVER_ERROR, error.message));
    }
};
*/
