/*
	Lists the Max RAM on all servers
	RAM Cost: 1.85GB
*/

let servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");
	
	deepScan(ns, "home");

	servers.sort((a,b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));

	let serverList = "";
	for (let i = 0; i < servers.length; i++)
	{
		let server = servers[i];

		serverList += server + ": " + ns.getServerMaxRam(server);
		if (i < servers.length - 1)
		{
			serverList += "\n";
		}
	}
	ns.print(serverList);
}

function deepScan(ns, serverName)
{
	let scanResults = ns.scan(serverName);
	let serverCount = scanResults.length;
	for (let i = 0; i < serverCount; i++)
	{
		let server = scanResults[i];

		if (server != "home" &&
			!servers.includes(server) &&
			ns.getServerMaxRam(server) > 0)
		{
			servers.push(server);
			deepScan(ns, server);
		}
	}

	return false;
}