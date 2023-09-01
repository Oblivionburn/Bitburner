import {colors,DTStamp} from "./Hax/UI.js";
import * as DB from "./Hax/Databasing.js";

let available_servers = [];
let targets = [];
let batches_running = [];
let grow_running = [];
let weaken_running = [];
let hack_running = [];
let growThreshFactor = 0.1;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	batches_running = [];
	grow_running = [];
	weaken_running = [];
	hack_running = [];

	while (true)
	{
		ns.resizeTail(880, 320);
		available_servers = await DB.Select(ns, "available_servers");
		targets = await DB.Select(ns, "targets");

		await Batching(ns, targets);
		await Maintenance();

		ns.clearLog();
		await Log(ns);

		await ns.sleep(3);
	}
}

/** @param {NS} ns */
async function Batching(ns, targets)
{
	if (targets != null &&
			targets.length > 0)
	{
		let availableCount = await AvailableCount();
		if (availableCount > 0)
		{
			let count = targets.length;
			for (let t = 0; t < count; t++)
			{
				let target = targets[t];

				let sent = false;

				for (let scale = 1.0; scale > 0.01; scale -= 0.01)
				{
					let money = ns.getServerMoneyAvailable(target);
					let maxMoney = ns.getServerMaxMoney(target);
					let security = ns.getServerSecurityLevel(target);
					let minSecurity = ns.getServerMinSecurityLevel(target);
					let growThresh = maxMoney * growThreshFactor;

					let prepped = await IsServerPrepped(ns, security, minSecurity, money, growThresh);
					if (prepped)
					{
						StopWeaken(target);
						StopGrow(target);

						let Batch = await CreateBatch(ns, target, security, minSecurity, money, maxMoney, scale);
						if (Batch != null)
						{
							sent = await SendBatch(ns, Batch);
						}
					}
					else
					{
						if (security > minSecurity)
						{
							let Weaken = await WeakenOrder(ns, 0, target, security, minSecurity, scale);
							if (Weaken.Threads > 0)
							{
								sent = await SendWeaken(ns, Weaken);
							}
						}
						else if (money < growThresh)
						{
							StopWeaken(target);

							let Grow = await GrowOrder(ns, 0, target, money, maxMoney, scale);
							if (Grow.Threads > 0)
							{
								sent = await SendGrow(ns, Grow);
							}
						}
					}

					if (sent)
					{
						break;
					}
				}
			}
		}
	}
}

/** @param {NS} ns */
async function CreateBatch(ns, target, security, minSecurity, money, maxMoney, scale)
{
	let growThresh = maxMoney * growThreshFactor;

	//Time diff between batches = 400ms
	let Hack = await HackOrder(ns, 0, target, maxMoney, scale);
	let hackSecurityIncrease = security + Hack.SecurityDiff;
	let moneyStolen = growThresh * scale;

	let WeakenOne = await WeakenOrder(ns, 0, target, hackSecurityIncrease, minSecurity, scale);

	let Grow = await GrowOrder(ns, 0, target, money - moneyStolen, maxMoney, scale);
	let growSecurityIncrease = security + Grow.SecurityDiff;

	//ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Grow Security: " + growSecurityIncrease}`);
	let WeakenTwo = await WeakenOrder(ns, 200, target, security + growSecurityIncrease, minSecurity, scale);

	Grow.Delay = (WeakenOne.Time - ns.getGrowTime(target)) + 100;
	Hack.Delay = (WeakenOne.Time - ns.getHackTime(target)) - 100;

	if (WeakenOne.Threads > 0 &&
			WeakenTwo.Threads > 0 &&
			Grow.Threads > 0 &&
			Hack.Threads > 0)
	{
		let orders = [];
		orders.push(WeakenOne);
		orders.push(WeakenTwo);
		orders.push(Grow);
		orders.push(Hack);

		let totalCost = WeakenOne.Cost + WeakenTwo.Cost + Grow.Cost + Hack.Cost;
		let endTime = Date.now() + WeakenOne.Time + 200;

		let batch =
		{
			Host: "",
			Target: target,
			StartTime: Date.now(),
			EndTime: endTime,
			Cost: totalCost,
			Orders: orders
		}

		return batch;
	}
	
	return null;
}

/** @param {NS} ns */
async function GrowOrder(ns, delay, target, money, maxMoney, scale)
{
	let growThresh = maxMoney * growThreshFactor;
	let growMulti = growThresh;
	if (money > 0)
	{
		growMulti = growThresh / money;
	}

	let script = "/Hax/Grow.js";
	let threads = Math.ceil(ns.growthAnalyze(target, 1 + Math.ceil(growMulti), 1) * scale);
	let securityDiff = ns.growthAnalyzeSecurity(threads, target, 1);
	let time = ns.getGrowTime(target);
	let cost = await GetCost(ns, script, threads);

	let order =
	{
		Host: "",
		Target: target,
		Delay: delay,
		StartTime: Date.now(),
		EndTime: Date.now() + time,
		Time: time,
		Cost: cost,
		Script: script,
		Threads: threads,
		SecurityDiff: securityDiff
	}

	return order;
}

