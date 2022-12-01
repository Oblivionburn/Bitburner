/** @param {NS} ns */

let base_servers = [];
let base_servers_with_money = [];

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

export async function deepScan(ns)
{
	base_servers = [];
	base_servers_with_money = [];
	
	var purchased_servers = ns.getPurchasedServers();

	//Recursively scan all the servers, except Home and purchased ones
	await deep_scan(ns, "home", purchased_servers);
}

export async function deep_scan(ns, server, purchased_servers)
{
	var scan_results = ns.scan(server);
	if (scan_results.length > 0)
	{
		for (let i = 0; i < scan_results.length; i++)
		{
			var server = scan_results[i];
			if (server != "home" &&
				!purchased_servers.includes(server) &&
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

export async function gainRoot(ns, server)
{
	//Which port do we need to open?
	var portsRequired = ns.getServerNumPortsRequired(server);

	var canBruteSSH = ns.fileExists("BruteSSH.exe", "home");
	var canFTPCrack = ns.fileExists("FTPCrack.exe", "home");
	var canRelaySMTP = ns.fileExists("relaySMTP.exe", "home");
	var canHTTPWorm = ns.fileExists("HTTPWorm.exe", "home");
	var canSQLInject = ns.fileExists("SQLInject.exe", "home");

	//Do we already have root access for this server?
	var hasRoot = ns.hasRootAccess(server);
	if (!hasRoot)
	{
		var portsOpened = 0;
		if (portsRequired >= 5 &&
			canSQLInject)
		{
			portsOpened++;
			ns.sqlinject(server);
		}
		if (portsRequired >= 4 &&
			canHTTPWorm)
		{
			portsOpened++;
			ns.httpworm(server);
		}
		if (portsRequired >= 3 &&
			canRelaySMTP)
		{
			portsOpened++;
			ns.relaysmtp(server);
		}
		if (portsRequired >= 2 &&
			canFTPCrack)
		{
			portsOpened++;
			ns.ftpcrack(server);
		}
		if (portsRequired >= 1 &&
			canBruteSSH)
		{
			portsOpened++;
			ns.brutessh(server);
		}

		if (portsOpened >= portsRequired)
		{
			ns.nuke(server);

			//Send alert to Terminal
			ns.tprint("Gained root access to '" + server + "' server!");
		}
		
		hasRoot = ns.hasRootAccess(server);
	}

	return hasRoot;
}