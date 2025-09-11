import * as Util from "/OS/Apps/Util.js";
import * as Ordering from "/OS/Apps/Ordering.js";
import * as BUS from "/OS/BUS.js";
import * as HDD from "/OS/HDD.js";

/** @param {NS} ns */
export async function GrowTarget(ns, host, target, money, maxMoney, grow_running)
{
	let threadsRequired = GrowThreadsRequired(ns, target, money, maxMoney);

	let growRunning = IsGrowRunning(host, target, grow_running);
	let threadsRemaining = GrowThreadsRemaining(target, threadsRequired, grow_running);

	if (threadsRemaining <= 0 ||
			growRunning)
	{
		return true;
	}

	let availableRam = Util.AvailableRam(ns, host);

	for (let threads = 1; threads <= threadsRequired; threads++)
	{
		let grow = Ordering.GrowOrder(ns, 0, target, threads);
		if (grow.Cost > availableRam)
		{
			for (let t = threads - 1; t > 0; t--)
			{
				grow = Ordering.GrowOrder(ns, 0, target, t);
				if (grow.Cost <= availableRam)
				{
					grow.Host = host;
					let result = await RunGrow(ns, grow, grow_running);
					return result;
				}
			}

			break;
		}
		else if (threads >= threadsRequired &&
						 grow.Cost <= availableRam)
		{
			grow.Host = host;
			let result = await RunGrow(ns, grow, grow_running);
			return result;
		}
	}

	return false;
}

/** @param {NS} ns */
export async function RunGrow(ns, grow, grow_running)
{
	let pid = ns.exec(grow.Script, grow.Host, grow.Threads, grow.Target, grow.Delay);
	if (pid > 0)
	{
		grow.Pid = pid;

		while (true)
		{
			let grow_message = BUS.GetMessage_Grow("Started", grow.Host, grow.Target);
			if (grow_message != null)
			{
				ns.print(`Grow Started: {Host:${grow_message.Host}, Target:${grow_message.Target}}`);
				grow_running.push(grow);
				HDD.Write(ns, "grow_running", grow_running);
				return true;
			}
			
			await ns.sleep(1);
		}
	}
	else
	{
		ns.print(`Grow Failed: {Host:${grow.Host}, Target:${grow.Target}}`);
	}

	return false;
}

/** @param {NS} ns */
export function GrowThreadsRequired(ns, target, money, maxMoney)
{
	let growMulti = 1;
	if (money > 0)
	{
		growMulti = maxMoney / money;
	}

	return Math.ceil(ns.growthAnalyze(target, growMulti, 1));
}

export function GrowThreadsRemaining(target, threadsRequired, grow_running)
{
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
				return 0;
			}
		}
	}

	return threadsRequired - totalThreads;
}

export function IsGrowRunning(host, target, grow_running)
{
	let count = grow_running.length;
	for (let i = 0; i < count; i++)
	{
		let grow = grow_running[i];
		if (grow.Target == target &&
				grow.Host == host &&
				Date.now() < grow.EndTime)
		{
			return true;
		}
	}

	return false;
}

/** @param {NS} ns */
export function StopGrow(ns, target, grow_running)
{
	for (let i = 0; i < grow_running.length; i++)
	{
		let grow = grow_running[i];
		if (grow.Target == target)
		{
			ns.kill(grow.Pid);
			grow_running.splice(i, 1);
			HDD.Write(ns, "grow_running", grow_running);
			i--;
		}
	}
}