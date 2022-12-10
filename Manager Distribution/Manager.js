/*
	Manager script is in charge of distributing scripts to
		all the other servers and executing them
		
	RAM Cost: 6.45GB
*/

import * as ServerUtil from "ServerUtil.js";

let base_servers = [];
let base_servers_with_money = [];
let base_servers_with_ram = [];
let rooted_servers = [];
let rooted_servers_with_money = [];
let rooted_servers_with_ram = [];
let purchased_servers = [];
let available_servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	const colors = 
    {
		red: "\u001b[31;1m",
		green: "\u001b[32;1m",
		yellow: "\u001b[33;1m",
		white: "\u001b[37;1m",
		reset: "\u001b[0m"
	};

	let weaken_percent = 55;
	let grow_percent = 40;
	let hack_percent = 5;

	base_servers = await ServerUtil.getBaseServers(ns);
	base_servers_with_money = await ServerUtil.getBaseServersWithMoney(ns);
	base_servers_with_ram = await ServerUtil.getBaseServersWithRam(ns);

	while (true)
	{
		ns.clearLog();

		ns.exec("BuyServer.js", "home");
		ns.exec("UpgradeServers.js", "home");

		purchased_servers = await ServerUtil.getBoughtServers(ns);
		let purchasedServerNumLimit = ns.getPurchasedServerLimit();

		//Root all the servers
		await rootServers(ns);
		await checkRootedServers();
		 
		//Consolidate into available_servers list
		await consolidateServers();

		let minPurchasedServerRam = Number.MAX_SAFE_INTEGER;
		let maxPurchasedServerRam = 0;
		let nextCost = Number.MAX_SAFE_INTEGER;

		for (let i = 0; i < purchased_servers.length; i++)
		{
			let server = purchased_servers[i];
			
			let maxRam = ns.getServerMaxRam(server);
			if (maxRam < minPurchasedServerRam)
			{
				minPurchasedServerRam = maxRam;
			}
			if (maxRam > maxPurchasedServerRam)
			{
				maxPurchasedServerRam = maxRam;
			}

			let serverCost = ns.getPurchasedServerCost(maxRam * 2);
			if (serverCost < nextCost)
			{
				nextCost = serverCost;
			}
		}

		if (minPurchasedServerRam == Number.MAX_SAFE_INTEGER)
		{
			minPurchasedServerRam = 0;
		}
		if (nextCost == Number.MAX_SAFE_INTEGER)
		{
			nextCost = ns.getPurchasedServerCost(2);
		}

		//Split duties:
		let weaken_index = Math.floor((available_servers.length * weaken_percent) / 100);
		let grow_index = Math.floor(weaken_index + (available_servers.length * grow_percent) / 100);

		for (let i = 0; i < available_servers.length; i++)
		{
			let server = available_servers[i];
			
			if (i <= weaken_index)
			{
				await removeScript(ns, "grow.js", server);
				await removeScript(ns, "hack.js", server);

				await runScript(ns, "weaken.js", server);
			}
			else if (i <= grow_index)
			{
				await removeScript(ns, "weaken.js", server);
				await removeScript(ns, "hack.js", server);

				await runScript(ns, "grow.js", server);
			}
			else
			{
				await removeScript(ns, "weaken.js", server);
				await removeScript(ns, "grow.js", server);

				await runScript(ns, "hack.js", server);
			}
		}

		ns.print(`${colors["white"] + "Base Servers: " + colors["green"] + base_servers.length}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Base Servers with money: " + colors["green"] + base_servers_with_money.length}`);
		ns.print(`${colors["white"] + "Rooted Base Servers with money: " + colors["green"] + rooted_servers_with_money.length}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Base Servers with ram: " + colors["green"] + base_servers_with_ram.length}`);
		ns.print(`${colors["white"] + "Rooted Base Servers with ram: " + colors["green"] + rooted_servers_with_ram.length}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Max Purchased Servers: " + colors["green"] + purchasedServerNumLimit}`);
		ns.print(`${colors["white"] + "Purchased Servers: " + colors["green"] + purchased_servers.length}`);
		ns.print(`${colors["white"] + "Min Purchased Server Ram: " + colors["green"] + minPurchasedServerRam}`);
		ns.print(`${colors["white"] + "Max Purchased Server Ram: " + colors["green"] + maxPurchasedServerRam}`);
		ns.print(`${colors["white"] + "Next Purchased Server Cost: " + colors["green"] + "$" + nextCost.toLocaleString()}`);
		ns.print("\n");
		ns.print(`${colors["white"] + "Total Servers Available: " + colors["green"] + available_servers.length}`);
		ns.print(`${colors["white"] + "Weaken Index: " + colors["green"] + "0 - " + weaken_index + " (" + weaken_percent + "%)"}`);
		ns.print(`${colors["white"] + "Grow Index: " + colors["green"] + (weaken_index + 1) + " - " + grow_index + " (" + grow_percent + "%)"}`);
		ns.print(`${colors["white"] + "Hack Index: " + colors["green"] + (grow_index + 1) + " - " + (available_servers.length - 1) + " (" + hack_percent + "%)"}`);

		await ns.sleep(1000);
	}
}

