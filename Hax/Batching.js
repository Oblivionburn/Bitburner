import * as UI from "./Hax/UI.js";
import * as IO from "./Hax/IO.js";

let available_servers = [];
let targets = [];
let batches_running = [];
let grow_running = [];
let weaken_running = [];
let threshFactor = 0.1;
let body = "";
let delayScale = 10;

/** @param {NS} ns */
export async function main(ns)
{
	ns.disableLog("ALL");
	ns.tail(ns.getScriptName(), "home");

	let container = UI.injectContainer(ns, eval('document'));

	batches_running = [];
	grow_running = [];
	weaken_running = [];

	while (true)
	{
		let available_servers_object = await IO.Read(ns, "available_servers");
		if (available_servers_object != null)
		{
			available_servers = available_servers_object.List;
		}

		let targets_object = await IO.Read(ns, "targets");
		if (targets_object != null)
		{
			targets = targets_object.List;
		}

		body = "<tbody>";

		Batching(ns, targets);
		UpdateContainer(container);
		Maintenance(ns);

		await ns.sleep(1);
	}
}

/** @param {NS} ns */
function Batching(ns, targets)
{
	if (targets != null &&
			targets.length > 0)
	{
		let now = Date.now();

		let targetCount = targets.length;
		for (let t = 0; t < targetCount; t++)
		{
			let target = targets[t];

			let requiredHack = ns.getServerRequiredHackingLevel(target);
			let money = ns.getServerMoneyAvailable(target);
			let maxMoney = ns.getServerMaxMoney(target);
			let security = ns.getServerSecurityLevel(target);
			let minSecurity = ns.getServerMinSecurityLevel(target);

			let batchCount = GetBatchCount(target);
			GenBody(t, target, security, minSecurity, money, maxMoney, batchCount, requiredHack);

			let lastBatch = GetLastBatch(target);
			let batchTime = (lastBatch != null && now >= lastBatch.StartTime + (4 * delayScale)) || lastBatch == null;

			let prepped = IsServerPrepped(security, minSecurity, money, maxMoney);
			if (prepped &&
					batchTime)
			{
				StopWeaken(ns, target);
				StopGrow(ns, target);

				for (let scale = 1.0; scale > 0; scale -= 0.2)
				{
					let Batch = CreateBatch(ns, now, target, security, minSecurity, maxMoney, scale);
					if (Batch != null)
					{
						let sent = SendBatch(ns, Batch, scale);
						if (sent)
						{
							break;
						}
					}
				}
			}
			else
			{
				if (security > minSecurity)
				{
					WeakenTarget(ns, target, security, minSecurity);
				}
				else if (money < maxMoney &&
								 batchCount == 0)
				{
					StopWeaken(ns, target);
					GrowTarget(ns, target, money, maxMoney);
				}
			}
		}
	}
}

/*
	Handle batching
*/

/** @param {NS} ns */
function CreateBatch(ns, now, target, security, minSecurity, maxMoney, scale)
{
	let Hack = BatchHackOrder(ns, now, target, maxMoney, scale);
	let weakenOneSecurity = security + Hack.SecurityDiff;

	let WeakenOne = BatchWeakenOrder(ns, 0, now, target, weakenOneSecurity, minSecurity, scale);

	let Grow = BatchGrowOrder(ns, now, target, maxMoney - Hack.MoneyStolen, maxMoney, scale);

	let weakenTwoSecurity = security + Hack.SecurityDiff - WeakenOne.SecurityDiff;
	if (weakenTwoSecurity < minSecurity)
	{
		weakenTwoSecurity = minSecurity;
	}
	weakenTwoSecurity += Grow.SecurityDiff;

	let WeakenTwo = BatchWeakenOrder(ns, (2 * delayScale), now, target, weakenTwoSecurity, minSecurity, scale);

	WeakenOne.EndTime = now + WeakenOne.Time;

	Hack.Delay = (WeakenOne.EndTime - Hack.Time - (1 * delayScale)) - now;
	Hack.EndTime = now + Hack.Delay + Hack.Time;

	Grow.Delay = (WeakenOne.EndTime - Grow.Time + (1 * delayScale)) - now;
	Grow.EndTime = now + Grow.Delay + Grow.Time;

	WeakenTwo.Delay = (WeakenOne.EndTime - WeakenTwo.Time + (2 * delayScale)) - now;
	WeakenTwo.EndTime = now + WeakenTwo.Delay + WeakenTwo.Time;

	if (Hack.Threads > 0 && 
			WeakenOne.Threads > 0 &&
			Grow.Threads > 0 &&
			WeakenTwo.Threads > 0)
	{
		let orders = [];
		orders.push(WeakenOne);
		orders.push(WeakenTwo);
		orders.push(Grow);
		orders.push(Hack);

		let totalCost = WeakenOne.Cost + WeakenTwo.Cost + Grow.Cost + Hack.Cost;
		let endTime = now + WeakenOne.Time + (2 * delayScale);

		let batch =
		{
			Host: "",
			Target: target,
			StartTime: now,
			EndTime: endTime,
			Cost: totalCost,
			Orders: orders
		}

		return batch;
	}
	
	return null;
}

