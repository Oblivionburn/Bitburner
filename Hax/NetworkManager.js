import {Data} from "./Hax/Data.js";
import {colors} from "./Hax/Paint.js";
import * as Database from "./Hax/DatabaseManager.js";
import * as Root from "./Hax/Root.js";

let base_servers = [];
let base_with_money = [];
let base_with_ram = [];
let rooted_servers = [];
let rooted_with_money = [];
let rooted_with_ram = [];
let purchased_servers = [];
let available_servers = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
    ns.tail(ns.getScriptName(), "home");

	await DeepScan(ns, "home");
	await Database.Insert(ns, new Data("base_servers", base_servers));
	await Database.Insert(ns, new Data("base_with_money", base_with_money));
	await Database.Insert(ns, new Data("base_with_ram", base_with_ram));

    while (true)
    {
		await Scan_PurchasedServers(ns);
		await Database.Insert(ns, new Data("purchased_servers", purchased_servers));

		await RootServers(ns);
		await Scan_RootedServers(ns);
		await Database.Insert(ns, new Data("rooted_servers", rooted_servers));
		await Database.Insert(ns, new Data("rooted_with_money", rooted_with_money));
		await Database.Insert(ns, new Data("rooted_with_ram", rooted_with_ram));

		await Scan_AvailableServers(ns);
		await Database.Insert(ns, new Data("available_servers", available_servers));

		ns.clearLog();
		await Log(ns);
		
		await ns.sleep(1000);
    }
}

async function Log(ns)
{
	ns.print(`${colors["white"] + "Base Servers: " + colors["green"] + base_servers.length}`);
	ns.print(`${colors["white"] + "Purchased Servers: " + colors["green"] + purchased_servers.length}`);
	ns.print("\n");
	ns.print(`${colors["white"] + "Base Servers with money: " + colors["green"] + base_with_money.length}`);
	ns.print(`${colors["white"] + "Rooted Base Servers with money: " + colors["green"] + rooted_with_money.length}`);
	ns.print("\n");
	ns.print(`${colors["white"] + "Base Servers with ram: " + colors["green"] + base_with_ram.length}`);
	ns.print(`${colors["white"] + "Rooted Base Servers with ram: " + colors["green"] + rooted_with_ram.length}`);
	ns.print("\n");
	ns.print(`${colors["white"] + "Total Servers with ram: " + colors["green"] + available_servers.length}`);
	ns.print("\n");
}

async function RootServers(ns)
{
	if (rooted_servers.length < base_servers.length)
	{
		for (let i = 0; i < base_servers.length; i++)
		{
			let server = base_servers[i];
			if (!rooted_servers.includes(server))
			{
				let rooted = await Root.Access(ns, server);
				if (rooted)
				{
					rooted_servers.push(server);
				}
			}
		}
	}
}

async function DeepScan(ns, server)
{
	let scan_results = ns.scan(server);
	if (scan_results.length > 0)
	{
		for (let i = 0; i < scan_results.length; i++)
		{
			let server = scan_results[i];

			if (server != "home" &&
				!server.includes("PS-") &&
				!base_servers.includes(server))
			{
				let maxMoney = ns.getServerMaxMoney(server);
				if (maxMoney > 0 &&
					!base_with_money.includes(server))
				{
					base_with_money.push(server);
				}

				let maxRam = ns.getServerMaxRam(server);
				if (maxRam > 0 &&
					!base_with_ram.includes(server))
				{
					base_with_ram.push(server);
				}

				base_servers.push(server);
				await DeepScan(ns, server);
			}
		}
	}
}

async function Scan_RootedServers(ns)
{
	let count = rooted_servers.length;
	if (count > 0)
	{
		for (let i = 0; i < count; i++)
		{
			let server = rooted_servers[i];

			if (base_with_money.includes(server) &&
				!rooted_with_money.includes(server))
			{
				rooted_with_money.push(server);
			}

			if (base_with_ram.includes(server) &&
				!rooted_with_ram.includes(server))
			{
				rooted_with_ram.push(server);
			}
		}
	}
}

async function Scan_PurchasedServers(ns)
{
	let scan_results = ns.scan("home");
	let scanCount = scan_results.length;
	if (scanCount > 0)
	{
		for (let i = 0; i < scanCount; i++)
		{
			let server = scan_results[i];

			if (server.includes("PS-") &&
				!purchased_servers.includes(server))
			{
				purchased_servers.push(server);
			}
		}
	}
}

async function Scan_AvailableServers(ns)
{
	var total = rooted_with_ram.length + purchased_servers.length;
	if (available_servers.length < total)
	{
		for (let i = 0; i < rooted_with_ram.length; i++)
		{
			let server = rooted_with_ram[i];
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