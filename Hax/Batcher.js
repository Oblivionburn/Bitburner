import * as Queue from "/Hax/Queue.js";
import * as IO from "/Hax/IO.js";
import * as Orders from "/Hax/Orders.js";

/** @param {NS} ns */
export async function SendBatch(ns, host, target, security, minSecurity, maxMoney)
{
	if (ns.serverExists(host))
	{
		const availableRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host);
		const order = Orders.BatchOrder(ns, Date.now(), host, target, security, minSecurity, maxMoney);
		if (order)
		{
			if (order.Cost <= availableRam)
			{
				let result = await RunBatch(ns, order);
				return result;
			}
		}
	}

	return false;
}

/** @param {NS} ns */
export async function RunBatch(ns, order)
{
	const str = JSON.stringify(order);
	const pid = ns.exec(order.Script, order.Host, 1, str);
	if (pid > 0)
	{
		let hackStarted = false;
		let growStarted = false;
		let weakenStarted = false;

		while (true)
		{
			const errorData = Queue.Error_GetData("Error", order.Host, order.Target);
			if (errorData)
			{
				//ns.tprint(errorData.Error);
				return false;
			}

			if (!hackStarted)
			{
				const hackData = Queue.Hack_GetData("Started", order.Host, order.Target);
				if (hackData)
				{
					let hack_running = IO.Read(ns, "hack_running");
					hack_running.push(JSON.parse(hackData.Order));
					IO.Write(ns, "hack_running", hack_running);
					hackStarted = true;
				}
			}
			
			if (!growStarted)
			{
				const growData = Queue.Grow_GetData("Started", order.Host, order.Target);
				if (growData)
				{
					let grow_running = IO.Read(ns, "grow_running");
					grow_running.push(JSON.parse(growData.Order));
					IO.Write(ns, "grow_running", grow_running);
					growStarted = true;
				}
			}

			if (!weakenStarted)
			{
				const weakenData = Queue.Weaken_GetData("Started", order.Host, order.Target);
				if (weakenData)
				{
					let weaken_running = IO.Read(ns, "weaken_running");
					weaken_running.push(JSON.parse(weakenData.Order));
					IO.Write(ns, "weaken_running", weaken_running);
					weakenStarted = true;
				}
			}

			if (hackStarted &&
					growStarted &&
					weakenStarted)
			{
				return true;
			}

			await ns.sleep(1);
		}
	}

	return false;
}