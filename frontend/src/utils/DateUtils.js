
function getTimeFromTimestamp(timeInput){
    const date = new Date(timeInput)
    const hour = date.getHours() < 10 ? '0'+date.getHours() : date.getHours()
    const minute = date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes()
    return hour+":"+minute
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