/** @param {NS} ns */
function BatchHackOrder(ns, now, target, maxMoney, scale)
{
	let script = "/Hax/Hack.js";
	let threads = Math.ceil(ns.hackAnalyzeThreads(target, maxMoney * threshFactor) * scale);
	let moneyStolen = ns.hackAnalyze(target) * threads;
	let securityDiff = ns.hackAnalyzeSecurity(threads, target);
	let time = ns.getHackTime(target);
	let cost = GetCost(ns, script, threads);

	let order =
	{
		Host: "",
		Target: target,
		Delay: 0,
		StartTime: now,
		EndTime: 0,
		Time: time,
		Cost: cost,
		Script: script,
		Threads: threads,
		SecurityDiff: securityDiff,
		MoneyStolen: moneyStolen
	}

	return order;
}

/** @param {NS} ns */
function BatchWeakenOrder(ns, delay, now, target, security, minSecurity, scale)
{
	let script = "/Hax/Weaken.js";
	let baseWeakenAmount = ns.weakenAnalyze(1, 1);
	let time = ns.getWeakenTime(target);
	let securityReduce = security - minSecurity;
	let threads = Math.ceil((securityReduce / baseWeakenAmount) * scale);
	let cost = GetCost(ns, script, threads);
	let securityDiff = ns.weakenAnalyze(threads, 1);
	
	let order =
	{
		Host: "",
		Target: target,
		Delay: delay,
		StartTime: now,
		EndTime: 0,
		Time: time,
		Cost: cost,
		Script: script,
		Threads: threads,
		SecurityDiff: securityDiff
	}

	return order;
}

/** @param {NS} ns */
function BatchGrowOrder(ns, now, target, money, maxMoney, scale)
{
	let growMulti = maxMoney;
	if (money > 0)
	{
		growMulti = maxMoney / money;
	}

	let script = "/Hax/Grow.js";
	let threads = Math.ceil(ns.growthAnalyze(target, growMulti, 1) * scale);
	let securityDiff = ns.growthAnalyzeSecurity(threads);
	let time = ns.getGrowTime(target);
	let cost = GetCost(ns, script, threads);

	let order =
	{
		Host: "",
		Target: target,
		Delay: 0,
		StartTime: now,
		EndTime: 0,
		Time: time,
		Cost: cost,
		Script: script,
		Threads: threads,
		SecurityDiff: securityDiff
	}

	return order;
}

