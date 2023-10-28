import * as UI from "./Hax/UI.js";
import * as IO from "./Hax/IO.js";

let available_servers = [];
let targets = [];
let batches_running = [];
let grow_running = [];
let weaken_running = [];
let growThreshFactor = 0.1;
let body = "";

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

		await Batching(ns, targets);
		await UpdateContainer(container);
		await Maintenance();

		await ns.sleep(1);
	}
}

/** @param {NS} ns */
async function Batching(ns, targets)
{
	if (targets != null &&
			targets.length > 0)
	{
		let targetCount = targets.length;
		for (let t = 0; t < targetCount; t++)
		{
			let target = targets[t];

			let requiredHack = ns.getServerRequiredHackingLevel(target);
			let money = ns.getServerMoneyAvailable(target);
			let maxMoney = ns.getServerMaxMoney(target);
			let security = ns.getServerSecurityLevel(target);
			let minSecurity = ns.getServerMinSecurityLevel(target);
			let growThresh = maxMoney * growThreshFactor;

			let batchCount = await GetBatchCount(target);
			await GenBody(t, target, security, minSecurity, money, maxMoney, batchCount, requiredHack);

			let prepped = await IsServerPrepped(security, minSecurity, money, growThresh);
			if (prepped ||
					batchCount > 0)
			{
				StopWeaken(ns, target);
				StopGrow(ns, target);

				for (let scale = 1.0; scale > 0; scale -= 0.2)
				{
					let Batch = await CreateBatch(ns, target, security, minSecurity, money, maxMoney, scale);
					if (Batch != null)
					{
						let sent = await SendBatch(ns, Batch);

						if (sent)
						{
							break;
						}
					}
				}
			}
			else
			{
				if (security > minSecurity &&
						batchCount == 0)
				{
					await WeakenTarget(ns, target, security, minSecurity);
				}
				else if (money < growThresh &&
								 batchCount == 0)
				{
					StopWeaken(ns, target);

					await GrowTarget(ns, target, money, growThresh);
				}
			}
		}
	}
}

/*
	Handle batching
*/

/** @param {NS} ns */
async function CreateBatch(ns, target, security, minSecurity, money, maxMoney, scale)
{
	let growThresh = maxMoney * growThreshFactor;

	//Time diff between batches = 4ms
	let Hack = await BatchHackOrder(ns, 0, target, maxMoney, scale);
	let hackSecurityIncrease = security + Hack.SecurityDiff;
	let moneyStolen = growThresh * scale;

	let WeakenOne = await BatchWeakenOrder(ns, 0, target, hackSecurityIncrease, minSecurity, scale);

	let Grow = await BatchGrowOrder(ns, 0, target, money - moneyStolen, growThresh, scale);
	let growSecurityIncrease = security + Grow.SecurityDiff;

	//ns.print(`${colors["white"] + DTStamp() + colors["red"] + "Grow Security: " + growSecurityIncrease}`);
	let WeakenTwo = await BatchWeakenOrder(ns, 2, target, security + growSecurityIncrease, minSecurity, scale);

	Grow.Delay = (WeakenOne.Time - ns.getGrowTime(target)) + 1;
	Hack.Delay = (WeakenOne.Time - ns.getHackTime(target)) - 1;

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
		let endTime = Date.now() + WeakenOne.Time + 2;

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
async function BatchHackOrder(ns, delay, target, maxMoney, scale)
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
async function BatchWeakenOrder(ns, delay, target, security, minSecurity, scale)
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
async function BatchGrowOrder(ns, delay, target, money, growThresh, scale)
{
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

			let availableRam = await AvailableRam(ns, host);
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

async function GetBatchCount(target)
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

/*
	Handle weakening
*/

/** @param {NS} ns */
async function WeakenTarget(ns, target, security, minSecurity)
{
	let threadsRequired = await WeakenThreadsRequired(ns, security, minSecurity);

	let weakenHandled = await IsWeakenHandled(target, threadsRequired);
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
					let weaken = await WeakenOrder(ns, 0, target, t);
					weaken.Host = host;

					let weakenRunning = await IsWeakenRunning(weaken);
					if (!weakenRunning)
					{
						ns.exec(weaken.Script, weaken.Host, weaken.Threads, weaken.Target, weaken.Delay);
						weaken_running.push(weaken);

						t = threadsRequired - t + 1;

						break;
					}
				}
			}
		}

		let weakenHandled = await IsWeakenHandled(target, threadsRequired);
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

/** @param {NS} ns */
async function WeakenOrder(ns, delay, target, threads)
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

async function IsWeakenHandled(target, threadsRequired)
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

async function GetWeakenCount(target)
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
async function GrowTarget(ns, target, money, growThresh)
{
	let threadsRequired = await GrowThreadsRequired(ns, target, money, growThresh);
	
	let growHandled = await IsGrowHandled(ns, target, threadsRequired);
	if (growHandled)
	{
		return true;
	}

	for (let t = threadsRequired; t > 0; t--)
	{
		let cost = await GetCost(ns, "/Hax/Grow.js", t);

		let availableCount = await AvailableCount();
		for (let i = 0; i < availableCount; i++)
		{
			let host = available_servers[i];
			if (ns.serverExists(host))
			{
				let availableRam = await AvailableRam(ns, host);
				if (availableRam >= cost)
				{
					let grow = await GrowOrder(ns, 0, target, t);
					grow.Host = host;

					let growRunning = await IsGrowRunning(grow);
					if (!growRunning)
					{
						ns.exec(grow.Script, grow.Host, grow.Threads, grow.Target, grow.Delay);
						grow_running.push(grow);

						t = threadsRequired - t + 1;

						break;
					}
				}
			}
		}

		let growHandled = await IsGrowHandled(ns, target, threadsRequired);
		if (growHandled)
		{
			return true;
		}
	}
}

/** @param {NS} ns */
async function GrowThreadsRequired(ns, target, money, growThresh)
{
	let growMulti = growThresh;
	if (money > 0)
	{
		growMulti = growThresh / money;
	}

	return Math.ceil(ns.growthAnalyze(target, 1 + Math.ceil(growMulti), 1));
}

/** @param {NS} ns */
async function GrowOrder(ns, delay, target, threads)
{
	let script = "/Hax/Grow.js";
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
		Threads: threads
	}

	return order;
}

/** @param {NS} ns */
async function IsGrowHandled(ns, target, threadsRequired)
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

async function GetGrowCount(target)
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

/** @param {NS} ns */
async function StopGrow(ns, target)
{
	for (let i = 0; i < grow_running.length; i++)
	{
		if (grow_running[i].Target == target)
		{
			ns.scriptKill("/Hax/Grow.js", target);
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
			ns.scriptKill("/Hax/Weaken.js", target);
			weaken_running.splice(i, 1);
			i--;
		}
	}
}

/*
	Logging
*/

async function GenBody(t, target, security, minSecurity, money, maxMoney, batchCount, requiredHack)
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
	let weakenCount = await GetWeakenCount(target);
	if (weakenCount > 0)
	{
		weakenColor = "LimeGreen";
	}

	let growColor = "Black";
	let growCount = await GetGrowCount(target);
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
async function UpdateContainer(container)
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