async function rootServers(ns)
{
	if (rooted_servers.length < base_servers.length)
	{
		for (let i = 0; i < base_servers.length; i++)
		{
			let server = base_servers[i];
			if (!rooted_servers.includes(server))
			{
				if (!ns.hasRootAccess(server))
				{
					ns.exec("RootAccess.js", "home", 1, server);
				}
				else
				{
					rooted_servers.push(server);
				}
			}
		}
	}
}

async function checkRootedServers()
{
	if (base_servers_with_ram.length > rooted_servers_with_ram.length ||
		base_servers_with_money.length > rooted_servers_with_money.length)
	{
		for (let i = 0; i < rooted_servers.length; i++)
		{
			let server = rooted_servers[i];

			if (base_servers_with_ram.includes(server) &&
				!rooted_servers_with_ram.includes(server))
			{
				rooted_servers_with_ram.push(server);
			}
			
			if (base_servers_with_money.includes(server) &&
				!rooted_servers_with_money.includes(server))
			{
				rooted_servers_with_money.push(server);
			}
		}
	}
}

async function consolidateServers()
{
	var total = rooted_servers_with_ram.length + purchased_servers.length;
	if (available_servers.length < total)
	{
		for (let i = 0; i < rooted_servers_with_ram.length; i++)
		{
			let server = rooted_servers_with_ram[i];
			if (!available_servers.includes(server))
			{
				available_servers.push(server);
			}
		}

		for (let i = 0; i < purchased_servers.length; i++)
		{
			let server = purchased_servers[i];
			if (!available_servers.includes(server))
			{
				available_servers.push(server);
			}
		}
	}
}

export async function removeScript(ns, script, server)
{
	if (ns.fileExists(script, server))
	{
		ns.scriptKill(script, server);
		ns.rm(script, server);
	}
}

export async function runScript(ns, script, server)
{
	ns.scp(script, server, "home");
	
	let ramCost = ns.getScriptRam(script, server);
	let maxRam = ns.getServerMaxRam(server);
	let serverCount = rooted_servers_with_money.length;
	let allServers = ramCost * serverCount;
	let threadsForAllServers = Math.floor(maxRam / allServers);
	let allServersRamCost = threadsForAllServers * ramCost;

	for (let i = 0; i < serverCount; i++)
	{
		let server_with_money = rooted_servers_with_money[i];
		let usedRam = ns.getServerUsedRam(server);
		let availableRam = maxRam - usedRam;

		if (availableRam >= allServersRamCost &&
			threadsForAllServers > 0)
		{
			ns.exec(script, server, threadsForAllServers, server_with_money);
		}
		else if (availableRam >= ramCost)
		{
			ns.exec(script, server, 1, server_with_money);
		}
		else
		{
			break;
		}
	}
}