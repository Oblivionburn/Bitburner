import * as ServerUtil from "ServerUtil.js";

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail("Manager.js", "home");

	//Run other scripts
	//ns.exec("HacknetManager.js", "home");
	
	while (true)
	{
		ns.clearLog();

		ns.exec("BuyServer.js", "home");
		ns.exec("UpgradeServers.js", "home");

		var base_servers = await ServerUtil.getBaseServers(ns);
		var base_servers_with_money = await ServerUtil.getBaseServersWithMoney(ns);
		var purchased_servers = await ServerUtil.getBoughtServers(ns);
		var purchasedServerNumLimit = ns.getPurchasedServerLimit();
		var base_servers_with_ram = await ServerUtil.getBaseServersWithRam(ns);
		var rooted_servers_with_money = [];
		var rooted_servers_with_ram = [];
		var available_servers = [];

		//Root all the servers
		for (let i = 0; i < base_servers.length; i++)
		{
			let server = base_servers[i];
			ns.exec("RootAccess.js", "home", 1, server);

			if (ns.hasRootAccess(server))
			{
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

		//Consolidate into available_servers list
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

		//Split duties:
		//Weaken = 50%
		var weaken_index = (available_servers.length * 50) / 100;
		//Grow = 30%
		var grow_index = weaken_index + (available_servers.length * 30) / 100;
		//Hack = 20%
		var hack_index = grow_index + (available_servers.length * 20) / 100;

		for (let i = 0; i < available_servers.length; i++)
		{
			let server = available_servers[i];
			
			if (i <= weaken_index)
			{
				runScript(ns, "weaken.js", server, rooted_servers_with_money);
			}
			else if (i <= grow_index)
			{
				runScript(ns, "grow.js", server, rooted_servers_with_money);
			}
			else if (i <= hack_index)
			{
				runScript(ns, "hack.js", server, rooted_servers_with_money);
			}
		}

		var rooted = rooted_servers_with_ram.length;
		var purchased = purchased_servers.length;
		var total = available_servers.length;
		
		ns.print("Base Servers: " + base_servers.length);
		ns.print("\n");
		ns.print("Base Servers with money: " + base_servers_with_money.length);
		ns.print("Rooted Base Servers with money: " + rooted_servers_with_money.length);
		ns.print("\n");
		ns.print("Base Servers with ram: " + base_servers_with_ram.length);
		ns.print("Rooted Base Servers with ram: " + rooted);
		ns.print("\n");
		ns.print("Max Purchased Servers: " + purchasedServerNumLimit);
		ns.print("Purchased Servers: " + purchased);
		ns.print("\n");
		ns.print("Total Servers Available: " + total);
		ns.print("Weaken Index: " + weaken_index);
		ns.print("Grow Index: " + grow_index);
		ns.print("Hack Index: " + hack_index);

		await ns.sleep(60000);
	}
}

function runScript(ns, script, server, servers_with_money)
{
	if (!ns.fileExists(script, server))
	{
		ns.scp(script, server, "home");
	}
	else
	{
		for (let i = 0; i < servers_with_money.length; i++)
		{
			let base_server = servers_with_money[i];
			let ramCost = ns.getScriptRam(script, server); 
			let threads = Math.floor((ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / ramCost);

			if (threads > 0)
			{
				ns.exec(script, server, 1, base_server)
			}
		}
	}
}