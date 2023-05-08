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

	found = false;
	servers = [];
	ignore = [];
	
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
			let connections = "home;";
			for (let i = 0; i < servers.length; i++)
			{
				connections += "connect " + servers[i] + ";";
			}
			ns.print(connections);
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

		if (found)
		{
			break;
		}
		else if (ignore.includes(server))
		{
			continue;
		}
		else if (server == target)
		{
			found = true;
			servers.push(server);
		}
		else
		{
			servers.push(server);

			findPath(ns, server, target);
			if (found)
			{
				break;
			}
			else
			{
				servers.pop();
			}
		}
	}
}