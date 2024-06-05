import * as Util from "./OS/Apps/Util.js";

/** @param {NS} ns */
export function BatchHackOrder(ns, now, target, maxMoney, scale, threshFactor)
{
	let script = "/OS/Apps/Hack.js";
	let threads = Math.ceil(ns.hackAnalyzeThreads(target, maxMoney * threshFactor) * scale);
	let moneyStolen = ns.hackAnalyze(target) * threads;
	let securityDiff = ns.hackAnalyzeSecurity(threads, target) + 1;
	let time = ns.getHackTime(target);
	let cost = Util.GetCost(ns, script, threads);

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
export function BatchWeakenOrder(ns, delay, now, target, security, minSecurity, scale)
{
	let script = "/OS/Apps/Weaken.js";
	let baseWeakenAmount = ns.weakenAnalyze(1, 1);
	let time = ns.getWeakenTime(target);
	let securityReduce = security - minSecurity;
	let threads = Math.ceil((securityReduce / baseWeakenAmount) * scale);
	let cost = Util.GetCost(ns, script, threads);
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
export function BatchGrowOrder(ns, now, target, money, maxMoney, scale)
{
	let growMulti = maxMoney;
	if (money > 0)
	{
		growMulti = maxMoney / money;
	}

	let script = "/OS/Apps/Grow.js";
	let threads = Math.ceil(ns.growthAnalyze(target, Math.ceil(growMulti), 1) * scale) + 1;

	if (target == "foodnstuff")
	{
		threads += 2;
	}

	let securityDiff = ns.growthAnalyzeSecurity(threads) + 1;
	let time = ns.getGrowTime(target);
	let cost = Util.GetCost(ns, script, threads);

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
export function WeakenOrder(ns, delay, target, threads)
{
	let script = "/OS/Apps/Weaken.js";
	let time = ns.getWeakenTime(target);
	let cost = Util.GetCost(ns, script, threads);

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
export function GrowOrder(ns, delay, target, threads)
{
	let script = "/OS/Apps/Grow.js";
	let time = ns.getGrowTime(target);
	let cost = Util.GetCost(ns, script, threads);

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