import {colors} from "./Hax/UI.js";
import * as DB from "./Hax/Databasing.js";
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

	base_servers = [];
	base_with_money = [];
	base_with_ram = [];
	
	await DeepScan(ns, "home");
	await DB.Insert(ns, {Name: "base_servers", List: base_servers});
	await DB.Insert(ns, {Name: "base_with_money", List: base_with_money});
	await DB.Insert(ns, {Name: "base_with_ram", List: base_with_ram});

	while (true)
	{
		ns.resizeTail(320, 320);
		
		await Scan_PurchasedServers(ns);
		await DB.Insert(ns, {Name: "purchased_servers", List: purchased_servers});

		await RootServers(ns);
		await Scan_RootedServers(ns);
		await DB.Insert(ns, {Name: "rooted_servers", List: rooted_servers});
		await DB.Insert(ns, {Name: "rooted_with_money", List: rooted_with_money});
		await DB.Insert(ns, {Name: "rooted_with_ram", List: rooted_with_ram});

		await Scan_AvailableServers(ns);
		await DB.Insert(ns, {Name: "available_servers", List: available_servers});

		await Log(ns);
		
		await ns.sleep(1000);
	}
}

async function Log(ns)
{
	ns.clearLog();
	ns.print(`${colors["white"] + "Base servers: " + colors["green"] + base_servers.length}`);
	ns.print(`${colors["white"] + "Purchased servers: " + colors["green"] + purchased_servers.length}`);
	ns.print("\n");
	ns.print(`${colors["white"] + "Base servers with money: " + colors["green"] + base_with_money.length}`);
	ns.print(`${colors["white"] + "Rooted/Hackable with money: " + colors["green"] + rooted_with_money.length}`);
	ns.print("\n");
	ns.print(`${colors["white"] + "Base servers with ram: " + colors["green"] + base_with_ram.length}`);
	ns.print(`${colors["white"] + "Rooted with ram: " + colors["green"] + rooted_with_ram.length}`);
	ns.print("\n");
	ns.print(`${colors["white"] + "Total servers with ram: " + colors["green"] + available_servers.length}`);
	ns.print("\n");
}

async function RootServers(ns)
{
	rooted_servers = [];

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
	rooted_with_money = [];
	rooted_with_ram = [];

	let count = rooted_servers.length;
	if (count > 0)
	{
		for (let i = 0; i < count; i++)
		{
			let server = rooted_servers[i];

			if (base_with_money.includes(server) &&
				!rooted_with_money.includes(server) &&
				ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(server))
			{
				rooted_with_money.push(server);
			}

			if (base_with_ram.includes(server) &&
				!rooted_with_ram.includes(server))
			{
				rooted_with_ram.push(server);
			}
		}

		rooted_with_money.sort((a,b) => ns.getServerMaxMoney(a) - ns.getServerMaxMoney(b));
		rooted_with_ram.sort((a,b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
	}
}

async function Scan_PurchasedServers(ns)
{
	purchased_servers = [];

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
	available_servers = [];

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
			if (ns.serverExists(server))
			{
				if (!available_servers.includes(server))
				{
					available_servers.push(server);
				}
			}
		}

		available_servers.sort((a,b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
	}
}