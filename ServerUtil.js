/** @param {NS} ns */

let base_servers = [];
let base_servers_with_money = [];

export async function deepScan(ns)
{
	await deep_scan(ns, "home");
}

export async function getBaseServers(ns)
{
	await deepScan(ns);
	return base_servers;
}

export async function getServersWithMoney(ns)
{
	await deepScan(ns);
	return base_servers_with_money;
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
				!base_servers.includes(server))
			{
				var maxMoney = ns.getServerMaxMoney(server);
				if (maxMoney > 0)
				{
					base_servers_with_money.push(server);
				}

				base_servers.push(server);
				await deep_scan(ns, server);
			}
		}
	}
}