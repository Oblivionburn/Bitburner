let path_servers = [];
let path_ignore = [];
let path_found = false;

/** @param {NS} ns */
export function GetCost(ns, script, threads)
{
	return ns.getScriptRam(script) * threads;
}

/** @param {NS} ns */
export function AvailableRam(ns, host)
{
	return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}

export function IsServerPrepped(security, minSecurity, money, maxMoney)
{
	if (security <= minSecurity &&
			money >= maxMoney)
	{
		return true;
	}

	return false;
}

export function GetLength(array)
{
	if (array != null)
	{
		return array.length;
	}

	return 0;
}

export function msToTime(duration)
{
	let milliseconds = Math.floor((duration % 1000));
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);
  let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = (hours < 10) ? "0" + hours : hours;
  minutes = (minutes < 10) ? "0" + minutes : minutes;
  seconds = (seconds < 10) ? "0" + seconds : seconds;

  return minutes + ":" + seconds + "." + milliseconds;
}

export function DTStamp()
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