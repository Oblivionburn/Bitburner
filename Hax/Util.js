export const colors = 
{
	red: "\u001b[31;1m",
	green: "\u001b[32;1m",
	yellow: "\u001b[33;1m",
	white: "\u001b[37;1m",
	reset: "\u001b[0m"
};

let path_found = false;
let path_servers = [];
let path_ignore = [];

/** @param {NS} ns */
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
		DeepSearch(ns, "home", target);
		
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

/** @param {NS} ns */
export function DeepSearch(ns, serverName, target)
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

			DeepSearch(ns, server, target);
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