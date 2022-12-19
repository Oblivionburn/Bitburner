export const colors = 
{
    red: "\u001b[31;1m",
    green: "\u001b[32;1m",
    yellow: "\u001b[33;1m",
    white: "\u001b[37;1m",
    reset: "\u001b[0m"
};

export function DTStamp()
{
    var dt = new Date();
        
    let year = dt.getFullYear().toString();
    let month = pad(dt.getMonth() + 1);
    let date = pad(dt.getDate());
    let hour = pad(dt.getHours());
    let minute = pad(dt.getMinutes());
    let second = pad(dt.getSeconds());

    return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second + ": ";
}

function pad(n)
{
    if (n < 10)
    {
        return '0' + n;
    }

    return n;
}