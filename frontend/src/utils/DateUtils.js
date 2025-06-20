
function getTimeFromTimestamp(timeInput, delay = null) {
    const date = new Date(timeInput);

    date.setMinutes(date.getMinutes());

    const time = getTimeFormatted(date, delay);
    return time;
}

function getTimeFromTimestampWithOffset(timeInput) {
    const date = new Date(timeInput);

    const offsetMinutes = date.getTimezoneOffset();

    date.setMinutes(date.getMinutes() + offsetMinutes);

    const time = getTimeFormatted(date);
    return time;
}

function getTimeFormatted(date, delay = null) {
    let hour = date.getHours();
    let minute = date.getMinutes();

    if (delay != null && delay > 0) {
        hour += Math.trunc(delay / 60);
        minute += delay - (60 * Math.trunc(delay / 60));
        if (minute > 59) {
            hour += Math.floor(minute / 60);
            minute = minute % 60;
        }
    }
    return (hour < 10 ? "0" + hour : hour) + ":" + (minute < 10 ? "0" + minute : minute);
}

function getTimeStampFromTime(timeInput) {
    const [hours, minutes] = timeInput.split(':').map(Number);

    const now = new Date();

    now.setHours(hours);
    now.setMinutes(minutes);
    now.setSeconds(0);
    now.setMilliseconds(0);

    return now.getTime();
}

function getTimeDifference(time1, time2) {
    const timeDifference = time1 - time2

    const secondsDifference = Math.floor(timeDifference / 1000)
    return secondsDifference
}

export {getTimeFromTimestamp, getTimeStampFromTime, getTimeFromTimestampWithOffset, getTimeDifference}