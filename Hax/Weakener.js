import * as Queue from "/Hax/Queue.js";
import * as IO from "/Hax/IO.js";
import * as Orders from "/Hax/Orders.js";

/** @param {NS} ns */
export async function WeakenTarget(ns, host, target, security, minSecurity)
{
	if (ns.serverExists(host))
	{
		let weaken_running = IO.Read(ns, "weaken_running");

		if (IsRunning(host, target, weaken_running))
		{
			return false;
		}

		const order = Orders.WeakenOrder(ns, Date.now(), host, target, security, minSecurity);
		if (order)
		{
			let result = await RunWeaken(ns, order, weaken_running);
			return result;
		}
	}

	return false;
}

/** @param {NS} ns */
export async function RunWeaken(ns, order, weaken_running)
{
	const str = JSON.stringify(order);
	const pid = ns.exec(order.Script, order.Host, order.Threads, str);
	if (pid > 0)
	{
		order.Pid = pid;

		while (true)
		{
			const data = Queue.Weaken_GetData("Started", order.Host, order.Target);
			if (data)
			{
				weaken_running.push(order);
				IO.Write(ns, "weaken_running", weaken_running);
				return true;
			}
			
			await ns.sleep(1);
		}		
	}

	return false;
}

export function IsRunning(host, target, weaken_running)
{
	const count = weaken_running.length;
	for (let i = 0; i < count; i++)
	{
		const order = weaken_running[i];
		if (order.Target == target &&
				order.Host == host &&
				Date.now() < order.EndTime)
		{
			return true;
		}
	}

	return false;
}