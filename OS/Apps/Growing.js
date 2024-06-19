import * as Util from "./OS/Apps/Util.js";
import * as Ordering from "./OS/Apps/Ordering.js";
import * as BUS from "./OS/BUS.js";
import * as HDD from "./OS/HDD.js";

/** @param {NS} ns */
export async function GrowTarget(ns, target, money, growThresh, available_servers, grow_running)
{
	let threadsRequired = GrowThreadsRequired(ns, target, money, growThresh);
	
	let growHandled = IsGrowHandled(ns, target, threadsRequired, grow_running);
	if (growHandled)
	{
		return true;
	}

	for (let t = threadsRequired; t > 0; t--)
	{
		let cost = Util.GetCost(ns, "/OS/Apps/Grow.js", t);

		let availableCount = Util.GetLength(available_servers);
		for (let i = 0; i < availableCount; i++)
		{
			let host = available_servers[i].Name;
			if (ns.serverExists(host))
			{
				let availableRam = Util.AvailableRam(ns, host);
				if (availableRam >= cost)
				{
					let grow = Ordering.GrowOrder(ns, 0, target, t);
					grow.Host = host;

					let growRunning = IsGrowRunning(grow, grow_running);
					if (!growRunning)
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

		let growHandled = IsGrowHandled(ns, target, threadsRequired, grow_running);
		if (growHandled)
		{
			return true;
		}
	}
}

/** @param {NS} ns */
export function GrowThreadsRequired(ns, target, money, growThresh)
{
	let growMulti = growThresh;
	if (money > 0)
	{
		growMulti = growThresh / money;
	}

	return Math.ceil(ns.growthAnalyze(target, growMulti, 1));
}

/** @param {NS} ns */
export function IsGrowHandled(ns, target, threadsRequired, grow_running)
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

export function IsGrowRunning(newGrow, grow_running)
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

export function GetGrowCount(target, grow_running)
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