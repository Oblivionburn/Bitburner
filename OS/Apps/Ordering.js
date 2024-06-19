import * as Util from "./OS/Apps/Util.js";

/** @param {NS} ns */
export function BatchHackOrder(ns, now, target, maxMoney, scale, threshFactor)
{
	let script = "/OS/Apps/Hack.js";
	let threads = Math.ceil(ns.hackAnalyzeThreads(target, maxMoney * threshFactor) * scale);
	let hackPercent = ns.hackAnalyze(target) * threads;
	let moneyRemainder = maxMoney * (1 - hackPercent);
	let securityDiff = ns.hackAnalyzeSecurity(threads, target);
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
		MoneyRemainder: moneyRemainder
	}

	return order;
}

/** @param {NS} ns */
export function BatchWeakenOrder(ns, delay, now, target, security, minSecurity, scale)
{
	let script = "/OS/Apps/Weaken.js";
	let baseWeakenAmount = ns.weakenAnalyze(1);
	let time = ns.getWeakenTime(target);
	let securityReduce = security - minSecurity;
	let threads = Math.ceil((securityReduce / baseWeakenAmount) * scale) + 2;
	let cost = Util.GetCost(ns, script, threads);
	let securityDiff = ns.weakenAnalyze(threads);
	
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
	let threads = Math.ceil(ns.growthAnalyze(target, growMulti)) * 2;
	let securityDiff = ns.growthAnalyzeSecurity(threads);
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