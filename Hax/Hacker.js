import * as Queue from "/Hax/Queue.js";
import * as IO from "/Hax/IO.js";
import * as Orders from "/Hax/Orders.js";

/** @param {NS} ns */
export async function HackTarget(ns, host, target, maxMoney)
{
	if (ns.serverExists(host))
	{
		let hack_running = IO.Read(ns, "hack_running");

		if (IsRunning(host, target, hack_running))
		{
			return false;
		}

		const order = Orders.HackOrder(ns, Date.now(), host, target, maxMoney);
		if (order)
		{
			let result = await RunHack(ns, order, hack_running);
			return result;
		}
	}

	return false;
}

/** @param {NS} ns */
export async function RunHack(ns, order, hack_running)
{
	const str = JSON.stringify(order);
	const pid = ns.exec(order.Script, order.Host, order.Threads, str);
	if (pid > 0)
	{
		order.Pid = pid;

		while (true)
		{
			const data = Queue.Hack_GetData("Started", order.Host, order.Target);
			if (data)
			{
				hack_running.push(order);
				IO.Write(ns, "hack_running", hack_running);
				return true;
			}
			
			await ns.sleep(1);
		}		
	}

	return false;
}

export function IsRunning(host, target, hack_running)
{
	const count = hack_running.length;
	for (let i = 0; i < count; i++)
	{
		const order = hack_running[i];
		if (order.Target == target &&
				order.Host == host &&
				Date.now() < order.EndTime)
		{
			return true;
		}
	}

	return false;
}