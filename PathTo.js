/*
	Generates a connection path to a server
	RAM Cost: 1.80GB
*/

let servers = [];
let ignore = [];
let found = false;

/** @param {NS} ns */
export async function main(ns)
{
	let target = ns.args[0];

	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home", target);
	
	if (target == undefined)
	{
		ns.print("Target server not provided.");
	}
	else
	{
		findPath(ns, "home", target);
		
		if (found)
		{
			ns.print(servers.join(" -> "));
		}
		else
		{
			ns.print("Server not found!");
		}
	}
}

function findPath(ns, serverName, target)
{
	ignore.push(serverName);

	let scan_results = ns.scan(serverName);
	let count = scan_results.length;
	for (let i = 0; i < count; i++)
	{
		let server = scan_results[i];

		if (ignore.includes(server))
		{
			continue;
		}
		else if (server == target)
		{
			servers.push(server);
			return true;
		}
		else
		{
			servers.push(server);

			found = findPath(ns, server, target);
			if (found)
			{
				return true;
			}
			else
			{
				servers.pop();
			}
		}
	}

	return false;
}