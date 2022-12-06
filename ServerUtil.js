/** @param {NS} ns */

let base_servers = [];
let base_servers_with_money = [];
let base_servers_with_ram = [];
let purchased_servers = [];

export async function getBaseServers(ns)
{
	base_servers = [];
	base_servers_with_money = [];
	purchased_servers = [];
	base_servers_with_ram = [];

	await deep_scan(ns, "home");

	return base_servers;
}

export async function getBaseServersWithMoney(ns)
{
	base_servers = [];
	base_servers_with_money = [];
	purchased_servers = [];
	base_servers_with_ram = [];

	await deep_scan(ns, "home");
	
	return base_servers_with_money;
}

export async function getBaseServersWithRam(ns)
{
	base_servers = [];
	base_servers_with_money = [];
	purchased_servers = [];
	base_servers_with_ram = [];
	
	await deep_scan(ns, "home");
	
	return base_servers_with_ram;
}

export async function getBoughtServers(ns)
{
	base_servers = [];
	base_servers_with_money = [];
	purchased_servers = [];
	base_servers_with_ram = [];

	await deep_scan(ns, "home");

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

			if (server.includes("PS-") &&
				!purchased_servers.includes(server))
			{
				purchased_servers.push(server);
			}
			else if (server != "home" &&
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