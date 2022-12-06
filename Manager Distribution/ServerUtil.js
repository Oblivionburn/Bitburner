/** @param {NS} ns */

let base_servers = [];
let base_servers_with_money = [];
let base_servers_with_ram = [];
let purchased_servers = [];

export async function getBaseServers(ns)
{
	base_servers = [];
	base_servers_with_money = [];
	base_servers_with_ram = [];

	await deep_scan(ns, "home");

	return base_servers;
}

export async function getBaseServersWithMoney(ns)
{
	base_servers = [];
	base_servers_with_money = [];
	base_servers_with_ram = [];

	await deep_scan(ns, "home");
	
	return base_servers_with_money;
}

export async function getBaseServersWithRam(ns)
{
	base_servers = [];
	base_servers_with_money = [];
	base_servers_with_ram = [];
	
	await deep_scan(ns, "home");
	
	return base_servers_with_ram;
}

export async function getBoughtServers(ns)
{
	purchased_servers = [];

	await scan_purchased_servers(ns, "home");

	return purchased_servers;
}

export async function deep_scan(ns, server)
{
	var scan_results = ns.scan(server);
	if (scan_results.length > 0)
	{
		for (let i = 0; i < scan_results.length; i++)
		{
			var server = scan_results[i];

			if (server != "home" &&
				!server.includes("PS-") &&
				!base_servers.includes(server))
			{
				var maxMoney = ns.getServerMaxMoney(server);
				if (maxMoney > 0)
				{
					base_servers_with_money.push(server);
				}

				var maxRam = ns.getServerMaxRam(server);
				if (maxRam > 0)
				{
					base_servers_with_ram.push(server);
				}

				base_servers.push(server);
				await deep_scan(ns, server);
			}
		}
	}
}

export async function scan_purchased_servers(ns, server)
{
	var scan_results = ns.scan(server);
	if (scan_results.length > 0)
	{
		for (let i = 0; i < scan_results.length; i++)
		{
			var server = scan_results[i];

			if (server.includes("PS-") &&
				!purchased_servers.includes(server))
			{
				purchased_servers.push(server);
			}
		}
	}
}