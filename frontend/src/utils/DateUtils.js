
function getTimeFromTimestamp(timeInput, delay=null){
    const date = new Date(timeInput)
    let hour = date.getHours()
    let minute = date.getMinutes()
    if(delay != null && delay > 0){
        hour += Math.trunc(delay / 60)
        minute += delay - (60 * Math.trunc(delay / 60))
        if(minute > 59){
            hour += Math.floor(minute / 60)
            minute = minute % 60
        }
    }
    const time = (hour < 10 ? "0" + hour : hour) + ":" + (minute < 10 ? "0" + minute : minute)
    return time
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

export {getTimeFromTimestamp, getTimeStampFromTime}