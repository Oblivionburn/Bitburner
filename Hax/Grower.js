import * as Queue from "/Hax/Queue.js";
import * as IO from "/Hax/IO.js";
import * as Orders from "/Hax/Orders.js";

/** @param {NS} ns */
export async function GrowTarget(ns, host, target, money, maxMoney)
{
	if (ns.serverExists(host))
	{
		let grow_running = IO.Read(ns, "grow_running");

		if (IsRunning(host, target, grow_running))
		{
			return false;
		}

		const order = Orders.GrowOrder(ns, Date.now(), host, target, money, maxMoney);
		if (order)
		{
			let result = await RunGrow(ns, order, grow_running);
			return result;
		}
	}

	return false;
}

/** @param {NS} ns */
export async function RunGrow(ns, order, grow_running)
{
	const str = JSON.stringify(order);
	const pid = ns.exec(order.Script, order.Host, order.Threads, str);
	if (pid > 0)
	{
		order.Pid = pid;

		while (true)
		{
			const data = Queue.Grow_GetData("Started", order.Host, order.Target);
			if (data)
			{
				grow_running.push(order);
				IO.Write(ns, "grow_running", grow_running);
				return true;
			}
			
			await ns.sleep(1);
		}
	}

	return false;
}

export function IsRunning(host, target, grow_running)
{
	const count = grow_running.length;
	for (let i = 0; i < count; i++)
	{
		const order = grow_running[i];
		if (order.Target == target &&
				order.Host == host &&
				Date.now() < order.EndTime)
		{
			return true;
		}
	}

	return false;
}