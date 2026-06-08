const delayScale = 10;

/** @param {NS} ns */
export function BatchOrder(ns, now, host, target, security, minSecurity, maxMoney)
{
	let script = "/Hax/RunBatch.js";

	let Hack = HackOrder(ns, now, host, target, maxMoney);
	if (Hack == null)
	{
		return null;
	}

	let Grow = GrowOrder(ns, now, host, target, Hack.MoneyRemainder, maxMoney);
	if (Grow == null)
	{
		return null;
	}

	let weakenSecurity = security + Hack.SecurityDiff + Grow.SecurityDiff;
	let Weaken = WeakenOrder(ns, now, host, target, weakenSecurity, minSecurity);
	if (Weaken == null)
	{
		return null;
	}

	Grow.Delay = (Weaken.EndTime - (1 * delayScale)) - Grow.Time - now;
	Grow.EndTime = now + Grow.Delay + Grow.Time;

	Hack.Delay = (Weaken.EndTime - (2 * delayScale)) - Hack.Time - now;
	Hack.EndTime = now + Hack.Delay + Hack.Time;

	if (Hack.Threads > 0 && 
			Grow.Threads > 0 &&
			Weaken.Threads > 0)
	{
		let orders = [];
		orders.push(Hack);
		orders.push(Grow);
		orders.push(Weaken);

		let totalCost = ns.getScriptRam(script) + Hack.Cost + Grow.Cost + Weaken.Cost;
		let totalThreads = Hack.Threads + Grow.Threads + Weaken.Threads;
		let endTime = now + Weaken.Time + (2 * delayScale);

		let batch =
		{
			Host: host,
			Target: target,
			StartTime: now,
			EndTime: endTime,
			Cost: totalCost,
			Script: script,
			Threads: totalThreads,
			Orders: orders
		}

		return batch;
	}
	
	return null;
}

/** @param {NS} ns */
export function HackOrder(ns, now, host, target, maxMoney)
{
	let script = "/Hax/Hack.js";

	let threads = Math.ceil(ns.hackAnalyzeThreads(target, maxMoney * 0.1));
	for (let t = threads; t > 0; t--)
	{
		const availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
		let cost = ns.getScriptRam(script) * t;

		if (cost <= availableRam)
		{
			let hackPercent = ns.hackAnalyze(target) * t;
			let moneyRemainder = maxMoney * (1 - hackPercent);
			let securityDiff = ns.hackAnalyzeSecurity(t, target);
			let time = ns.getHackTime(target);

			const order =
			{
				Pid: 0,
				Host: host,
				Target: target,
				Delay: 0,
				StartTime: now,
				EndTime: now + time,
				Time: time,
				Cost: cost,
				Script: script,
				Threads: t,
				SecurityDiff: securityDiff,
				MoneyRemainder: moneyRemainder
			}

			return order;
		}
	}
	
	return null;
}

/** @param {NS} ns */
export function GrowOrder(ns, now, host, target, money, maxMoney)
{
	let script = "/Hax/Grow.js";

	let growMulti = 1;
	if (money > 0)
	{
		growMulti = maxMoney / money;
	}

	let threads = Math.ceil(ns.growthAnalyze(target, growMulti, 1));
	for (let t = threads; t > 0; t--)
	{
		const availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
		let cost = ns.getScriptRam(script) * t;

		if (cost <= availableRam)
		{
			let securityDiff = ns.growthAnalyzeSecurity(t);
			let time = ns.getHackTime(target);

			const order =
			{
				Pid: 0,
				Host: host,
				Target: target,
				Delay: 0,
				StartTime: now,
				EndTime: now + time,
				Time: time,
				Cost: cost,
				Script: script,
				Threads: t,
				SecurityDiff: securityDiff,
			}

			return order;
		}
	}

	return null;
}

/** @param {NS} ns */
export function WeakenOrder(ns, now, host, target, security, minSecurity)
{
	let script = "/Hax/Weaken.js";

	let baseWeakenAmount = ns.weakenAnalyze(1);
	let securityReduce = security - minSecurity;
	let threads = Math.ceil(securityReduce / baseWeakenAmount);
	for (let t = threads; t > 0; t--)
	{
		const availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
		let cost = ns.getScriptRam(script) * t;

		if (cost <= availableRam)
		{
			let time = ns.getWeakenTime(target);
			let securityDiff = ns.weakenAnalyze(t);
			
			const order =
			{
				Pid: 0,
				Host: host,
				Target: target,
				Delay: 0,
				StartTime: now,
				EndTime: now + time,
				Time: time,
				Cost: cost,
				Script: script,
				Threads: t,
				SecurityDiff: securityDiff
			}

			return order;
		}
	}
	
	return null;
}