/** @param {NS} ns */
async function WeakenOrder(ns, delay, target, security, minSecurity, scale)
{
	let script = "/Hax/Weaken.js";
	let baseWeakenAmount = ns.weakenAnalyze(1, 1);
	let time = ns.getWeakenTime(target);
	let securityReduce = security - minSecurity;
	let threads = Math.ceil((securityReduce / baseWeakenAmount) * scale);
	let cost = await GetCost(ns, script, threads);

	let order =
	{
		Host: "",
		Target: target,
		Delay: delay,
		StartTime: Date.now(),
		EndTime: Date.now() + time,
		Time: time,
		Cost: cost,
		Script: script,
		Threads: threads
	}

	return order;
}

/** @param {NS} ns */
async function HackOrder(ns, delay, target, maxMoney, scale)
{
	let growThresh = maxMoney * growThreshFactor;

	let script = "/Hax/Hack.js";
	let threads = Math.ceil(ns.hackAnalyzeThreads(target, growThresh) * scale);
	let percentStolen = ns.hackAnalyze(target);
	let securityDiff = ns.hackAnalyzeSecurity(threads, target);
	let time = ns.getHackTime(target);
	let cost = await GetCost(ns, script, threads);

	let order =
	{
		Host: "",
		Target: target,
		Delay: delay,
		StartTime: Date.now(),
		EndTime: Date.now() + time,
		Time: time,
		Cost: cost,
		Script: script,
		Threads: threads,
		SecurityDiff: securityDiff,
		PercentStolen: percentStolen
	}

	return order;
}

/** @param {NS} ns */
async function SendBatch(ns, batch)
{
	let availableCount = await AvailableCount();
	for (let i = 0; i < availableCount; i++)
	{
		let host = available_servers[i];
		if (ns.serverExists(host))
		{
			//Factor in cost of running the RunBatch.js itself
			let runBatchScriptCost = await GetCost(ns, "/Hax/RunBatch.js", 1);
			let totalCost = batch.Cost + runBatchScriptCost;

			let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
			if (availableRam >= totalCost)
			{
				batch.Host = host;

				let isBatchRunning = await IsBatchRunning(batch);
				if (!isBatchRunning)
				{
					let str = JSON.stringify(batch);
					let pid = ns.exec("/Hax/RunBatch.js", host, 1, str);
					if (pid > 0)
					{
						batches_running.push(batch);
						return true;
					}
				}
			}
		}
	}

	return false;
}

/** @param {NS} ns */
async function SendGrow(ns, grow)
{
	let availableCount = await AvailableCount();
	for (let i = 0; i < availableCount; i++)
	{
		let host = available_servers[i];
		if (ns.serverExists(host))
		{
			let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
			if (availableRam >= grow.Cost)
			{
				grow.Host = host;

				let isGrowRunning = await IsGrowRunning(grow);
				if (!isGrowRunning)
				{
					ns.exec(grow.Script, host, grow.Threads, grow.Target, grow.Delay);
					grow_running.push(grow);
					return true;
				}
			}
		}
	}

	return false;
}

/** @param {NS} ns */
async function SendWeaken(ns, weaken)
{
	let availableCount = await AvailableCount();
	for (let i = 0; i < availableCount; i++)
	{
		let host = available_servers[i];
		if (ns.serverExists(host))
		{
			let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
			if (availableRam >= weaken.Cost)
			{
				weaken.Host = host;

				let isWeakenRunning = await IsWeakenRunning(weaken);
				if (!isWeakenRunning)
				{
					ns.exec(weaken.Script, host, weaken.Threads, weaken.Target, weaken.Delay);
					weaken_running.push(weaken);
					return true;
				}
			}
		}
	}

	return false;
}

/** @param {NS} ns */
async function SendHack(ns, hack)
{
	let availableCount = await AvailableCount();
	for (let i = 0; i < availableCount; i++)
	{
		let host = available_servers[i];
		if (ns.serverExists(host))
		{
			let availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
			if (availableRam >= hack.Cost)
			{
				hack.Host = host;

				let isHackRunning = await IsHackRunning(hack);
				if (!isHackRunning)
				{
					ns.exec(hack.Script, host, hack.Threads, hack.Target, hack.Delay);
					hack_running.push(hack);
					return true;
				}
			}
		}
	}

	return false;
}

async function AvailableCount()
{
	if (available_servers != null)
	{
		return available_servers.length;
	}

	return 0;
}

async function IsServerPrepped(ns, security, minSecurity, money, growThresh)
{
	if (security <= minSecurity &&
			money >= growThresh)
	{
		return true;
	}

	return false;
}

async function IsBatchRunning(newBatch)
{
	let count = batches_running.length;
	for (let i = 0; i < count; i++)
	{
		let batch = batches_running[i];
		if (batch.Target == newBatch.Target &&
				batch.Host == newBatch.Host &&
				Date.now() < batch.EndTime)
		{
			return true;
		}
	}

	return false;
}

