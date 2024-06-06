/** @param {NS} ns */
export async function main(ns)
{
	let host = ns.getHostname();

	let target = ns.args[0];
	let delay = ns.args[1];

	ns.tryWritePort(3, {DateTime: DTStamp(), Host: host, Order: "Hack", Target: target, State: "Started"});

	if (delay > 0)
	{
		await ns.sleep(delay);
	}
	
	await ns.hack(target).then(()=> {
		ns.tryWritePort(3, {DateTime: DTStamp(), Host: host, Order: "Hack", Target: target, State: "Finished"});
	});
}

function DTStamp()
{
	var dt = new Date();
			
	let year = dt.getFullYear().toString();
	let month = pad(dt.getMonth() + 1);
	let date = pad(dt.getDate());
	let hour = pad(dt.getHours());
	let minute = pad(dt.getMinutes());
	let second = pad(dt.getSeconds());
	let millisecond = padMs(dt.getMilliseconds());

	return year + "-" + month + "-" + date + " " + hour + ":" + minute + ":" + second + "." + millisecond;
}

function pad(n)
{
	if (n < 10)
	{
		return '0' + n;
	}

	return n;
}

function padMs(n)
{
	if (n < 10)
	{
		return '00' + n;
	}
	else if (n < 100)
	{
		return '0' + n;
	}

	return n;
}