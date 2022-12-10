/*
	Gets a list of all servers with Ram
	RAM Cost: 2GB
*/

import * as ServerUtil from "./Manager/ServerUtil.js";

let base_servers = [];
let base_servers_with_ram = [];
let rooted_servers = [];
let rooted_servers_with_ram = [];
let purchased_servers = [];
let available_servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	base_servers = await ServerUtil.getBaseServers(ns);
	base_servers_with_ram = await ServerUtil.getBaseServersWithRam(ns);
	purchased_servers = await ServerUtil.getBoughtServers(ns);

	await getRootedServers(ns);
	await checkRootedServers();
	await consolidateServers();

	var servers = "";	
	for (let i = 0; i < available_servers.length; i++)
	{
		let server = available_servers[i];
		servers += server;

		if (i < available_servers.length - 1)
		{
			servers += ";";
		}
	}
	ns.print(servers);
}

async function getRootedServers(ns)
{
	if (rooted_servers.length < base_servers.length)
	{
		for (let i = 0; i < base_servers.length; i++)
		{
			let server = base_servers[i];
			if (!rooted_servers.includes(server))
			{
				if (ns.hasRootAccess(server))
				{
					rooted_servers.push(server);
				}
			}
		}
	}
}

async function checkRootedServers()
{
	if (base_servers_with_ram.length > rooted_servers_with_ram.length)
	{
		for (let i = 0; i < rooted_servers.length; i++)
		{
			let server = rooted_servers[i];

			if (base_servers_with_ram.includes(server) &&
				!rooted_servers_with_ram.includes(server))
			{
				rooted_servers_with_ram.push(server);
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