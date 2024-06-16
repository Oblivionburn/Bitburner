import {colors} from "./OS/GPU.js";
import * as Util from "./OS/Apps/Util.js";
import * as HDD from "./OS/HDD.js";

let index = [];
let servers = [];
let purchasingEnabled;
let port = 5;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");

	while (true)
	{
		index = [];
		servers = [];
		DeepScan(ns, "home");

		HDD.Write(ns, "servers", servers);
		PurchasingEnabled(ns);

		if (purchasingEnabled)
		{
			PurchaseServers(ns);
			UpgradeServers(ns);
		}
		
		await ns.sleep(100);
	}
}

/** @param {NS} ns */
function PurchasingEnabled(ns)
{
	let configs = HDD.Read(ns, "configs");
	if (!configs)
	{
		purchasingEnabled = true;
		HDD.Write(ns, "configs", [{Name: "PurchasingEnabled", Value: true}]);
	}
	else
	{
		for (let i = 0; i < configs.length; i++)
		{
			let config = configs[i];
			if (config.Name == "PurchasingEnabled")
			{
				purchasingEnabled = config.Value;
				break;
			}
		}
	}
}

/** @param {NS} ns */
function PurchaseServers(ns)
{
	let money = ns.getServerMoneyAvailable("home");
	let serverCost = ns.getPurchasedServerCost(2);

	if (money >= serverCost)
	{
		let updated = false;
		let purchasedNum = 0;

		let servers = HDD.Read(ns, "servers");
		for (let i = 0; i < servers.length; i++)
		{
			let server = servers[i];
			if (ns.serverExists(server.Name))
			{
				if (server.Purchased)
				{
					purchasedNum++;
				}
			}
			else
			{
				servers.splice(i, 1);
				updated = true;
				i--;
			}
		}

		let serverLimit = ns.getPurchasedServerLimit();
		if (purchasedNum < serverLimit)
		{
			let server_name = "PS-" + purchasedNum + "-v1";
			ns.purchaseServer(server_name, 2);
			ns.tryWritePort(port, {DateTime: Util.DTStamp(), Host: "home", Order: "Purchase", Target: server_name, State: "Finished"});

			let new_server =
			{
				Name: server_name,
				Connections: [],
				Security: 1,
				MinSecurity: 1,
				MaxMoney: 0,
				HasMoney: false,
				MaxRam: 2,
				HasRam: true,
				Rooted: true,
				HackLevel: 0,
				Purchased: true
			}

			servers.push(new_server);
			updated = true;
		}

		if (updated)
		{
			HDD.Write(ns, "servers", servers);
		}
	}
}

/** @param {NS} ns */
function UpgradeServers(ns)
{
	let servers = HDD.Read(ns, "servers");
	if (servers != null &&
			servers.length > 0)
	{
		let serverRamLimit = ns.getPurchasedServerMaxRam();
		let updated = false;

		for (let i = 0; i < servers.length; i++)
		{
			let server = servers[i];

			if (ns.serverExists(server.Name))
			{
				if (server.Purchased)
				{
					let money = ns.getServerMoneyAvailable("home");
					let serverRam = ns.getServerMaxRam(server.Name);
					let nextRam = serverRam * 2;
					let upgradeCost = ns.getPurchasedServerCost(nextRam);

					let version_index = server.Name.indexOf("v");
					let server_subName = server.Name.substring(0, version_index);
					let version = server.Name.substring(version_index + 1, server.Name.length);
					let new_serverName = server_subName + "v" + (Number(version) + 1);

					if (serverRam < serverRamLimit &&
							nextRam < serverRamLimit &&
							money >= upgradeCost)
					{
						ns.killall(server.Name);
						ns.deleteServer(server.Name);
						ns.purchaseServer(new_serverName, nextRam);
						ns.tryWritePort(port, {DateTime: Util.DTStamp(), Host: server.Name, Order: "Upgrade", Target: new_serverName, State: "Finished"});

						server.Name = new_serverName;
						updated = true;
					}
				}
			}
			else
			{
				servers.splice(i, 1);
				updated = true;
				i--;
			}
		}

		if (updated)
		{
			HDD.Write(ns, "servers", servers);
		}
	}
}

