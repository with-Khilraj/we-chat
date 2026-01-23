/**
 * Truncates a string to a specified length and adds an ellipsis.
 * @param {string} content - The string to truncate.
 * @param {number} maxLength - The maximum length of the string.
 * @returns {string} - The truncated string.
 */
export const truncateMessage = (content = "", maxLength = 25) => {
    if (!content) return "";
    return content.length > maxLength
        ? `${content.substring(0, maxLength)}...`
        : content;
};

/**
 * Formats a timestamp into a human-readable relative time string.
 * @param {string|Date} timestamp - The timestamp to format.
 * @returns {string} - The formatted relative time.
 */
export const formatRelativeTime = (timestamp) => {
    if (!timestamp) return "";

    const now = new Date();
    const date = new Date(timestamp);
    const diffInSeconds = Math.abs(now - date) / 1000;

    const intervals = {
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    if (diffInSeconds >= intervals.week) {
        const weeks = Math.floor(diffInSeconds / intervals.week);
        return `${weeks}w`;
    } else if (diffInSeconds >= intervals.day) {
        const days = Math.floor(diffInSeconds / intervals.day);
        return `${days}d`;
    } else if (diffInSeconds >= intervals.hour) {
        const hours = Math.floor(diffInSeconds / intervals.hour);
        return `${hours}h`;
    } else if (diffInSeconds >= intervals.minute) {
        const minutes = Math.floor(diffInSeconds / intervals.minute);
        return `${minutes}m`;
    } else {
        return "just now";
    }
};
