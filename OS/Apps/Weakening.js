import * as Util from "/OS/Apps/Util.js";
import * as Ordering from "/OS/Apps/Ordering.js";
import * as BUS from "/OS/BUS.js";
import * as HDD from "/OS/HDD.js";

/** @param {NS} ns */
export async function WeakenTarget(ns, host, target, security, minSecurity, weaken_running)
{
	let threadsRequired = WeakenThreadsRequired(ns, security, minSecurity);

	let weakenRunning = IsWeakenRunning(host, target, weaken_running);
	let threadsRemaining = WeakenThreadsRemaining(target, threadsRequired, weaken_running);

	if (threadsRemaining <= 0 ||
			weakenRunning)
	{
		return true;
	}

	let availableRam = Util.AvailableRam(ns, host);

	for (let threads = 1; threads <= threadsRequired; threads++)
	{
		let weaken = Ordering.WeakenOrder(ns, 0, target, threads);
		if (weaken.Cost > availableRam)
		{
			for (let t = threads - 1; t > 0; t--)
			{
				weaken = Ordering.WeakenOrder(ns, 0, target, t);
				if (weaken.Cost <= availableRam)
				{
					weaken.Host = host;
					let result = await RunWeaken(ns, weaken, weaken_running);
					return result;
				}
			}

			break;
		}
		else if (threads >= threadsRequired &&
						 weaken.Cost <= availableRam)
		{
			weaken.Host = host;
			let result = await RunWeaken(ns, weaken, weaken_running);
			return result;
		}
	}

	return false;
}

/** @param {NS} ns */
export async function RunWeaken(ns, weaken, weaken_running)
{
	let pid = ns.exec(weaken.Script, weaken.Host, weaken.Threads, weaken.Target, weaken.Delay);
	if (pid > 0)
	{
		weaken.Pid = pid;

		while (true)
		{
			let weaken_message = BUS.GetMessage_Weaken("Started", weaken.Host, weaken.Target);
			if (weaken_message != null)
			{
				ns.print(`Weaken Started: {Host:${weaken_message.Host}, Target:${weaken_message.Target}}`);
				weaken_running.push(weaken);
				HDD.Write(ns, "weaken_running", weaken_running);
				return true;
			}
			
			await ns.sleep(1);
		}		
	}
	else
	{
		ns.print(`Weaken Failed: {Host:${weaken.Host}, Target:${weaken.Target}}`);
	}

	return false;
}

/** @param {NS} ns */
export function WeakenThreadsRequired(ns, security, minSecurity)
{
	let securityReduce = security - minSecurity;
	let baseWeakenAmount = ns.weakenAnalyze(1, 1);
	return Math.ceil(securityReduce / baseWeakenAmount);
}

export function WeakenThreadsRemaining(target, threadsRequired, weaken_running)
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
				return 0;
			}
		}
	}

	return threadsRequired - totalThreads;
}

export function IsWeakenRunning(host, target, weaken_running)
{
	let count = weaken_running.length;
	for (let i = 0; i < count; i++)
	{
		let weaken = weaken_running[i];
		if (weaken.Target == target &&
				weaken.Host == host &&
				Date.now() < weaken.EndTime)
		{
			return true;
		}
	}

	return false;
}

/** @param {NS} ns */
export function StopWeaken(ns, target, weaken_running)
{
	for (let i = 0; i < weaken_running.length; i++)
	{
		let weaken = weaken_running[i];
		if (weaken.Target == target)
		{
			ns.kill(weaken.Pid);
			weaken_running.splice(i, 1);
			HDD.Write(ns, "weaken_running", weaken_running);
			i--;
		}
	}
}