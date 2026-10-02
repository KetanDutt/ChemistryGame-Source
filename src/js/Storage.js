import { STORAGE_KEY } from "./Constants";

// Safe localStorage persistence: unlocked levels, best stars, mute setting.
// Every access is wrapped because storage can throw (private mode, etc).
const DEFAULTS = { unlocked: 0, stars: {}, muted: false };

function read() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULTS };
        return Object.assign({ ...DEFAULTS }, JSON.parse(raw));
    } catch (e) {
        return { ...DEFAULTS };
    }
}

function write(data) {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        /* non-fatal */
    }
}

export const Storage = {
    getSave: read,

    getUnlocked() { return read().unlocked || 0; },
    unlockUpTo(index) {
        const data = read();
        if (index + 1 > data.unlocked) {
            data.unlocked = index + 1;
            write(data);
        }
    },

    getStars(levelIndex) { return (read().stars || {})[levelIndex] || 0; },
    recordStars(levelIndex, stars) {
        const data = read();
        if (stars > (data.stars[levelIndex] || 0)) {
            data.stars[levelIndex] = stars;
            write(data);
        }
    },
    totalStars() {
        const stars = read().stars || {};
        return Object.values(stars).reduce((a, b) => a + b, 0);
    },

    getMuted() { return !!read().muted; },
    setMuted(muted) {
        const data = read();
        data.muted = !!muted;
        write(data);
    },

    reset() { write({ ...DEFAULTS }); }
};
