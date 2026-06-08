import * as IO from "/Hax/IO.js";
import * as Hacker from "/Hax/Hacker.js";
import * as Weakener from "/Hax/Weakener.js";
import * as Grower from "/Hax/Grower.js";
import * as Batcher from "/Hax/Batcher.js";

let servers = [];
let available_servers = [];
let targets = [];

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.clearLog();

	servers = [];

	available_servers = [];
	IO.Write(ns, "available_servers", available_servers);

	targets = [];
	IO.Write(ns, "targets", targets);

	while (true)
	{
		servers = IO.Read(ns, "servers");

		Get_AvailableServers(ns);
		Get_Targets(ns);
		await Process(ns);
		Maintenance(ns);

		await ns.sleep(1);
	}
}

/** @param {NS} ns */
function Get_AvailableServers(ns)
{
	available_servers = [];

	if (servers != null)
	{
		const serverCount = servers.length;
		for (let i = 0; i < serverCount; i++)
		{
			const server = servers[i];

			if (server.Name != "home" &&
					server.Rooted &&
					server.HasRam)
			{
				available_servers.push(server);
			}
		}
	}

	available_servers.sort((a, b) => b.MaxRam - a.MaxRam);
	IO.Write(ns, "available_servers", available_servers);
}

/** @param {NS} ns */
function Get_Targets(ns)
{
	targets = [];

	const hackLevel = ns.getHackingLevel();

	if (servers != null)
	{
		const serverCount = servers.length;
		for (let i = 0; i < serverCount; i++)
		{
			const server = servers[i];

			if (server.Name != "home" &&
					server.HackLevel <= Math.ceil(hackLevel / 10) &&
					server.Rooted &&
					server.HasMoney)
			{
				targets.push(server);
			}
		}
	}

	targets.sort((a, b) => a.MaxMoney - b.MaxMoney || a.HackLevel - b.HackLevel);
	IO.Write(ns, "targets", targets);
}

/** @param {NS} ns */
async function Process(ns)
{
	if (available_servers != null &&
			available_servers.length > 0 &&
			targets != null &&
			targets.length > 0)
	{
		let availableServers = available_servers.length;
		for (let s = 0; s < availableServers; s++)
		{
			let server = available_servers[s].Name;
			if (server != null &&
					ns.serverExists(server))
			{
				for (let t = 0; t < targets.length; t++)
				{
					let target = targets[t].Name;
					if (target != null &&
							ns.serverExists(target))
					{
						let money = ns.getServerMoneyAvailable(target);
						let maxMoney = ns.getServerMaxMoney(target);
						let security = ns.getServerSecurityLevel(target);
						let minSecurity = ns.getServerMinSecurityLevel(target);

						let prepped = IsPrepped(security, minSecurity, money, maxMoney);
						if (prepped)
						{
							let batching = await Batcher.SendBatch(ns, server, target, security, minSecurity, maxMoney);
							if (!batching)
							{
								await Hacker.HackTarget(ns, server, target, maxMoney);
							}
						}
						else if (security > minSecurity)
						{
							await Weakener.WeakenTarget(ns, server, target, security, minSecurity);
						}
						else if (money < maxMoney)
						{
							await Grower.GrowTarget(ns, server, target, money, maxMoney);
						}
					}
				}
			}
		}
	}
}

export function IsPrepped(security, minSecurity, money, maxMoney)
{
	if (security <= minSecurity &&
			money >= maxMoney)
	{
		return true;
	}

	return false;
}

function Maintenance(ns)
{
	let now = Date.now();

	let hack_update = false;
	let hack_running = IO.Read(ns, "hack_running");
	for (let i = 0; i < hack_running.length; i++)
	{
		let order = hack_running[i];

		if (now >= order.EndTime)
		{
			hack_update = true;
			hack_running.splice(i, 1);
			i--;
		}
	}

	if (hack_update)
	{
		IO.Write(ns, "hack_running", hack_running);
	}

	let grow_update = false;
	let grow_running = IO.Read(ns, "grow_running");
	for (let i = 0; i < grow_running.length; i++)
	{
		let order = grow_running[i];

		let money = ns.getServerMoneyAvailable(order.Target);
		let maxMoney = ns.getServerMaxMoney(order.Target);

		if (now >= order.EndTime ||
				money >= maxMoney)
		{
			if (money >= maxMoney)
			{
				ns.kill(order.Pid);
			}
			
			grow_update = true;
			grow_running.splice(i, 1);
			i--;
		}
	}

	if (grow_update)
	{
		IO.Write(ns, "grow_running", grow_running);
	}
	
	let weaken_update = false;
	let weaken_running = IO.Read(ns, "weaken_running");
	for (let i = 0; i < weaken_running.length; i++)
	{
		let order = weaken_running[i];

		let security = ns.getServerSecurityLevel(order.Target);
		let minSecurity = ns.getServerMinSecurityLevel(order.Target);

		if (now >= order.EndTime ||
				security <= minSecurity)
		{
			if (security <= minSecurity)
			{
				ns.kill(order.Pid);
			}
			
			weaken_update = true;
			weaken_running.splice(i, 1);
			i--;
		}
	}

	if (weaken_update)
	{
		IO.Write(ns, "weaken_running", weaken_running);
	}
}