/*
	Manager script is in charge of distributing scripts to
		all the other servers and executing them
		
	RAM Cost: 1.95GB
*/

import * as ServerUtil from "./Manager/ServerUtil.js";

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

	ns.print(`${colors["green"] + "Green = Has Money"}`);
	ns.print(`${colors["yellow"] + "Yellow = Has Ram, but no Money"}`);
	ns.print(`${colors["white"] + "White = Has no Money/Ram"}`);
	ns.print("\n");
	
	
	var base_servers = await ServerUtil.getBaseServers(ns);
	var base_servers_with_money = await ServerUtil.getBaseServersWithMoney(ns);
	var base_servers_with_ram = await ServerUtil.getBaseServersWithRam(ns);

	ns.print(`${colors["red"] + "Base Servers: " + base_servers.length}`);
	var servers = "";
	for (let i = 0; i < base_servers.length; i++)
	{
		let server = base_servers[i];
		if (base_servers_with_money.includes(server))
		{
			servers += `${colors["green"] + server}`;
		}
		else if (base_servers_with_ram.includes(server))
		{
			servers += `${colors["yellow"] + server}`;
		}
		else
		{
			servers += `${colors["white"] + server}`;
		}

		if (i < base_servers.length - 1)
		{
			servers += ";";
		}
	}
	ns.print(servers);
	ns.print("\n");
	
	servers = "";
	ns.print(`${colors["red"] + "Purchased Servers: " + purchased_servers.length}`);
	var purchased_servers = await ServerUtil.getBoughtServers(ns);
	for (let i = 0; i < purchased_servers.length; i++)
	{
		let server = purchased_servers[i];
		servers += `${colors["yellow"] + server}`;

		if (i < purchased_servers.length - 1)
		{
			servers += ";";
		}
	}
	ns.print(servers);
}