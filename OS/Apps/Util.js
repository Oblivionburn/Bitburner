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

export function FindPath(ns, target)
{
	path_found = false;
	path_servers = [];
	path_ignore = [];
	
	if (target == undefined)
	{
		return "Target server not provided.";
	}
	else
	{
		deepSearch(ns, "home", target);
		
		if (path_found)
		{
			let connections = "home;";
			for (let i = 0; i < path_servers.length; i++)
			{
				connections += "connect " + path_servers[i] + ";";
			}
			return connections;
		}
		else
		{
			return "Server not found!";
		}
	}
}

function deepSearch(ns, serverName, target)
{
	path_ignore.push(serverName);

	let scan_results = ns.scan(serverName);
	let count = scan_results.length;
	for (let i = 0; i < count; i++)
	{
		let server = scan_results[i];

		if (path_found)
		{
			break;
		}
		else if (path_ignore.includes(server))
		{
			continue;
		}
		else if (server == target)
		{
			path_found = true;
			path_servers.push(server);
		}
		else
		{
			path_servers.push(server);

			deepSearch(ns, server, target);
			if (path_found)
			{
				break;
			}
			else
			{
				path_servers.pop();
			}
		}
	}
}