async function IsGrowRunning(newGrow)
{
	let count = grow_running.length;
	for (let i = 0; i < count; i++)
	{
		let grow = grow_running[i];
		if (grow.Target == newGrow.Target &&
				grow.Host == newGrow.Host &&
				Date.now() < grow.EndTime)
		{
			return true;
		}
	}

	return false;
}

async function IsWeakenRunning(newWeaken)
{
	let count = weaken_running.length;
	for (let i = 0; i < count; i++)
	{
		let weaken = weaken_running[i];
		if (weaken.Target == newWeaken.Target &&
				weaken.Host == newWeaken.Host &&
				Date.now() < weaken.EndTime)
		{
			return true;
		}
	}

	return false;
}

async function IsHackRunning(newHack)
{
	let count = hack_running.length;
	for (let i = 0; i < count; i++)
	{
		let hack = hack_running[i];
		if (hack.Target == newHack.Target &&
				hack.Host == newHack.Host &&
				Date.now() < hack.EndTime)
		{
			return true;
		}
	}

	return false;
}

/** @param {NS} ns */
async function GetCost(ns, script, threads)
{
	return ns.getScriptRam(script) * threads;
}

async function Maintenance()
{
	let now = Date.now();

	let count = batches_running.length;
	for (let i = 0; i < count; i++)
	{
		let order = batches_running[i];
		if (now >= order.EndTime)
		{
			batches_running.splice(i, 1);
			count--;
			i--;
		}
	}

	count = grow_running.length;
	for (let i = 0; i < count; i++)
	{
		let order = grow_running[i];
		if (now >= order.EndTime)
		{
			grow_running.splice(i, 1);
			count--;
			i--;
		}
	}

	count = weaken_running.length;
	for (let i = 0; i < count; i++)
	{
		let order = weaken_running[i];
		if (now >= order.EndTime)
		{
			weaken_running.splice(i, 1);
			count--;
			i--;
		}
	}

	count = hack_running.length;
	for (let i = 0; i < count; i++)
	{
		let order = hack_running[i];
		if (now >= order.EndTime)
		{
			hack_running.splice(i, 1);
			count--;
			i--;
		}
	}
}

async function StopWeaken(target)
{
	let count = weaken_running.length;
	for (let i = 0; i < count; i++)
	{
		weaken_running.splice(i, 1);
		count--;
		i--;
	}
}

async function StopGrow(target)
{
	let count = grow_running.length;
	for (let i = 0; i < count; i++)
	{
		grow_running.splice(i, 1);
		count--;
		i--;
	}
}

async function Log(ns)
{
	/*
	if (weaken_running.length > 0)
	{
		ns.print(`${colors["yellow"] + "Weakens running:"}`);

		let count = weaken_running.length;
		for (let i = 0; i < count; i++)
		{
			let order = weaken_running[i];

			let endTime = new Date(order.EndTime);
			let seconds = (endTime - Date.now()) / 1000;
			if (Date.now() >= endTime)
			{
				seconds = 0;
			}

			if (seconds == 0)
			{
				ns.print(`${colors["red"] + i + ") " + 
					"Host: " + order.Host + ", " + 
					"Target: " + order.Target + ", " + 
					"Cost: " + order.Cost + " GB, " + 
					"End Time: " + seconds}`);
			}
			else
			{
				ns.print(`${colors["yellow"] + i + ") " + 
					colors["white"] + "Host: " + colors["green"] + order.Host + ", " + 
					colors["white"] + "Target: " + colors["green"] + order.Target + ", " + 
					colors["white"] + "Cost: " + colors["green"] + order.Cost + " GB, " + 
					colors["white"] + "End Time: " + colors["green"] + seconds}`);
			}
		}

		ns.print("\n");
	}
	*/
	if (batches_running.length > 0)
	{
		ns.print(`${colors["yellow"] + "Batches running:"}`);

		let count = batches_running.length;
		for (let i = 0; i < count; i++)
		{
			let order = batches_running[i];

			let endTime = new Date(order.EndTime);
			let seconds = (endTime - Date.now()) / 1000;
			if (Date.now() >= endTime)
			{
				seconds = 0;
			}

			if (seconds == 0)
			{
				ns.print(`${colors["red"] + i + ") " + 
					"Host: " + order.Host + ", " + 
					"Target: " + order.Target + ", " + 
					"Cost: " + order.Cost + " GB, " + 
					"End Time: " + seconds}`);
			}
			else
			{
				ns.print(`${colors["yellow"] + i + ") " + 
					colors["white"] + "Host: " + colors["green"] + order.Host + ", " + 
					colors["white"] + "Target: " + colors["green"] + order.Target + ", " + 
					colors["white"] + "Cost: " + colors["green"] + order.Cost + " GB, " + 
					colors["white"] + "End Time: " + colors["green"] + seconds}`);
			}
		}
	}
}