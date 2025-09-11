import * as HDD from "/OS/HDD.js";
import * as Util from "/OS/Apps/Util.js";
import * as Batching from "/OS/Apps/Batching.js";
import * as Weakening from "/OS/Apps/Weakening.js";
import * as Growing from "/OS/Apps/Growing.js";

let servers = [];
let available_servers = [];
let targets = [];
let delayScale = 10;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.clearLog();

	servers = [];

	available_servers = [];
	HDD.Write(ns, "available_servers", available_servers);

	targets = [];
	HDD.Write(ns, "targets", targets);

	while (true)
	{
		//ns.resizeTail(440, 280);
		servers = HDD.Read(ns, "servers");

		Get_AvailableServers(ns);
		GetTargets(ns);
		await Processing(ns);
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
		let serverCount = servers.length;
		for (let i = 0; i < serverCount; i++)
		{
			let server = servers[i];

			if (server.Name != "home" &&
					server.Rooted &&
					server.HasRam)
			{
				available_servers.push(server);
			}
		}
	}

	available_servers.sort((a, b) => b.MaxRam - a.MaxRam);
	HDD.Write(ns, "available_servers", available_servers);
}

/** @param {NS} ns */
function GetTargets(ns)
{
	targets = [];

	let hackLevel = ns.getHackingLevel();

	if (servers != null)
	{
		let serverCount = servers.length;
		for (let i = 0; i < serverCount; i++)
		{
			let server = servers[i];

			if (server.Name != "home" &&
					server.HackLevel <= hackLevel &&
					server.Rooted &&
					server.HasMoney)
			{
				targets.push(server);
			}
		}
	}

	targets.sort((a, b) => a.MaxMoney - b.MaxMoney || a.HackLevel - b.HackLevel);
	HDD.Write(ns, "targets", targets);
}

/** @param {NS} ns */
async function Processing(ns)
{
	if (available_servers != null &&
			available_servers.length > 0 &&
			targets != null &&
			targets.length > 0)
	{
		let now = Date.now();
		let batches_running = HDD.Read(ns, "batches_running");
		let weaken_running = HDD.Read(ns, "weaken_running");
		let grow_running = HDD.Read(ns, "grow_running");

		for (let s = 0; s < available_servers.length; s++)
		{
			let server = available_servers[s].Name;
			if (server != null &&
					ns.serverExists(server))
			{
				let availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
				let maxRam = availableRam / targets.length;

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

						let lastBatch = Batching.GetLastBatch(target, batches_running);
						let batchTime = (lastBatch != null && now >= lastBatch.StartTime + (4 * delayScale)) || lastBatch == null;

						let prepped = Util.IsServerPrepped(security, minSecurity, money, maxMoney);
						if (prepped &&
								batchTime)
						{
							await Batching.SendBatch(ns, server, target, maxRam, security, minSecurity, maxMoney, delayScale, batches_running);
						}
						else if (security > minSecurity)
						{
							await Weakening.WeakenTarget(ns, server, target, security, minSecurity, weaken_running);
						}
						else if (money < maxMoney)
						{
							await Growing.GrowTarget(ns, server, target, money, maxMoney, grow_running);
						}
					}
				}
			}
		}
	}
}

function Maintenance(ns)
{
	let now = Date.now();

	let batch_update = false;
	let batches_running = HDD.Read(ns, "batches_running");
	for (let i = 0; i < batches_running.length; i++)
	{
		let batch = batches_running[i];
		if (now >= batch.EndTime)
		{
			batch_update = true;
			batches_running.splice(i, 1);
			i--;
		}
	}

	if (batch_update)
	{
		HDD.Write(ns, "batches_running", batches_running);
	}

	let grow_update = false;
	let grow_running = HDD.Read(ns, "grow_running");
	for (let i = 0; i < grow_running.length; i++)
	{
		let grow = grow_running[i];

		let money = ns.getServerMoneyAvailable(grow.Target);
		let maxMoney = ns.getServerMaxMoney(grow.Target);

		if (now >= grow.EndTime ||
				money >= maxMoney)
		{
			if (money >= maxMoney)
			{
				ns.kill(grow.Pid);
			}

			grow_update = true;
			grow_running.splice(i, 1);
			i--;
		}
	}

	if (grow_update)
	{
		HDD.Write(ns, "grow_running", grow_running);
	}
	
	let weaken_update = false;
	let weaken_running = HDD.Read(ns, "weaken_running");
	for (let i = 0; i < weaken_running.length; i++)
	{
		let weaken = weaken_running[i];

		let security = ns.getServerSecurityLevel(weaken.Target);
		let minSecurity = ns.getServerMinSecurityLevel(weaken.Target);

		if (now >= weaken.EndTime ||
				security <= minSecurity)
		{
			if (security <= minSecurity)
			{
				ns.kill(weaken.Pid);
			}
			
			weaken_update = true;
			weaken_running.splice(i, 1);
			i--;
		}
	}

	if (weaken_update)
	{
		HDD.Write(ns, "weaken_running", weaken_running);
	}
}