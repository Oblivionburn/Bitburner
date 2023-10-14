import {colors,DTStamp} from "./Hax/UI.js";
import * as DB from "./Hax/Databasing.js";

let available_servers = [];
let targets = [];
let batches_running = [];
let grow_running = [];
let weaken_running = [];
let growThreshFactor = 0.1;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	//ns.tail(ns.getScriptName(), "home");

	batches_running = [];
	grow_running = [];
	weaken_running = [];

	while (true)
	{
		ns.resizeTail(260, 140);
		available_servers = await DB.Select(ns, "available_servers");
		targets = await DB.Select(ns, "targets");

		await Batching(ns, targets);

		await DB.Insert(ns, {Name: "batches_running", List: batches_running});
		await DB.Insert(ns, {Name: "grow_running", List: grow_running});
		await DB.Insert(ns, {Name: "weaken_running", List: weaken_running});

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
			for (let t = 0; t < targets.length; t++)
			{
				let target = targets[t];

				let sent = false;

				for (let scale = 1.0; scale > 0; scale -= 0.005)
				{
					let money = ns.getServerMoneyAvailable(target);
					let maxMoney = ns.getServerMaxMoney(target);
					let security = ns.getServerSecurityLevel(target);
					let minSecurity = ns.getServerMinSecurityLevel(target);
					let growThresh = maxMoney * growThreshFactor;

					let prepped = await IsServerPrepped(security, minSecurity, money, growThresh);
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
							sent = await WeakenTarget(ns, target, security, minSecurity);
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
async function CreateWeakenOrder(ns, delay, target, threads)
{
	let script = "/Hax/Weaken.js";
	let time = ns.getWeakenTime(target);
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
async function WeakenTarget(ns, target, security, minSecurity)
{
	let threadsRequired = await WeakenThreadsRequired(ns, security, minSecurity);

	let weakenHandled = await IsWeakenHandled(ns, target, threadsRequired);
	if (weakenHandled)
	{
		return true;
	}

	for (let t = threadsRequired; t > 0; t--)
	{
		let cost = await GetCost(ns, "/Hax/Weaken.js", t);

		let availableCount = await AvailableCount();
		for (let i = 0; i < availableCount; i++)
		{
			let host = available_servers[i];
			if (ns.serverExists(host))
			{
				let availableRam = await AvailableRam(ns, host);
				if (availableRam >= cost)
				{
					let weaken = await CreateWeakenOrder(ns, 0, target, t);
					weaken.Host = host;
					
					ns.exec(weaken.Script, weaken.Host, weaken.Threads, weaken.Target, weaken.Delay);
					weaken_running.push(weaken);

					t = threadsRequired - t + 1;

					break;
				}
			}
		}

		let weakenHandled = await IsWeakenHandled(ns, target, threadsRequired);
		if (weakenHandled)
		{
			return true;
		}
	}

	return false;
}

/** @param {NS} ns */
async function WeakenThreadsRequired(ns, security, minSecurity)
{
	let securityReduce = security - minSecurity;
	let baseWeakenAmount = ns.weakenAnalyze(1, 1);
	return Math.ceil(securityReduce / baseWeakenAmount);
}

async function AvailableCount()
{
	if (available_servers != null)
	{
		return available_servers.length;
	}

	return 0;
}

async function IsServerPrepped(security, minSecurity, money, growThresh)
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

/** @param {NS} ns */
async function IsWeakenHandled(ns, target, threadsRequired)
{
	let totalThreads = 0;

	let count = weaken_running.length;
	for (let i = 0; i < count; i++)
	{
		let weaken = weaken_running[i];
		if (weaken.Target == target)
		{
			totalThreads += weaken.Threads;

			if (totalThreads >= threadsRequired)
			{
				return true;
			}
		}
	}

	return false;
}

/** @param {NS} ns */
async function GetCost(ns, script, threads)
{
	return ns.getScriptRam(script) * threads;
}

/** @param {NS} ns */
async function AvailableRam(ns, host)
{
	return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}

async function Maintenance()
{
	let now = Date.now();

	for (let i = 0; i < batches_running.length; i++)
	{
		let batch = batches_running[i];
		if (now >= batch.EndTime)
		{
			batches_running.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < grow_running.length; i++)
	{
		let grow = grow_running[i];
		if (now >= grow.EndTime)
		{
			grow_running.splice(i, 1);
			i--;
		}
	}

	for (let i = 0; i < weaken_running.length; i++)
	{
		let weaken = weaken_running[i];
		if (now >= weaken.EndTime)
		{
			weaken_running.splice(i, 1);
			i--;
		}
	}
}

async function StopGrow(target)
{
	for (let i = 0; i < grow_running.length; i++)
	{
		if (grow_running[i].Target == target)
		{
			grow_running.splice(i, 1);
			i--;
		}
	}
}

async function StopWeaken(target)
{
	for (let i = 0; i < weaken_running.length; i++)
	{
		if (weaken_running[i].Target == target)
		{
			weaken_running.splice(i, 1);
			i--;
		}
	}
}

async function Log(ns)
{
	ns.print(`${colors["white"] + "Batches running:" + colors["green"] + batches_running.length}`);
	ns.print(`${colors["white"] + "Grows running:" + colors["green"] + grow_running.length}`);
	ns.print(`${colors["white"] + "Weakens running:" + colors["green"] + weaken_running.length}`);
}