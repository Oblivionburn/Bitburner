/*
	Simply lists all the servers
*/

export let servers_list = []

/** @param {NS} ns */
export async function main(ns)
{
	servers_list = [];
	ns.disableLog("ALL");
	ns.clearLog();
	ns.tail("list-servers.js", "home");
	
	await deep_scan(ns, "home");
}

export async function deep_scan(ns, server)
{
	var servers = ns.scan(server);
	if (servers.length > 0)
	{
		for (let i = 0; i < servers.length; i++)
		{
			var server = servers[i];
			if (server != "home" &&
				!servers_list.includes(server))
			{
				servers_list.push(server);
				ns.print(server);
				await deep_scan(ns, server);
			}
		}
	}
}