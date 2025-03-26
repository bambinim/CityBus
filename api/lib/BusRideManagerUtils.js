function getTimeStampFromTime(timeInput) {
    const hour = timeInput.hour - 1
    const minute = timeInput.minute

    const now = new Date();


    now.setUTCHours(hour);
    now.setUTCMinutes(minute);
    now.setUTCSeconds(0);
    now.setUTCMilliseconds(0);

    return now.getTime();
}


module.exports = { getTimeStampFromTime}