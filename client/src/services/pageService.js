import {Pages} from "../models/page/pages.js";

export const getFirstIncompletePage = async (userId) => {
    try {
        // Fetch the user's pages based on their ID
        const userPage = await Pages.findOne({ where: { tempUserId: userId } });

        if (!userPage) {
            return { message: 'User pages not found.', status: 404 };
        }

        // Check for the first incomplete page, excluding the last page
        const firstIncompletePage = Object.entries(userPage.toJSON())
            .find(([key, value]) => key.startsWith('page') && value === false);

        if (firstIncompletePage) {
            return { message: `Page is incomplete: ${firstIncompletePage[0]}`, status: 400 };
        }

        return { message: 'All pages are complete.', status: 200 };
    } catch (error) {
        console.error('Error fetching user pages:', error);
        throw new Error('Unable to process request');
    }
};