/** @param {NS} ns */
function DeepScan(ns, host)
{
	let maxRam = ns.getServerMaxRam(host);
	let maxMoney = ns.getServerMaxMoney(host);
	let hackLevel = ns.getServerRequiredHackingLevel(host);
	let security = ns.getServerSecurityLevel(host);
	let minSecurity = ns.getServerMinSecurityLevel(host);
	let rooted = Root(ns, host);

	let server =
	{
		Name: host,
		Connections: [],
		Security: security,
		MinSecurity: minSecurity,
		MaxMoney: maxMoney,
		HasMoney: maxMoney > 0 ? true : false,
		MaxRam: maxRam,
		HasRam: maxRam > 0 ? true : false,
		Rooted: rooted,
		HackLevel: hackLevel,
		Purchased: host.includes("PS-")
	}

	if (server.Name != "home" &&
			server.Rooted &&
			server.HasRam)
	{
		Infect(ns, host);
	}

	let scan_results = ns.scan(host);

	let count = scan_results.length;
	if (count > 0)
	{
		for (let i = 0; i < count; i++)
		{
			let server_name = scan_results[i];

			if (server_name != "home" &&
					!index.includes(server_name))
			{
				if (!server.Connections.includes(server_name))
				{
					server.Connections.push(server_name);
				}
				
				index.push(server_name);
				DeepScan(ns, server_name);
			}
		}
	}

	let indexed = IndexedServer(host);
	if (!indexed)
	{
		servers.push(server);
	}
}

/** @param {NS} ns */
function Infect(ns, host)
{
	ns.scp("/OS/Apps/Weaken.js", host, "home");
	ns.scp("/OS/Apps/Grow.js", host, "home");
	ns.scp("/OS/Apps/Hack.js", host, "home");
	ns.scp("/OS/Apps/RunBatch.js", host, "home");
	ns.tryWritePort(port, {DateTime: Util.DTStamp(), Host: "home", Order: "Infect", Target: host, State: "Finished"});
}

function IndexedServer(name)
{
	let count = servers.length;
	for (let i = 0; i < count; i++)
	{
		let server = servers[i];
		if (server.Name == name)
		{
			return true;
		}
	}

	return false;
}

/** @param {NS} ns */
function Root(ns, host)
{
	let portsRequired = ns.getServerNumPortsRequired(host);
	let hasRoot = ns.hasRootAccess(host);

	if (!hasRoot)
	{
		let portsOpened = 0;

		if (portsRequired >= 5 && ns.fileExists("SQLInject.exe", "home"))
		{
			portsOpened++;
			ns.sqlinject(host);
		}
		if (portsRequired >= 4 && ns.fileExists("HTTPWorm.exe", "home"))
		{
			portsOpened++;
			ns.httpworm(host);
		}
		if (portsRequired >= 3 && ns.fileExists("relaySMTP.exe", "home"))
		{
			portsOpened++;
			ns.relaysmtp(host);
		}
		if (portsRequired >= 2 && ns.fileExists("FTPCrack.exe", "home"))
		{
			portsOpened++;
			ns.ftpcrack(host);
		}
		if (portsRequired >= 1 && ns.fileExists("BruteSSH.exe", "home"))
		{
			portsOpened++;
			ns.brutessh(host);
		}

		if (portsOpened >= portsRequired)
		{
			ns.nuke(host);
			ns.tryWritePort(port, {DateTime: Util.DTStamp(), Host: "home", Order: "Root", Target: host, State: "Finished"});
			ns.tprint(`${colors["white"] + "Gained root access to '" + host + "' server!"}`);
		}
		
		hasRoot = ns.hasRootAccess(host);
	}

	return hasRoot;
}