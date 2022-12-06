/*
	Manager script is in charge of distributing scripts to
		all the other servers and executing them
		
	RAM Cost: 5.70GB
*/

import * as ServerUtil from "ServerUtil.js";

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail("Manager.js", "home");

	const colors = 
    {
		red: "\u001b[31;1m",
		green: "\u001b[32;1m",
		yellow: "\u001b[33;1m",
		white: "\u001b[37;1m",
		reset: "\u001b[0m"
	};

	//Run other scripts
	//ns.exec("HacknetManager.js", "home");

	var base_servers = await ServerUtil.getBaseServers(ns);
	var base_servers_with_money = await ServerUtil.getBaseServersWithMoney(ns);
	var base_servers_with_ram = await ServerUtil.getBaseServersWithRam(ns);
	var rooted_servers = [];
	var rooted_servers_with_money = [];
	var rooted_servers_with_ram = [];
	var available_servers = [];

	while (true)
	{
		ns.clearLog();

		ns.exec("BuyServer.js", "home");
		ns.exec("UpgradeServers.js", "home");

		var purchased_servers = await ServerUtil.getBoughtServers(ns);
		var purchasedServerNumLimit = ns.getPurchasedServerLimit();

		//Root all the servers
		for (let i = 0; i < base_servers.length; i++)
		{
			let server = base_servers[i];
			if (!rooted_servers.includes(server))
			{
				ns.exec("RootAccess.js", "home", 1, server);
				if (ns.hasRootAccess(server))
				{
					rooted_servers.push(server);

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
		
		//Consolidate into available_servers list
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

		var minPurchasedServerRam = Number.MAX_SAFE_INTEGER;
		var maxPurchasedServerRam = 0;
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
		}

		//Split duties:
		//Weaken = 50%
		var weaken_index = Math.floor((available_servers.length * 50) / 100);
		//Grow = 30%
		var grow_index = Math.floor(weaken_index + (available_servers.length * 30) / 100);
		//Hack = 20%
		var hack_index = Math.floor(grow_index + (available_servers.length * 20) / 100);

		for (let i = 0; i < available_servers.length; i++)
		{
			let server = available_servers[i];
			
			if (i <= weaken_index)
			{
				await removeScript(ns, "grow.js", server);
				await removeScript(ns, "hack.js", server);

				await runScript(ns, "weaken.js", server, rooted_servers_with_money);
			}
			else if (i <= grow_index)
			{
				await removeScript(ns, "weaken.js", server);
				await removeScript(ns, "hack.js", server);

				await runScript(ns, "grow.js", server, rooted_servers_with_money);
			}
			else if (i <= hack_index)
			{
				await removeScript(ns, "weaken.js", server);
				await removeScript(ns, "grow.js", server);

				await runScript(ns, "hack.js", server, rooted_servers_with_money);
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
		ns.print("\n");
		ns.print(`${colors["white"] + "Total Servers Available: " + colors["green"] + available_servers.length}`);
		ns.print(`${colors["white"] + "Weaken Index: " + colors["green"] + "0 - " + weaken_index + " (50%)"}`);
		ns.print(`${colors["white"] + "Grow Index: " + colors["green"] + (weaken_index + 1) + " - " + grow_index + " (30%)"}`);
		ns.print(`${colors["white"] + "Hack Index: " + colors["green"] + (grow_index + 1) + " - " + hack_index + " (20%)"}`);

		await ns.sleep(30000);
	}
}

async function removeScript(ns, script, server)
{
	if (ns.fileExists(script, server))
	{
		ns.scriptKill(script, server);
		ns.rm(script, server);
	}
}

async function runScript(ns, script, server, servers_with_money)
{
	ns.scp(script, server, "home");
	
	let ramCost = ns.getScriptRam(script, server);
	let maxRam = ns.getServerMaxRam(server);

	for (let i = 0; i < servers_with_money.length; i++)
	{
		let server_with_money = servers_with_money[i];
		
		let threads = Math.floor((maxRam - ns.getServerUsedRam(server)) / ramCost);
		if (threads > 0)
		{
			ns.exec(script, server, 1, server_with_money);
		}
		else
		{
			break;
		}
	}
}