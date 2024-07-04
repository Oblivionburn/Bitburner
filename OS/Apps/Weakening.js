import * as Util from "/OS/Apps/Util.js";
import * as Ordering from "/OS/Apps/Ordering.js";
import * as BUS from "/OS/BUS.js";
import * as HDD from "/OS/HDD.js";

/** @param {NS} ns */
export async function WeakenTarget(ns, target, security, minSecurity, available_servers, weaken_running)
{
	let threadsRequired = WeakenThreadsRequired(ns, security, minSecurity);

	let weakenHandled = IsWeakenHandled(target, threadsRequired, weaken_running);
	if (weakenHandled)
	{
		return true;
	}

	for (let t = threadsRequired; t > 0; t--)
	{
		let cost = Util.GetCost(ns, "/OS/Apps/Weaken.js", t);

		let availableCount = Util.GetLength(available_servers);
		for (let i = 0; i < availableCount; i++)
		{
			let host = available_servers[i].Name;
			if (ns.serverExists(host))
			{
				let availableRam = Util.AvailableRam(ns, host);
				if (availableRam >= cost)
				{
					let weaken = Ordering.WeakenOrder(ns, 0, target, t);
					weaken.Host = host;

					let weakenRunning = IsWeakenRunning(weaken, weaken_running);
					if (!weakenRunning)
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
									break;
								}
								
								await ns.sleep(1);
							}
							
							t = threadsRequired - t + 1;
						}

						break;
					}
				}
			}
		}

		let weakenHandled = IsWeakenHandled(target, threadsRequired, weaken_running);
		if (weakenHandled)
		{
			return true;
		}
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

export function IsWeakenHandled(target, threadsRequired, weaken_running)
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

export function IsWeakenRunning(newWeaken, weaken_running)
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

export function GetWeakenCount(target, weaken_running)
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