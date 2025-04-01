function getTimeStampFromTime(timeInput) {
    const now = new Date();
    const hourLocal = now.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome' }).split(':')[0];
    const hourUTC = now.toTimeString().split(':')[0]
    const offset = hourLocal - hourUTC
    return Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        timeInput.hour - offset,
        timeInput.minute,
        0,
        0
    );
}


module.exports = { getTimeStampFromTime}