/** @param {NS} ns */
function SendBatch(ns, batch, scale)
{
	let availableCount = AvailableCount();
	for (let i = 0; i < availableCount; i++)
	{
		let host = available_servers[i];
		if (ns.serverExists(host))
		{
			batch.Host = host;

			let isBatchRunning = IsBatchRunning(batch);
			if (!isBatchRunning)
			{
				//Factor in cost of running the RunBatch.js itself
				let runBatchScriptCost = GetCost(ns, "/Hax/RunBatch.js", 1);
				let totalCost = batch.Cost + runBatchScriptCost;

				let availableRam = AvailableRam(ns, host);
				if (availableRam >= totalCost)
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

function IsBatchRunning(newBatch)
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

function GetBatchCount(target)
{
	let total = 0;

	let count = batches_running.length;
	for (let i = 0; i < count; i++)
	{
		let batch = batches_running[i];
		if (batch.Target == target)
		{
			total++;
		}
	}

	return total;
}

function GetLastBatch(target)
{
	let count = batches_running.length;
	for (let i = count - 1; i >= 0; i--)
	{
		let batch = batches_running[i];
		if (batch.Target == target)
		{
			return batch;
		}
	}

	return null;
}

/*
	Handle weakening
*/

/** @param {NS} ns */
function WeakenTarget(ns, target, security, minSecurity)
{
	let threadsRequired = WeakenThreadsRequired(ns, security, minSecurity);

	let weakenHandled = IsWeakenHandled(target, threadsRequired);
	if (weakenHandled)
	{
		return true;
	}

	for (let t = threadsRequired; t > 0; t--)
	{
		let cost = GetCost(ns, "/Hax/Weaken.js", t);

		let availableCount = AvailableCount();
		for (let i = 0; i < availableCount; i++)
		{
			let host = available_servers[i];
			if (ns.serverExists(host))
			{
				let availableRam = AvailableRam(ns, host);
				if (availableRam >= cost)
				{
					let weaken = WeakenOrder(ns, 0, target, t);
					weaken.Host = host;

					let weakenRunning = IsWeakenRunning(weaken);
					if (!weakenRunning)
					{
						let pid = ns.exec(weaken.Script, weaken.Host, weaken.Threads, weaken.Target, weaken.Delay);
						if (pid > 0)
						{
							weaken.Pid = pid;
							weaken_running.push(weaken);
							t = threadsRequired - t + 1;
						}

						break;
					}
				}
			}
		}

		let weakenHandled = IsWeakenHandled(target, threadsRequired);
		if (weakenHandled)
		{
			return true;
		}
	}

	return false;
}

/** @param {NS} ns */
function WeakenThreadsRequired(ns, security, minSecurity)
{
	let securityReduce = security - minSecurity;
	let baseWeakenAmount = ns.weakenAnalyze(1, 1);
	return Math.ceil(securityReduce / baseWeakenAmount);
}

/** @param {NS} ns */
function WeakenOrder(ns, delay, target, threads)
{
	let script = "/Hax/Weaken.js";
	let time = ns.getWeakenTime(target);
	let cost = GetCost(ns, script, threads);

	let order =
	{
		Pid: 0,
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

function IsWeakenHandled(target, threadsRequired)
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

function IsWeakenRunning(newWeaken)
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

function GetWeakenCount(target)
{
	let total = 0;

	let count = weaken_running.length;
	for (let i = 0; i < count; i++)
	{
		let weaken = weaken_running[i];
		if (weaken.Target == target)
		{
			total++;
		}
	}

	return total;
}

/*
	Handle growing
*/

/** @param {NS} ns */
function GrowTarget(ns, target, money, growThresh)
{
	let threadsRequired = GrowThreadsRequired(ns, target, money, growThresh);
	
	let growHandled = IsGrowHandled(ns, target, threadsRequired);
	if (growHandled)
	{
		return true;
	}

	for (let t = threadsRequired; t > 0; t--)
	{
		let cost = GetCost(ns, "/Hax/Grow.js", t);

		let availableCount = AvailableCount();
		for (let i = 0; i < availableCount; i++)
		{
			let host = available_servers[i];
			if (ns.serverExists(host))
			{
				let availableRam = AvailableRam(ns, host);
				if (availableRam >= cost)
				{
					let grow = GrowOrder(ns, 0, target, t);
					grow.Host = host;

					let growRunning = IsGrowRunning(grow);
					if (!growRunning)
					{
						let pid = ns.exec(grow.Script, grow.Host, grow.Threads, grow.Target, grow.Delay);
						if (pid > 0)
						{
							grow.Pid = pid;
							grow_running.push(grow);
							t = threadsRequired - t + 1;
						}

						break;
					}
				}
			}
		}

		let growHandled = IsGrowHandled(ns, target, threadsRequired);
		if (growHandled)
		{
			return true;
		}
	}
}

/** @param {NS} ns */
function GrowThreadsRequired(ns, target, money, growThresh)
{
	let growMulti = growThresh;
	if (money > 0)
	{
		growMulti = growThresh / money;
	}

	return Math.ceil(ns.growthAnalyze(target, growMulti, 1));
}

/** @param {NS} ns */
function GrowOrder(ns, delay, target, threads)
{
	let script = "/Hax/Grow.js";
	let time = ns.getGrowTime(target);
	let cost = GetCost(ns, script, threads);

	let order =
	{
		Pid: 0,
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
function IsGrowHandled(ns, target, threadsRequired)
{
	let money = ns.getServerMoneyAvailable(target);
	let maxMoney = ns.getServerMaxMoney(target);

	if (money >= maxMoney)
	{
		return true;
	}

	let totalThreads = 0;

	let count = grow_running.length;
	for (let i = 0; i < count; i++)
	{
		let grow = grow_running[i];
		if (grow.Target == target)
		{
			totalThreads += grow.Threads;

			if (totalThreads >= threadsRequired)
			{
				return true;
			}
		}
	}

	return false;
}

function IsGrowRunning(newGrow)
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

function GetGrowCount(target)
{
	let total = 0;

	let count = grow_running.length;
	for (let i = 0; i < count; i++)
	{
		let grow = grow_running[i];
		if (grow.Target == target)
		{
			total++;
		}
	}

	return total;
}

/*
	Support functions
*/

function AvailableCount()
{
	if (available_servers != null)
	{
		return available_servers.length;
	}

	return 0;
}

function IsServerPrepped(security, minSecurity, money, maxMoney)
{
	if (security <= minSecurity &&
			money >= maxMoney)
	{
		return true;
	}

	return false;
}

/** @param {NS} ns */
function GetCost(ns, script, threads)
{
	return ns.getScriptRam(script) * threads;
}

/** @param {NS} ns */
function AvailableRam(ns, host)
{
	return ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
}

/** @param {NS} ns */
function Maintenance(ns)
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

		let money = ns.getServerMoneyAvailable(grow.Target);
		let maxMoney = ns.getServerMaxMoney(grow.Target);

		if (now >= grow.EndTime ||
				money >= maxMoney)
		{
			if (money >= maxMoney)
			{
				ns.kill(grow.Pid);
			}

			grow_running.splice(i, 1);
			i--;
		}
	}

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
			
			weaken_running.splice(i, 1);
			i--;
		}
	}
}

/** @param {NS} ns */
function StopGrow(ns, target)
{
	for (let i = 0; i < grow_running.length; i++)
	{
		let grow = grow_running[i];
		if (grow.Target == target)
		{
			ns.kill(grow.Pid);
			grow_running.splice(i, 1);
			i--;
		}
	}
}

/** @param {NS} ns */
function StopWeaken(ns, target)
{
	for (let i = 0; i < weaken_running.length; i++)
	{
		let weaken = weaken_running[i];
		if (weaken.Target == target)
		{
			ns.kill(weaken.Pid);
			weaken_running.splice(i, 1);
			i--;
		}
	}
}

/*
	Logging
*/

function GenBody(t, target, security, minSecurity, money, maxMoney, batchCount, requiredHack)
{
	let securityColor = "LimeGreen";
	if (security > minSecurity * 2)
	{
		securityColor = "Red";
	}
	else if (security > minSecurity)
	{
		securityColor = "Yellow";
	}

	let moneyColor = "LimeGreen";
	if (money < maxMoney / 10)
	{
		moneyColor = "Red";
	}
	else if (money < maxMoney)
	{
		moneyColor = "Yellow";
	}

	let batchColor = "Black";
	if (batchCount > 0)
	{
		batchColor = "LimeGreen";
	}

	let weakenColor = "Black";
	let weakenCount = GetWeakenCount(target);
	if (weakenCount > 0)
	{
		weakenColor = "LimeGreen";
	}

	let growColor = "Black";
	let growCount = GetGrowCount(target);
	if (growCount > 0)
	{
		growColor = "LimeGreen";
	}

	body += `
		<tr>
			<td style="color:DarkGray;">${t}</td>
			<td style="color:${batchColor};">${batchCount}</td>
			<td style="color:White;">${target}</td>
			<td style="color:White;">${requiredHack}</td>
			<td style="color:${securityColor};">${security.toFixed(3)}</td>
			<td style="color:White;">${minSecurity.toFixed(2)}</td>
			<td style="color:${weakenColor};">${weakenCount}</td>
			<td style="color:${moneyColor};">$${money.toLocaleString()}</td>
			<td style="color:White;">$${maxMoney.toLocaleString()}</td>
			<td style="color:${growColor};">${growCount}</td>
		</tr>`;
}

/** @param {NS} ns */
function UpdateContainer(container)
{
	if (container != null)
	{
		let table = `<table border=1 style="width: 100%; height: 100%">`;
		let header = `
			<thead>
				<tr style="color:DarkGray;">
					<th>Target Index</th>
					<th>Batching</th>
					<th style="min-width: 200px;">Server</th>
					<th>Hack Level</th>
					<th>Security</th>
					<th>Min Security</th>
					<th>Weakening</th>
					<th style="width: 100%;">Money</th>
					<th>Max Money</th>
					<th>Growing</th>
				</tr>
			</thead>`;

		let final = "</tbody></table>";

		let content = table + header + body + final;
		container.innerHTML = content;
	}
}