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